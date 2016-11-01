(function (window) {
  'use strict';
  
  function MainView() {
    this.$statusLine = document.querySelector('#status');
    this.$loadButton = document.querySelector('#loadButton');
    this.$settingsButton = document.querySelector('#settingsButton');
    this.$hvscRootButton = document.querySelector('#hvscRootButton');
    this.$filename = document.querySelector("#filename");
    this.$format = document.querySelector("#format");
    this.$title = document.querySelector("#title");
    this.$author = document.querySelector("#author");
    this.$copyright = document.querySelector("#copyright");
    this.$sidmodel = document.querySelector("#sidmodel");
    this.$compatibility = document.querySelector("#compatibility");
    this.$loadaddr = document.querySelector("#loadaddr");
    this.$initaddr = document.querySelector("#initaddr");
    this.$playaddr = document.querySelector("#playaddr");
    this.$subtunes = document.querySelector('#subtunes');
    this.$playerStatusLine = document.querySelector("#playerstatus");
    this.$playButton = document.querySelector("#playButton");
    this.$pauseResumeButton = document.querySelector("#pauseResumeButton");
  }
  
  var htmlEscapes = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		'\'': '&#x27;',
		'`': '&#x60;'
	};

	var escapeHtmlChar = function (chr) {
		return htmlEscapes[chr];
	};

	var reUnescapedHtml = /[&<>"'`]/g,
	    reHasUnescapedHtml = new RegExp(reUnescapedHtml.source);

	var escape = function (string) {
		return (string && reHasUnescapedHtml.test(string))
			? string.replace(reUnescapedHtml, escapeHtmlChar)
			: string;
	};

  MainView.prototype.SetStatus = function(statusText) {
    this.$statusLine.textContent = statusText;
  };
  
  function hex4(addr)
  {
    return ("0000" + addr.toString(16)).substr(-4);
  }
  
  MainView.prototype.RenderTuneInfo = function(tuneInfo) {
    this.$filename.textContent = tuneInfo.filename;
    this.$format.textContent = tuneInfo.format;
    this.$compatibility.textContent = tuneInfo.compatibility;
    this.$title.textContent = tuneInfo.title;
    this.$author.textContent = tuneInfo.author;
    this.$copyright.innerHTML = "&copy; "+escape(tuneInfo.copyright || "");
    this.$sidmodel.textContent = tuneInfo.sidModel;
    this.$loadaddr.textContent = "$" + hex4(tuneInfo.loadaddr);
    this.$initaddr.textContent = "$" + hex4(tuneInfo.initaddr);
    this.$playaddr.textContent = "$" + hex4(tuneInfo.playaddr);
    
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
  
  MainView.prototype.DisableAllControls = function (disable) {
    var controls = [ this.$loadButton, this.$settingsButton, this.$playButton, this.$pauseResumeButton ];
    for(var i = 0; i < controls.length; ++i)
    {
      controls[i].disabled = disable;
    }
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
    } else if (event === "setHvscRoot") {
      this.$hvscRootButton.addEventListener('click', function(){
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