Pattern set 20260610_150753  (arena G6_2x10)
Built 2026-06-10T15:07:53 by webDisplayTools/pattern-set.

DEPLOY TO THE SD CARD
  Copy the CONTENTS of this bundle to the ROOT of a FAT32 SD card, so the
  card looks exactly like this (the firmware scans /patterns/*.pat and
  assigns the 1-based pattern_ID by alphabetical filename):

    <SD root>/
      patterns/
        001_all_on.pat
        002_grating_sq.pat  ...
      MANIFEST.bin   MANIFEST.txt   manifest.json   README.txt

  - Do NOT drop a wrapper folder on the card -- "patterns" sits at the root.
  - Do NOT rename the .pat files -- the NNN_ prefix sets the pattern_ID
    order, and the long names avoid an 8.3-filename issue on the controller.
  - Seat the card BEFORE powering on the controller (SD is mounted at boot).

Patterns (SD index = pattern_ID):
  1. 001_all_on.pat  all_on
  2. 002_grating_sq.pat  grating_sq
  3. 003_grating_sine.pat  grating_sine
  4. 004_frame2_h_ccw_200f.pat  frame2_h_ccw_200f

