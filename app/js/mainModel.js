(function (window) {
  'use strict';
  function MainModel(player) {
    this.$player = player;
    this.tuneInfo = undefined;
    this.tuneFilename = undefined;
  }
  
  MainModel.prototype.Load = function(filename, contents, callback) {
    callback = callback || function() { };
    var that = this;
    
    this.$player.Load( contents, function(infoObj) {
            that.tuneFilename = filename;
            that.tuneInfo = infoObj;
            callback();
          });
  };
  
  MainModel.prototype.GetInfo = function(callback) {
    this.$player.GetInfo(callback);
  };
  
  // Export to window
  window.app = window.app || {};
  window.app.MainModel = MainModel;
})(window);