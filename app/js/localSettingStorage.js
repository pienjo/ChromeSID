(function(window) {
  'use strict';
  
  function LocalSettingStorage( name ) {
    
  }
  
  LocalSettingStorage.prototype.GetPlayerSettings = function(callback) {
    callback = callback || function() { };
    
    chrome.storage.local.get("playerSettings", function(storage) {
  	  callback(storage && storage.playerSettings || {});
    });
  };

  LocalSettingStorage.prototype.SetPlayerSettings = function(data, callback) {
    callback = callback || function() { };
    data = data || { };
    
    // Api is asymmetrical :X
    var storage = { 'playerSettings' : data};
    
    chrome.storage.local.set( storage, function() {
      callback();
    });
  };
  
  LocalSettingStorage.prototype.SetHVSCRootId = function (data, callback) {
    callback = callback || function() { };
    
    var storage = { 'hvscRootId' : data };
    chrome.storage.local.set(storage, function() {
      callback();
    });
  };
  
  LocalSettingStorage.prototype.GetHVSCRootId = function(callback) {
    callback = callback || function() { };
    
    chrome.storage.local.get('hvscRootId', function (storage) {
      callback(storage && storage.hvscRootId);
    });
  };
  
  // Export to window
  window.app = window.app || {};
  window.app.LocalSettingStorage = LocalSettingStorage;
}) (window);