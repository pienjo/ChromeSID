(function (window) {
  'use strict';
  
  function SettingsView() {
    this.$defaultSidModels= document.getElementsByName("defaultSidModel");
    this.$defaultC64Models= document.getElementsByName("defaultC64Model");
    this.$sidEmulations=document.getElementsByName("sidEmulation");
    this.$forceSidModel= document.querySelector("#forceSidModel");
    this.$forceC64Model= document.querySelector("#forceC64Model");
    this.$filterEnabled= document.querySelector("#filterEnabled");
    this.$resampling=document.querySelector("#resampling");
    this.$applyButton=document.querySelector("#applyButton");
    this.$document=document;
  }
  
  SettingsView.prototype.Set = function(config) {
    var i;
    
    for (i = 0; i < this.$defaultC64Models.length; i++) {
      if (this.$defaultC64Models[i].value === config.defaultC64Model)
      {
        this.$defaultC64Models[i].checked = true;
        break;
      }
    }
    
    for (i = 0; i < this.$defaultSidModels.length; i++) {
      if (this.$defaultSidModels[i].value === config.defaultSidModel)
      {
        this.$defaultSidModels[i].checked = true;
        break;
      }
    }
    
    for (i = 0; i < this.$sidEmulations.length; i++) {
      if (this.$sidEmulations[i].value === config.sidEmulation)
      {
        this.$sidEmulations[i].checked = true;
        break;
      }
    }
    
    this.$forceC64Model.checked = config.forceC64Model;
    this.$forceSidModel.checked = config.forceSidModel;
    this.$filterEnabled.checked = config.filterEnabled;
    this.$resampling.checked = config.resampling;
  };
  
  SettingsView.prototype.Bind = function(event, handler) {
    var that = this;
    
    if (event === "apply") {
       this.$applyButton.addEventListener('click', function(){
        
        var newConfig = { };
        var i;
        
        for (i = 0; i < that.$defaultC64Models.length; i++) {
          if (that.$defaultC64Models[i].checked === true)
          {
            newConfig.defaultC64Model = that.$defaultC64Models[i].value;
            break;
          }
        }
        
        for (i = 0; i < that.$defaultSidModels.length; i++) {
          if (that.$defaultSidModels[i].checked === true)
          {
            newConfig.defaultSidModel = that.$defaultSidModels[i].value;
            break;
          }
        }
        
        for (i = 0; i < that.$sidEmulations.length; i++) {
          if (that.$sidEmulations[i].checked === true)
          {
            newConfig.sidEmulation = that.$sidEmulations[i].value;
            break;
          }
        }
        
        newConfig.forceC64Model= that.$forceC64Model.checked;
        newConfig.forceSidModel= that.$forceSidModel.checked;
        newConfig.filterEnabled= that.$filterEnabled.checked;
        newConfig.resampling= that.$resampling.checked;
        
        handler(newConfig);
      });
    }
  };
  
  // Export to window
  window.app = window.app || { };
  window.app.SettingsView = SettingsView;
  
})(window);