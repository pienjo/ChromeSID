(function(window) {
  'use strict';
  
  function LocalSettingStorage( name ) {
    this._dbName = name;
    
    chrome.storage.local.get(name, function(storage){
      if (!storage || !(name in storage)) {
        storage = {};
        storage[name] = {};
        chrome.storage.local.set(storage, function() {
          
        });
      }
    });
  }
  
  LocalSettingStorage.prototype.LoadAll = function(callback) {
    callback = callback || function() { };
    var that = this;
    
    chrome.storage.local.get(that._dbName, function(storage) {
  	  if (storage && (that._dbName in storage))
  	    storage = storage[that._dbName];
  	  else
  	    storage = {};
  	  callback(storage);
    });
  };

  LocalSettingStorage.prototype.ReplaceAll = function(data, callback) {
    callback = callback || function() { };
    data = data || { };
    
    var that = this;
    
    // Api is asymmetrical :X
    var storage = { };
    storage[that._dbName] = data;
    
    chrome.storage.local.set( storage, function() {
      callback();
    });
  };
  
  LocalSettingStorage.prototype.Merge = function(data, callback) {
    
    // Merge with existing
    var that = this;
    callback = callback || function() { };
    
    that.LoadAll( function (currentData) {
      // Merge in new data, replacing existing.
      for(var memberName in data) {
        currentData[memberName] = data[memberName];
      }
      
      that.ReplaceAll( data, function() {
        callback();
      });
    });
  };
  
  // Export to window
  window.app = window.app || {};
  window.app.LocalSettingStorage = LocalSettingStorage;
}) (window);