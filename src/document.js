(function() {
	"use strict";

	var global = window,
		_CSS = global.CSS || (global.CSS = {}),
		_CSS_doc = _CSS.doc;

	// ---=== HAS documentCSS support ===---
	if (typeof _CSS_doc === "function") {
		try {
			_CSS_doc.call(_CSS, "url()");
			// SUCCESS
			return; // Do not need anything to do. Exit from polyfill
		} catch (e) {
			//FAIL
		}
	} else {
		// ---=== NO CSS.document support ===---

		var StyleFix;

		_CSS_doc = function() {
			var result = true;
			for (var i = arguments.length - 1; i >= 0; i--) {
				result = result && _documentCondition(arguments[i]);
			}
			return result;
		};

		try {
			StyleFix = global.stylefix || require("stylefix");
		} catch (ex) {

		}

		if (StyleFix) {
			StyleFix.register(function(css, raw) {
				if (raw) {
					return css.replace(/@document\s+([^\{]+)/g, function(str, strRules) {
						try {
							if (strRules && _CSS_doc(strRules)) {
								str = "@media all ";
							}
						} catch (ex) {

						}
						return str;
					});
				}
			});
		}
	}


	// _documentCondition("url() url-prefix() domain() regexp()")
	function _documentCondition(str) {
		console.log(str);
		var result,
			rule_type,
			rule_content,
			url_href = global.location.href;

		if (str) {
			rule_type = str.substr(0, str.indexOf("("));
			rule_content = (str.match(/\((.*?)\)/))[1];
			switch (rule_type) {
				case "url":
					if (url_href === rule_content) {
						result = true;
					}
					break;
				case "url-prefix":
					var url_prefix = url_href.substr(0, (url_href.lastIndexOf("/") + 1));
					if (url_prefix === rule_content) {
						result = true;
					}
					break;
				case "domain":
					var url_hostname = global.location.hostname;
					if (url_hostname.match(rule_content)) {
						result = true;
					}
					break;
				case "regexp":
					rule_content = rule_content.substr(1, (rule_content.length - 2));
					if (url_href.match(rule_content)) {
						result = true;
					}
					break;
				default:
					console.log("there no document solution like you write!");
			}
			return result || false;
		}
	}

	/**
	 * @expose
	 */
	_CSS.doc = function(a, b) {
		var argLen = arguments.length;

		if (argLen) {
			return argLen === 1 ? _documentCondition(a) : _CSS_doc(a, b);
		} else {
			throw new Error("WRONG_ARGUMENTS_ERR"); //TODO:: DOMException ?
		}
	};
})();