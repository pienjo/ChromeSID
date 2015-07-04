(function (window) {
  'use strict';
  
  function MainController(view, model, storage) {
    this._view = view;
    this._storage = storage;
    this._model = model;
    
    var that = this;
    
    this._view.Bind("load", function()
    {
      that._onLoad();
    });
    
    // Query the player for the version, to indicate activity
    this._view.SetStatus("Initializing player...");
    this._model.GetInfo( function(statusInfo)
    {
      that._view.SetStatus("Successfully initialized " + statusInfo.libraryVersion);
    });
  }
  
  MainController.prototype._onLoad = function()
  {
    var that = this;
    
    this._storage.LoadFile(function (filename, contents) {
      that._model.Load(filename, contents, function(tuneInfo) {
        that._view.RenderTuneInfo(that._model.tuneFilename, that._model.tuneInfo);
      });
    });
  };
  
  // Export to window
  window.app = window.app || {};
  window.app.MainController = MainController;
})(window);