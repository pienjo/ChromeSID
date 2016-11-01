(function (window) {
  'use strict';
  function MainModel(player, template, storage, songLengthDB) {
    var that = this;
    
    this._player = player;
    this._template = template;
    this._storage = storage;
    this._songLengthDB = songLengthDB;
    
    this._tuneInfo = undefined;
    this._tuneFilename = undefined;
    this._config = undefined;
    
    // Retrieve settings from local storage
    storage.GetPlayerSettings(function(config) {
      // Update player's setting
      that._player.SetConfig(config, function (newConfig) {
        that._config = newConfig;
      });
    });
  }
  
  MainModel.prototype.Load = function(filename, contents, callback) {
    callback = callback || function() { };
    var that = this;
    
    this._player.Load( contents, function(infoObj) {
            // Retrieve song length
            that._songLengthDB.GetSongLength(infoObj && infoObj.md5sum, function (songlengths) {
              songlengths = songlengths || [];
              // Merge in lengths
              for(var idx = 0; idx < infoObj.songs.length; ++idx) {
                infoObj.songs[idx].songLength = songlengths[idx] || -1;
              }
              that._tuneFilename = filename;
              that._tuneInfo = infoObj;
              callback({
                  "filename" : filename,
                  "compatibility" : infoObj.compatibility,
                  "format" : infoObj.format,
                  "loadaddr" : infoObj.loadAddr,
                  "initaddr" : infoObj.initAddr,
                  "playaddr" : infoObj.playAddr,
                  "sidModel" : infoObj.sidModel1,
                  "title"    : infoObj.songInfos[0] || "",
                  "author"   : infoObj.songInfos[1] || "",
                  "copyright": infoObj.songInfos[2] || "",
                  "subtunes" : that._template.showSubtunes(infoObj.songs),
                  "defaultSong": infoObj.defaultSong
                });
            });
          });
  };
  
  MainModel.prototype.GetLibInfo = function(callback) {
    this._player.GetLibInfo(callback);
  };
  
  MainModel.prototype.GetPlayerInfo = function(callback) {
    this._player.GetPlayerInfo(callback);
  };
  
  MainModel.prototype.Play = function(callback) {
    this.SelectSubtune(this._tuneInfo.defaultSong, callback);
  };
  
  MainModel.prototype.SelectSubtune = function( subtuneId, callback) {
    this._player.Play(subtuneId, this._tuneInfo.songs[subtuneId - 1].songLength, callback);
  };
  
  MainModel.prototype.PauseResume = function( callback ) {
    this._player.PauseResume(callback);
  };
  
  MainModel.prototype.GetConfig = function(callback) {
    callback = callback || function() { };
    
    if (this._config !== undefined)
    {
      callback(this._config);
    }
    else
    {
      // Retrieve configuration from player when it is done loading
      var that = this;
      this._player.GetConfig(function(config) {
        that._config = config;
        callback(config);
      });
    }
  };
  
  MainModel.prototype.SetConfig = function(config, callback) {
    var that = this;
    callback = callback || function() { };
    
    this._player.SetConfig(config, function(newConfig) {
      that._config = newConfig;
      that._storage.SetPlayerSettings( newConfig, function() {
        callback(newConfig);
      });
    });
  };
  
  // Export to window
  window.app = window.app || {};
  window.app.MainModel = MainModel;
})(window);
