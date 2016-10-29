(function() {
  'use strict';

  function ChromeSid() {
    this.mainView = new app.MainView();
    this.tuneTemplate = new app.TuneInfoTemplate();
    this.sidplayer = new app.Sidplay("#chromeSidContainer");
    this.localFileStorage = new app.LocalFileStorage();
    this.localSettingStorage = new app.LocalSettingStorage("chromesid");
    this.mainModel = new app.MainModel(this.sidplayer, this.tuneTemplate, this.localSettingStorage);
    this.mainController = new app.MainController(this.mainView, this.mainModel, this.localFileStorage);
    
    this.CheckForFileArguments();
  }

  ChromeSid.prototype.CheckForFileArguments = function(){
    // Communication is done through member variables of the window. This is rather nasty, but it cannot
    // be propagated through a message.
    
    var win = chrome.app.window.current();
    if (win.ChromeSidFiles.length > 0) {
      // Play first file, the rest gets ignored.
      this.mainController.PlayFileEntry(win.ChromeSidFiles[0]);
      win.ChromeSidFiles = [];
    }
  };
  
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
      if (request.action === 'checkForFileArguments') {
        // Re-launch from file browser detected
        chromeSid.CheckForFileArguments();
        return true;
      }
    }
  });
})();