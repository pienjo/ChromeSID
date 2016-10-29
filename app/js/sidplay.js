(function (window) {
  'use strict';
  
  function Sidplay(container_selector) {
    var that = this;
    
    this._pluginLocation = ".";
    this._pluginName = "sidplayfp.nmf";
    this._transactions = []; // Queue of transactions that have yet to be sent
    this._transactionInProgress = null; // Transaction in progress (sent to player, but response has not been received or processed)
    this.$containerElement = document.querySelector(container_selector);
    this.$moduleElement = null;
    
    this.$containerElement.addEventListener('load', function() {
      that._moduleLoaded();
    }, true);
    this.$containerElement.addEventListener('message', function(msg) {
      that._messageReceived(msg);
    }, true);
    
    var module = document.createElement('embed');
    module.setAttribute('name', 'sidplay_module');
    module.setAttribute('id', 'sidplay_module');
    module.setAttribute('width', 0);
    module.setAttribute('height', 0);
    module.setAttribute('path', this._pluginLocation);
    module.setAttribute('src', this._pluginLocation + "/" + this._pluginName);
    module.setAttribute('type', 'application/x-pnacl');
    // Add payload
    this.$containerElement.appendChild(module);
  }
  
  Sidplay.prototype._moduleLoaded = function() {
    // Module loaded. Start dispatching messages.
    this.$moduleElement = this.$containerElement.querySelector("#sidplay_module");
  
    this._dispatchNext();
  };
  
  Sidplay.prototype._dispatchNext = function() {
    if (this.$moduleElement !== null && this._transactionInProgress === null && this._transactions.length > 0)
    {
      // No transaction in progress. Send oldest message
      this._transactionInProgress = this._transactions.shift();
      this.$moduleElement.postMessage(this._transactionInProgress.message);
    }
  };
  
  Sidplay.prototype._messageReceived = function (msg) {
    // Received a reply from the module.
    if (this._transactionInProgress.callback) {
      // callback supplied,
      this._transactionInProgress.callback(msg.data);
    }
    this._transactionInProgress = null;
    this._dispatchNext();
  };
  
  Sidplay.prototype._sendCommand = function(command, args, callback)
  {
    this._transactions.push(
      {
        message :
        {
          command : command,
          args    : args
        },
        callback : callback
      });

    // Dispatch if allowed
    this._dispatchNext();
    
  };
  
  // PUblic functions
  
  Sidplay.prototype.GetLibInfo = function(callback) {
    this._sendCommand("libinfo", null, callback);
  };
  
  Sidplay.prototype.Load = function(contents, callback) {
    this._sendCommand("load", { contents : contents }, callback);
  };
  
  Sidplay.prototype.GetPlayerInfo = function(callback) {
    this._sendCommand("playerinfo", null, callback );
  };
  
  Sidplay.prototype.GetConfig = function(callback) {
    this._sendCommand("getconfig", null, callback );
  };
  
  Sidplay.prototype.SetConfig = function(config, callback) {
    this._sendCommand("setconfig", config, callback);
  };
  
  Sidplay.prototype.Play = function(subtuneId, callback) {
    if (subtuneId !== null)
      this._sendCommand("play", { subtuneId : subtuneId }, callback);
    else
      this._sendCommand("play", null, callback);
  };
  
  Sidplay.prototype.PauseResume = function(callback) {
    this._sendCommand("pauseresume", null, callback);
  };

  // Export to window
  window.app = window.app || {};
  window.app.Sidplay = Sidplay;
})(window);
