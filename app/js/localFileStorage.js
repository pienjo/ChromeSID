(function (window) {
  'use strict';
  function LocalFileStorage(settingStorage)
  {
    this._settingStorage = settingStorage;
    this._dbSettings = null;
    
    // Chrome will only retain the last 500 file- or directory entries. In the unlikely
    // case that a user plays more than 500 files, this means the HVSC root directory entry will
    // be recycled.
    
    this._entryAccessCount = 0;
  }
  
  LocalFileStorage.prototype.LoadFileEntry = function(fileEntry, callback) {
    // Retrieve appropriate path name for displaying
    var that = this;
    chrome.fileSystem.getDisplayPath(fileEntry, function(filename) {
      fileEntry.file(function(file) {
        
        if (that._entryAccessCount++ > 200)
        {
          that._entryAccessCount = 0;
          that._retrieveHVSCRoot(function() { }); // Restoring it counts as activity.
        }
        
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
  
  LocalFileStorage.prototype._retrieveHVSCRoot = function( callback ) {
    // Retrieve from settings if possible
    this._settingStorage.GetHVSCRootId(function(retainedID) {
      
      if (!retainedID)
        callback(null); // Not stored.
      else
      {
        // Ensure ID is restorable
        chrome.fileSystem.isRestorable( retainedID, function(success) {
          
          if (!success)
            callback(null); // Cannot be restored;
          else
          {
            chrome.fileSystem.restoreEntry(retainedID, function(rootDirectoryEntry) {
              callback(rootDirectoryEntry);
            });
          }
        });
      }
    });
  };
  
  LocalFileStorage.prototype._tryHVSCRoot = function( directoryEntry, callback){
    var that = this;
    
    chrome.fileSystem.getDisplayPath(directoryEntry, function(hvscRootDir) {
      // Retrieve DOCUMENTS subdir
      directoryEntry.getDirectory("DOCUMENTS", { },
        function( documentDirEntry) {
          // Success retrieving DOCUMENTS.
          
          documentDirEntry.getFile('Songlengths.txt', { },
            function( songlengthDirEntry)
            {
              // Success retrieving Songlengths
              that._dbSettings = {
                hvscRootDir : hvscRootDir,
                songLengthEntry : songlengthDirEntry
              };
              
              that.OnHVSCRootChanged();
              callback(that._dbSettings);
              
            },
            function() {
              // Error retrieving songlengths.txt
              callback(null);
            }
          );
        },
        function() {
          // Error retrieving DOCUMENTS
          callback(null);
        }
      );
    });
  };
  
  LocalFileStorage.prototype.SelectHVSCRoot = function(callback ) {
    var that = this;
    
    chrome.fileSystem.chooseEntry( {
      type: 'openDirectory'
      },
    function(rootDirectoryEntry) {
      if (!rootDirectoryEntry) {
        callback( "CANCELLED");
        return;
      }
      
      that._tryHVSCRoot(rootDirectoryEntry, function(dbSettings) {
        if (!dbSettings) {
          callback("INVALID");
          return;
        }
        
        // Retain for settings.
        var retainedID = chrome.fileSystem.retainEntry(rootDirectoryEntry);
        that._settingStorage.SetHVSCRootId(retainedID, function() {
          callback("OK");
        });
      });
    });
  };
  
  LocalFileStorage.prototype.GetHVSCRoot_DBSettings = function( callback ) {
    var that = this;
    
    if (this._dbSettings)
      callback(this._dbSettings);
    else
    {
      that._retrieveHVSCRoot( function (rootDirectoryEntry) {
        if (!rootDirectoryEntry)
          callback(null); // Not available
        else
        {
          // parse.
          that._tryHVSCRoot(rootDirectoryEntry, function(dbSettings) {
            // Success - or not.
            callback(dbSettings);
          });
        }
     
      });
    }
  };
  
  LocalFileStorage.prototype.OnHVSCRootChanged = function() {
    //empty;
    };
  
  // Export to window
  window.app = window.app || {};
  window.app.LocalFileStorage = LocalFileStorage;
})(window);