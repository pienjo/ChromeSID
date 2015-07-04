(function (window) {
  'use strict';
  
  function MainView() {
    this.$statusLine = document.querySelector('#status');
    this.$loadButton = document.querySelector('#loadButton');
  }
  
  MainView.prototype.SetStatus = function(statusText) {
    this.$statusLine.textContent = statusText;
  };
  
  MainView.prototype.RenderTuneInfo = function(filename, tuneInfo) {
    
  };
  
  MainView.prototype.Bind = function(event, handler) {
    if (event === "load") {
      this.$loadButton.addEventListener('click', function(){
        handler();
      });
    }
  };
  
    // Export to window
  window.app = window.app || {};
  window.app.MainView = MainView;
})(window);