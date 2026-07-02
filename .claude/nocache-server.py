#!/usr/bin/env python3
"""No-cache static file server for local Arena Studio / webDisplayTools preview.

GitHub Pages + browser caching of the vendored `yaml` ES module is the documented
catastrophic gotcha (a stale cached module makes the whole <script type="module">
block fail to load). Serving with Cache-Control: no-store sidesteps it for local
dev so the import map + vendored modules always load fresh.

Usage:  PORT=8091 python3 .claude/nocache-server.py
The port can also be passed as the first CLI arg.
"""
import http.server
import os
import sys

# Serve from the repo root (two levels up from .claude/).
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else int(os.environ.get("PORT", "8091"))
    os.chdir(ROOT)
    httpd = http.server.HTTPServer(("127.0.0.1", port), NoCacheHandler)
    sys.stderr.write("Arena Studio dev server: http://127.0.0.1:%d/  (root: %s)\n" % (port, ROOT))
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        httpd.server_close()


if __name__ == "__main__":
    main()
