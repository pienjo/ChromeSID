(function(window) {
  'use strict';
  
  function SongLengthDB( fileStorage ) {
    this._fileStorage = fileStorage;
    
    this._fileStorage.OnHVSCRootChanged = function () {
      this._songLengthMap = null;
    };
    
    this._songLengthMap = null;
  }
  
  SongLengthDB.prototype._parseDBContents = function ( text ) {
    this._songLengthMap = {};
    
    var lines = text.split('\n');
    for (var lineIdx = 0; lineIdx < lines.length; ++lineIdx) {
      var line = lines[lineIdx].trim();
      
      // See if this is a valid entry
      var separator = line.indexOf("=");
      
      if (separator > 0 ) {
        var key = line.substr(0, separator).trim();
        var decl = line.substr(separator + 1, line.length - separator - 1);
        
        var value = [];
        // decl is a space separated list containing timestamps
        var timestamps = decl.split(' ');
        for (var tsIdx = 0; tsIdx < timestamps.length; ++tsIdx) {
          var timestamp = timestamps[tsIdx];
          if (timestamp.length > 0) {
            var semicolon = timestamp.indexOf(":");
            var mins = parseInt(timestamp.substr(0, semicolon), 10);
            var secs = parseInt(timestamp.substr(semicolon + 1, 2), 10);
            
            secs = secs + mins * 60;
            if (isNaN(secs)) {
              secs = -1;
            }
            value.push(secs);
          }
        }
        this._songLengthMap[key] = value;
      }
    }
  };
  
  SongLengthDB.prototype._getMap = function( callback ) {
    var that = this;
    
    if (this._songLengthMap) {
      callback(this._songLengthMap);
    }
    else {
      this._fileStorage.GetHVSCRoot_DBSettings(function (dbSettings) {
        if (!dbSettings || !dbSettings.songLengthEntry)
        {
          callback({});
        }
        else {
          // Read file contents
          dbSettings.songLengthEntry.file(function(file) {
          
            var reader = new FileReader();
            
            reader.onError = function() {
              callback( that._songLengthMap );
            };
            
            reader.onloadend = function(e) {
              that._parseDBContents(e.target.result);
              callback( that._songLengthMap );
            };
            
            reader.readAsText(file);
          });
        }
      });
    }
  };
  
  SongLengthDB.prototype.GetSongLength = function( md5Sum, callback ) {
    this._getMap(function (map) {
      callback(map[md5Sum || ""]);
    });
  };
  
  // publish to windows
  window.app = window.app || {};
  window.app.SongLengthDB = SongLengthDB;
})(window);