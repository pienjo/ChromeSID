(function (window) {
  'use strict';
  function MainModel(player, template) {
    this._player = player;
    this._template = template;
    
    this._tuneInfo = undefined;
    this._tuneFilename = undefined;
    this._config = undefined;
  }
  
  MainModel.prototype.Load = function(filename, contents, callback) {
    callback = callback || function() { };
    var that = this;
    
    this._player.Load( contents, function(infoObj) {
            that._tuneFilename = filename;
            that._tuneInfo = infoObj;
            callback({
                "filename" : filename,
                "subtunes" : that._template.showSubtunes(infoObj.songs),
                "defaultSong": infoObj.defaultSong
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
    this._player.Play(null, callback);
  };
  
  MainModel.prototype.SelectSubtune = function( subtuneId, callback) {
    this._player.Play(subtuneId, callback);
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
    this._player.SetConfig(config, function(newConfig) {
      that._config = newConfig;
      if (callback) callback(newConfig);
    });
  };
  
  // Export to window
  window.app = window.app || {};
  window.app.MainModel = MainModel;
})(window);
