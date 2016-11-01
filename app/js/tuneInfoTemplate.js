(function (window) {
	'use strict';
	// Export to window
	
  function TuneInfoTemplate()
  {
		this._subtuneTemplate
		=	'<option value="{{subTuneId}}">'
		+		'{{subTuneId}} ({{runtime}}): ( {{clock}} {{speed}} )'
		+	'</option>';
  }
  
  TuneInfoTemplate.prototype.showSubtunes = function(data) {
    var rendered = '';
    var index;
    
    for (index = 0; index < data.length; ++index) {
      var template = this._subtuneTemplate;
      var subtune = data[index];
      var runtime = "??:??";
      
      if (subtune.songLength > 0) {
        runtime = Math.floor(subtune.songLength / 60) + ":" + ("00" + subtune.songLength % 60).substr(-2);
      }
      
      template = template.replace(/\{\{subTuneId\}\}/g, index + 1);
      template = template.replace('{{clock}}', subtune.songSpeed);
      template = template.replace('{{speed}}', subtune.clockSpeed);
      template = template.replace('{{runtime}}', runtime);
      rendered = rendered + template;
    }
    
    return rendered;
  };
  
	window.app = window.app || {};
	window.app.TuneInfoTemplate = TuneInfoTemplate;
})(window);