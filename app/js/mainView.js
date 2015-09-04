(function (window) {
  'use strict';
  
  function MainView() {
    this.$statusLine = document.querySelector('#status');
    this.$loadButton = document.querySelector('#loadButton');
    this.$filename = document.querySelector("#filename");
    this.$subtunes = document.querySelector('#subtunes');
    this.$playerStatusLine = document.querySelector("#playerstatus");
    this.$playButton = document.querySelector("#playButton");
  }
  
  MainView.prototype.SetStatus = function(statusText) {
    this.$statusLine.textContent = statusText;
  };
  
  MainView.prototype.RenderTuneInfo = function(tuneInfo) {
    this.$filename.textContent = tuneInfo.filename;
    this.$subtunes.innerHTML = tuneInfo.subtunes;
  };
  
  MainView.prototype.RenderPlayerInfo = function(playerInfo) {
    this.$playerStatusLine.textContent = playerInfo;
  };
  
  MainView.prototype.Bind = function(event, handler) {
    if (event === "load") {
      this.$loadButton.addEventListener('click', function(){
        handler();
      });
    } else if (event == "play") {
      this.$playButton.addEventListener('click', function(){
        handler();
      });
    } else if (event == "playerStatusUpdate") {
      window.setInterval(function() {
        handler();
      }, 1000);
    }
  };
  
    // Export to window
  window.app = window.app || {};
  window.app.MainView = MainView;
})(window);