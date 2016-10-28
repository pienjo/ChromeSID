(function(window) {
  'use strict';

  function ChromeSidSettings() {
    this.settingsView = new app.SettingsView();
    this.settingsController = new app.SettingsController(this.settingsView, chrome.app.window.current().Config);
  }
  
  var chromeSidSettings = new ChromeSidSettings();
})(window);