(function (window) {
	'use strict';
	// Export to window
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

  function TuneInfoTemplate()
  {
		this._subtuneTemplate
		=	'<option value="{{subTuneId}}">'
		+		'{{subTuneId}} : {{title}} - {{author}} &copy; {{copyright}} ( {{model}} {{speed}} )'
		+	'</option>';
  }
  
  TuneInfoTemplate.prototype.showSubtunes = function(data) {
    var rendered = '';
    var index;
    
    for (index = 0; index < data.length; ++index) {
      var template = this._subtuneTemplate;
      var subtune = data[index];
      template = template.replace(/\{\{subTuneId\}\}/g, index + 1);
      template = template.replace('{{title}}', escape(subtune.songInfos[0]) );
      template = template.replace('{{author}}', escape(subtune.songInfos[1]) );
      template = template.replace('{{copyright}}', escape(subtune.songInfos[2]));
      template = template.replace('{{model}}', subtune.sidModel1);
      template = template.replace('{{speed}}', subtune.clockSpeed);
      
      rendered = rendered + template;
    }
    
    return rendered;
  };
  
	window.app = window.app || {};
	window.app.TuneInfoTemplate = TuneInfoTemplate;
})(window);