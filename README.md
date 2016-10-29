What good is an operating system without a music player that will play C64 SIDs? No good at all, that's what it is.

I started this project as an excuse to tinker with Chrome extensions, Javascript and Chrome's "Native Client" framework. It consists of two parts:

* a pNaCl module, running the actual simulation, based on libsidplayfp. See sidplayfp_nacl/README for details.
* a Chrome extension that uses the above module.

For the record: I did not write the actual SID emulation; I merely wrote a small wrapper around it. At the moment, the extension is far from feature-complete and downright ugly, but it has reached the point that it looks viable. 

For build instructions: See BUILDING
