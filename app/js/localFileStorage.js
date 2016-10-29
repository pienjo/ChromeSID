(function (window) {
  'use strict';
  function LocalFileStorage()
  {
    
  }
  
  LocalFileStorage.prototype.LoadFileEntry = function(fileEntry, callback) {
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
  };
  
  LocalFileStorage.prototype.SelectFile = function( callback ) {
    var that = this;
    
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
      that.LoadFileEntry(fileEntry, callback);
    });
  };
  
  // Export to window
  window.app = window.app || {};
  window.app.LocalFileStorage = LocalFileStorage;
})(window);