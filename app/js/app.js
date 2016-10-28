(function() {
  'use strict';

  function ChromeSid() {
    this.mainView = new app.MainView();
    this.tuneTemplate = new app.TuneInfoTemplate();
    this.sidplayer = new app.Sidplay("#chromeSidContainer");
    this.localFileStorage = new app.LocalFileStorage();
    this.mainModel = new app.MainModel(this.sidplayer, this.tuneTemplate);
    this.mainController = new app.MainController(this.mainView, this.mainModel, this.localFileStorage);
  }

  var chromeSid = new ChromeSid();
  
  chrome.runtime.onMessage.addListener(function(request, sender, callback){
    if (request)
    {
      if( request.action === 'settingsApplied') {
        chromeSid.mainController.OnSettingsApplied(request.config);
        return true;
      }
      if (request.action === 'settingsClosed') {
        chromeSid.mainController.OnSettingsClosed();
        return true;
      }
    }
  });
})();