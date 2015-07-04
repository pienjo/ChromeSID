(function (window) {
  'use strict';
  function LocalFileStorage()
  {
    
  }
  
  LocalFileStorage.prototype.LoadFile = function( callback )
  {
    chrome.fileSystem.chooseEntry( {
      type: 'openFile',
      accepts: [
                  {
                    description:" SID files",
                    extensions: [ 'sid', 'psid']
                  }
                ],
      acceptsAllTypes: true
    }, function(fileEntry) {
      
      // Retrieve appropriate path name for displaying
      
      chrome.fileSystem.getDisplayPath(fileEntry, function(filename) {
        fileEntry.file(function(file) {
          var reader = new FileReader();
          
          reader.onError = function() {
            callback( filename, undefined);
          };
          
          reader.onloadend = function(e) {
            callback(filename, e.target.result);
          };
          
          reader.readAsArrayBuffer(file);
        });
      });
    });
  };
  
  // Export to window
  window.app = window.app || {};
  window.app.LocalFileStorage = LocalFileStorage;
})(window);