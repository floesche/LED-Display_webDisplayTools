/**
 * bin-classifier.js — turn an uploaded .bin / .pat into G6 stream-frame bodies.
 *
 * Pure bytes-in / bytes-out: no DOM, no I/O. Given a raw pattern .bin (classified
 * by size) or a G6PT .pat container (sliced frame-by-frame), it produces the
 * `"FR" + index16 + 20 panel-blocks` body that ArenaWireG6.encodeStreamFrame()
 * wraps into a STREAM_FRAME (0x32) request — 1064 B (GS2) or 4064 B (GS16). The
 * size map matches Arena-Firmware/scripts/web-serial. Keeping it pure makes it
 * Node-testable (see tests/test-bin-classifier.js) and reusable by any tool.
 *
 * Used by: webDisplayTools/arena_console.html ("Load file…" in the stream group).
 */
const BinClassifier = (function () {
    'use strict';

    const NUM_PANELS = 20;
    const GS2_BLOCK = 53; // header(1) + cmd(1) + 50 pixels + duty(1)
    const GS16_BLOCK = 203; // header(1) + cmd(1) + 200 pixels + duty(1)
    const FRAME_PREFIX = 4; // "FR" + index16
    const G6_HEADER_SIZE = 18; // V2 .pat header
    const G6PT_MAGIC = [0x47, 0x36, 0x50, 0x54]; // "G6PT"

    /** True if `buf` starts with the G6PT (.pat V2) magic. */
    function isPat(buf) {
        return (
            buf.length >= G6_HEADER_SIZE &&
            buf[0] === G6PT_MAGIC[0] &&
            buf[1] === G6PT_MAGIC[1] &&
            buf[2] === G6PT_MAGIC[2] &&
            buf[3] === G6PT_MAGIC[3]
        );
    }

    const popcount = (x) => {
        let c = 0;
        while (x) {
            c += x & 1;
            x >>>= 1;
        }
        return c;
    };

    /** Even parity over {version_bits, cmd, payload} → header bit 7 (g6_01 § Header). */
    function parityBit(versionByte, cmd, payload) {
        let ones = popcount(versionByte & 0x7f) + popcount(cmd);
        for (const b of payload) ones += popcount(b);
        return ones & 1;
    }

    /**
     * Wrap raw panel pixels (50 GS2 / 200 GS16) into a parity-correct v1 panel
     * block; the last byte is the per-LED duty_cycle (0–255).
     */
    function wrapPixelBlock(gs16, pixels, duty) {
        const blockLen = gs16 ? GS16_BLOCK : GS2_BLOCK;
        const cmd = gs16 ? 0x30 : 0x10;
        const block = new Uint8Array(blockLen);
        block[1] = cmd;
        block.set(pixels, 2);
        block[2 + pixels.length] = duty & 0xff;
        block[0] = 0x01 | (parityBit(0x01, cmd, block.subarray(2, blockLen)) << 7);
        return block;
    }

    /** Concatenate a 4-byte "FR"+index0 prefix with NUM_PANELS equal-length blocks. */
    function frameBodyFromBlocks(blocks) {
        const blockLen = blocks[0].length;
        const body = new Uint8Array(FRAME_PREFIX + NUM_PANELS * blockLen);
        body[0] = 0x46; // "F"
        body[1] = 0x52; // "R"; index16 stays 0
        for (let p = 0; p < NUM_PANELS; p++) {
            body.set(blocks[p], FRAME_PREFIX + p * blockLen);
        }
        return body;
    }

    /**
     * Classify a raw (non-.pat) .bin by size → one stream-frame body.
     * @returns {{gs16:boolean, body:Uint8Array}|null} null if the size is unknown.
     */
    function classifyBin(buf, duty) {
        const n = buf.length;
        const replicate = (gs16) =>
            frameBodyFromBlocks(Array(NUM_PANELS).fill(wrapPixelBlock(gs16, buf, duty)));
        const perPanel = (gs16, plen) => {
            const blocks = [];
            for (let p = 0; p < NUM_PANELS; p++) {
                blocks.push(wrapPixelBlock(gs16, buf.subarray(p * plen, (p + 1) * plen), duty));
            }
            return frameBodyFromBlocks(blocks);
        };
        const replicateBlock = () => frameBodyFromBlocks(Array(NUM_PANELS).fill(buf));
        const prefixBlocks = () => {
            const body = new Uint8Array(FRAME_PREFIX + n);
            body[0] = 0x46;
            body[1] = 0x52;
            body.set(buf, FRAME_PREFIX);
            return body;
        };
        switch (n) {
            case 50:
                return { gs16: false, body: replicate(false) };
            case 200:
                return { gs16: true, body: replicate(true) };
            case 50 * NUM_PANELS: // 1000
                return { gs16: false, body: perPanel(false, 50) };
            case 200 * NUM_PANELS: // 4000
                return { gs16: true, body: perPanel(true, 200) };
            case GS2_BLOCK: // 53
                return { gs16: false, body: replicateBlock() };
            case GS16_BLOCK: // 203
                return { gs16: true, body: replicateBlock() };
            case GS2_BLOCK * NUM_PANELS: // 1060
                return { gs16: false, body: prefixBlocks() };
            case GS16_BLOCK * NUM_PANELS: // 4060
                return { gs16: true, body: prefixBlocks() };
            case FRAME_PREFIX + GS2_BLOCK * NUM_PANELS: // 1064
                return { gs16: false, body: buf };
            case FRAME_PREFIX + GS16_BLOCK * NUM_PANELS: // 4064
                return { gs16: true, body: buf };
            default:
                return null;
        }
    }

    /**
     * Slice every frame's "FR"+blocks body (excluding the per-frame CRC-16) out
     * of a G6PT .pat. Header byte 8 = rows, 9 = cols, 10 = gs_val (1=GS2, 2=GS16).
     * @returns {{gs16:boolean, numPanels:number, bodies:Uint8Array[]}}
     */
    function patFrameBodies(buf) {
        const gs16 = buf[10] === 2;
        const numPanels = buf[8] * buf[9];
        const blockLen = gs16 ? GS16_BLOCK : GS2_BLOCK;
        const bodyLen = FRAME_PREFIX + numPanels * blockLen; // excl. CRC-16
        const stride = bodyLen + 2; // + per-frame CRC-16 trailer
        const bodies = [];
        for (let off = G6_HEADER_SIZE; off + bodyLen <= buf.length; off += stride) {
            bodies.push(buf.subarray(off, off + bodyLen));
        }
        return { gs16, numPanels, bodies };
    }

    return {
        NUM_PANELS,
        GS2_BLOCK,
        GS16_BLOCK,
        FRAME_PREFIX,
        isPat,
        parityBit,
        wrapPixelBlock,
        frameBodyFromBlocks,
        classifyBin,
        patFrameBodies
    };
})();

// Export for Node.js (CommonJS) — used by tests/test-bin-classifier.js.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BinClassifier;
}

// Export for browser (global) — used by <script src=> callers (arena_console.html).
if (typeof window !== 'undefined') {
    window.BinClassifier = BinClassifier;
}
