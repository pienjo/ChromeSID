(function (window) {
  'use strict';
  
  function MainController(view, model, storage) {
    this._view = view;
    this._storage = storage;
    this._model = model;
    
    var that = this;
    
    this._view.Bind("load", function(){
      that._onLoad();
    });
    
    this._view.Bind("play", function(){
      that._onPlay();
    });
    
    this._view.Bind("playerStatusUpdate", function() {
      that._onPlayerStatusUpdate();
    });
    
    // Query the player for the version, to indicate activity
    this._view.SetStatus("Initializing player...");
    this._model.GetLibInfo( function(statusInfo) {
      that._view.SetStatus("Successfully initialized " + statusInfo.libraryVersion);
    });
  }
  
  MainController.prototype._onLoad = function() {
    var that = this;
    
    this._storage.LoadFile(function (filename, contents) {
      that._model.Load(filename, contents, function(tuneInfo) {
        that._view.RenderTuneInfo(tuneInfo);
      });
    });
  };
  
  MainController.prototype._onPlay = function() {
    this._model.Play(function() {
      
    });
  };
  
  
  MainController.prototype._onPlayerStatusUpdate = function() {
    var that = this;
    
    that._model.GetPlayerInfo(function(playerInfo) {
      var bufferFilled = 0;
      if (playerInfo.bufferSize > 0) {
        bufferFilled = Math.floor(100 * playerInfo.bufferUsage / playerInfo.bufferSize + 0.5);
      }
      
      var seconds = Math.floor(playerInfo.progress);
      var msecs = Math.floor(1000 * (playerInfo.progress - seconds));
      
      var minutes = Math.floor(seconds / 60);
      seconds = seconds % 60;
      
      // Convert to strings
      
      msecs = "0000" + msecs;
      msecs = msecs.substr(msecs.length - 3);
      
      seconds = "000" + seconds;
      seconds = seconds.substr(seconds.length - 2);
        
      that._view.RenderPlayerInfo("" + minutes + ":" + seconds +"." + msecs + "  " + bufferFilled + "%");
    });
  };
  
  // Export to window
  window.app = window.app || {};
  window.app.MainController = MainController;
})(window);