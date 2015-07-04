(function() {
  'use strict';

  function ChromeSid() {
    this.mainView = new app.MainView();
    this.sidplayer = new app.Sidplay("#chromeSidContainer");
    this.localFileStorage = new app.LocalFileStorage();
    this.mainModel = new app.MainModel(this.sidplayer);
    this.mainController = new app.MainController(this.mainView, this.mainModel, this.localFileStorage);
  }

  var chromeSid = new ChromeSid();
})();