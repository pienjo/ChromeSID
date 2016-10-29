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
    
    this._view.Bind("selectSubtune", function( subtuneId ) {
      that._onSelectSubtune( subtuneId );
    });
    
    this._view.Bind("pauseResume", function() {
      that._onPauseResume();
    });
    
    this._view.Bind("settings", function() {
      that._onSettingsPressed();
    });
    
    // Query the player for the version, to indicate activity
    this._view.SetStatus("Initializing player...");
    this._view.DisableAllControls(true);
    this._model.GetLibInfo( function(statusInfo) {
      that._view.SetStatus("Successfully initialized " + statusInfo.libraryVersion + " Kernal " + statusInfo.romInfo.kernal + " Basic " + statusInfo.romInfo.basic + " Chargen " + statusInfo.romInfo.chargen);
      that._view.DisableAllControls(false);
    });
  }
  
  MainController.prototype._onLoad = function() {
    var that = this;
    
    this._storage.SelectFile(function (filename, contents) {
      that._model.Load(filename, contents, function(tuneInfo) {
        that._view.RenderTuneInfo(tuneInfo);
      });
    });
  };
  
  MainController.prototype.PlayFileEntry = function(fileEntry) {
    var that = this;
    
    this._storage.LoadFileEntry( fileEntry, function (filename, contents ) {
      
      if (contents !== undefined ) {
        // Successfully read file contents. Load and play it.
        that._model.Load(filename, contents, function(tuneInfo) {
          that._model.Play(function() {
            // Update view
            that._view.RenderTuneInfo(tuneInfo);
          });
        });
        
      }
    });
  };
  
  MainController.prototype._onPlay = function() {
    this._model.Play(function() {
      
    });
  };
  
  MainController.prototype._onPauseResume = function() {
    this._model.PauseResume(function() {
      
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
      
      that._view.RenderPlayerInfo("Subtune " + playerInfo.subtune + " " + minutes + ":" + seconds +"." + msecs + "  " + bufferFilled + "% Last status: " + playerInfo.lastError);
      that._view.SetPauseStatus(playerInfo.status == "PAUSED");
    });
  };
  
  MainController.prototype._onSelectSubtune = function( subtuneId ) {
    this._model.SelectSubtune( subtuneId, function() {

    });
  };
  
  MainController.prototype._onSettingsPressed = function() {
    
    var that = this;
    
    this._model.GetConfig(function(config)
    {
      chrome.runtime.sendMessage({
        action: "createSettings",
        config: config,
      },
      
      function(settingsWindow) {
        if (settingsWindow)
        {
          // Window successfully opened.
          that._view.SetConfigButtonEnabled(false);
        }
      });
    });
      
  };
  
  MainController.prototype.OnSettingsApplied = function(newConfig) {
    this._model.SetConfig(newConfig);
  };
  
  MainController.prototype.OnSettingsClosed = function() {
    this._view.SetConfigButtonEnabled(true);
  };
  
  // Export to window
  window.app = window.app || {};
  window.app.MainController = MainController;
})(window);
