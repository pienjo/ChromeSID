(function (window) {
  'use strict';
  function MainModel(player, template) {
    this._player = player;
    this._template = template;
    
    this._tuneInfo = undefined;
    this._tuneFilename = undefined;
  }
  
  MainModel.prototype.Load = function(filename, contents, callback) {
    callback = callback || function() { };
    var that = this;
    
    this._player.Load( contents, function(infoObj) {
            that._tuneFilename = filename;
            that._tuneInfo = infoObj;
            callback({
                "filename" : filename,
                "subtunes" : that._template.showSubtunes(infoObj.songs)
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
    this._player.Play(callback);
  };
  
  // Export to window
  window.app = window.app || {};
  window.app.MainModel = MainModel;
})(window);