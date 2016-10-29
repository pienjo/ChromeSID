#Building the NaCl module

## Requirements:

* A (linux) system to build the NaCl module. A Chromebook running [Crouton](https://github.com/dnschneid/crouton) works fine. Mac and windows probably won't require a lot of work to get going.
* The [NaCL SDK](https://developer.chrome.com/native-client/sdk/download) plus all its requirements, with a recent version of the pepper bundle. I'm using pepper_49 at the moment.
* A `NACL_SDK_ROOT` environment variable, that points to the *absolute* path of the pepper module. You may want to set this variable in the profile of your shell. 
* A local clone of this repository.

Note that the NaCL SDK is rather large (~1.7 GB); if you want to build this on a Chromebook with limited local storage space, you may have to install the SDK to an SD card. This requires some trickery, contact me if you need help. 

## Build instructions

Building the module is straightforward.

    cd ChromeSID/sidplayfp_nacl
    make
    
This will build the pNaCL module. To copy the module to the correct location in the accompanying extension, use

    make install

#Loading the (unpacked) extension

## Requirements

* A moderately recent version of Chrome or ChromeOS. You'll need to enable 'developer mode' in chrome://extensions in order to be able to load unpackaged extensions
* The compiled NaCl module. See the above instructions. 
    
## Instructions

1. Browse to chrome://extensions. 
2. Make sure 'Developer mode' is enabled.
3. Press the 'Load unpacked extension..' button, and point it to the `ChromeSID\app` directory.

Whenever you modify any of the files in the `ChromeSID\app` directory, you'll need to reload the extension.
