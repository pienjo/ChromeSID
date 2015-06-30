(function (window) {
  
  function Sidplay(container_selector) {
    var that = this;
    
    this._pluginLocation = "../sidplayfp_nacl/pnacl/Release";
    this._pluginName = "sidplayfp.nmf";
    this._transactions = [];
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
    if (this.$moduleElement !== null && this._transactions.length > 0)
    {
      // Send oldest message
      this.$moduleElement.postMessage(this._transactions[0].message);
    }
  };
  
  Sidplay.prototype._messageReceived = function (msg) {
    // Received a message from the module.
    var transaction = this._transactions.shift();
    if (transaction.callback) {
      // callback supplied,
      transaction.callback(msg.data);
    }
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
    // First message?
    
    if (this._transactions.length == 1) {
      this._dispatchNext();
    }
  };
  
  // PUblic functions
  
  Sidplay.prototype.GetInfo = function(callback) {
    this._sendCommand("info", null, callback);
  };
  // Export to window
  window.app = window.app || {};
  window.app.sidplay = Sidplay;
})(window);