(function (window) {
  'use strict';
  
  function SettingsController(view, config) {
    this._view = view;
    
    var that = this;
    this._view.Bind("apply", function( newConfig )
    {
      that._OnApply(newConfig);
    });
    
    if (config)
      this._view.Set(config);
  }

  SettingsController.prototype._OnApply = function( newConfig ) {
    chrome.runtime.sendMessage({
      action: "settingsApplied",
      config: newConfig,
    });
  };

  // Export to window
  window.app = window.app || {};
  window.app.SettingsController = SettingsController;

})(window);
