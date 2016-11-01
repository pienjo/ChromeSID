## Description
What good is an operating system without a music player that will play C64 SIDs? No good at all, that's what it is.

I started this project as an excuse to tinker with Chrome extensions, Javascript and Chrome's "Native Client" framework. It consists of two parts:

* a pNaCl module, running the actual simulation, based on libsidplayfp. See sidplayfp_nacl/README for details.
* a Chrome extension that uses the above module.

For the record: I did not write the actual SID emulation; I merely wrote a small wrapper around it. At the moment, the extension is far from feature-complete and downright ugly, but it has reached the point that it looks viable. 

## Features

* Support for the ReSID and ReSIDfp simulation backends.
* Allows the SID- and C64 model to be overruled
* SID filters and resampling can be disabled to reduce CPU load
* Allows playing .sid and .psid files from the ChromeOS file browser
* Supports the HVSC "Songlengths" database, and supports fading out at the (expected) end of tune.

## Known problems

* The "user interface" isn't worth the name. It only contains the absolute minimum controls, and no design was involved.
* Performance is lackluster; this is possibly a consequence of using the 'portable' pNacl framework instead of a native module.
* it is terribly bare-bones. No STIL entries, no song lengths, no channel selection.

## Building
For build instructions: See BUILDING
