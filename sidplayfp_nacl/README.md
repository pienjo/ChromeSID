This is based on libsidplayfp (http://sf.net/projects/sidplay-residfp), version 1.7.2. Only minor modifications have been made:

* PNaCL doesn't particularly agree with autotools and automake. A manual makefile has been generated in its place
* Mixer::setVolume has been exposed; this allows the playback volume to be altered during playback (modifying it through SidConfig implies a restart of playback).
* PNaCL uses clang/llvm. This required small modifications in sidplayfp.cpp to make it compile.

libsidplayfp is available through the GPLv2 license, and therefore so is this module. See
COPYING for details.

