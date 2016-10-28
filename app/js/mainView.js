(function (window) {
  'use strict';
  
  function MainView() {
    this.$statusLine = document.querySelector('#status');
    this.$loadButton = document.querySelector('#loadButton');
    this.$settingsButton = document.querySelector('#settingsButton');
    this.$filename = document.querySelector("#filename");
    this.$subtunes = document.querySelector('#subtunes');
    this.$playerStatusLine = document.querySelector("#playerstatus");
    this.$playButton = document.querySelector("#playButton");
    this.$pauseResumeButton = document.querySelector("#pauseResumeButton");
  }
  
  MainView.prototype.SetStatus = function(statusText) {
    this.$statusLine.textContent = statusText;
  };
  
  MainView.prototype.RenderTuneInfo = function(tuneInfo) {
    this.$filename.textContent = tuneInfo.filename;
    this.$subtunes.innerHTML = tuneInfo.subtunes;
    this.$subtunes.value = tuneInfo.defaultSong.toString();
  };
  
  MainView.prototype.RenderPlayerInfo = function(playerInfo) {
    this.$playerStatusLine.textContent = playerInfo;
  };
  
  MainView.prototype.SetPauseStatus = function(isPaused) {
    if (isPaused) {
      this.$pauseResumeButton.textContent = "Resume";
    }
    else {
      this.$pauseResumeButton.textContent = "Pause";
    }
  };
  
  MainView.prototype.SetConfigButtonEnabled = function(enabled) {
    this.$settingsButton.disabled= !enabled;
  };
  
  MainView.prototype.Bind = function(event, handler) {
    if (event === "load") {
      this.$loadButton.addEventListener('click', function(){
        handler();
      });
    } else if (event === "play") {
      this.$playButton.addEventListener('click', function(){
        handler();
      });
    } else if (event === "settings") {
      this.$settingsButton.addEventListener('click', function(){
        handler();
      });
    } else if (event === "playerStatusUpdate") {
      window.setInterval(function() {
        handler();
      }, 1000);
    } else if (event === "selectSubtune") {
      var that = this;
      this.$subtunes.addEventListener('change', function(){
        handler( parseInt(that.$subtunes.value) );
      });
    } else if (event == "pauseResume") {
      this.$pauseResumeButton.addEventListener('click', function() {
        handler();
      });
    }
  };
  
    // Export to window
  window.app = window.app || {};
  window.app.MainView = MainView;
})(window);