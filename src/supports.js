/** @license CSS.supports polyfill | @version 0.4 | MIT License | github.com/termi/CSS.supports */

// ==ClosureCompiler==
// @compilation_level ADVANCED_OPTIMIZATIONS
// @warning_level VERBOSE
// @jscomp_warning missingProperties
// @output_file_name CSS.supports.js
// @check_types
// ==/ClosureCompiler==

/*
TODO::
1. element.style.webkitProperty == element.style.WebkitProperty in Webkit (Chrome at least), so
CSS.supports("webkit-animation", "name") is true. Think this is wrong.
*/

(function() {
	"use strict";

	var global = window,
		document = global.document,
		_CSS_supports,
		msie,
		testElement,
		prevResultsCache,
		_CSS = global.CSS;

	if (!_CSS) {
		_CSS = global.CSS = {};
	}

	// ---=== HAS CSS.supports support ===---
	_CSS_supports = _CSS.supports;

	// ---=== HAS supportsCSS support ===---
	if (!_CSS_supports && global.supportsCSS) { // Opera 12.10 impl
		_CSS_supports = _CSS.supports = global.supportsCSS.bind(global);
		/* jshint proto: true */
		if (global.__proto__) {
			delete global.__proto__.supportsCSS;
		}
	}


	if (typeof _CSS_supports === "function") {
		if ((function() {
				// Test for support [supports condition](http://www.w3.org/TR/css3-conditional/#supportscondition)
				try {
					_CSS_supports.call(_CSS, "(a:a)");
					// SUCCESS
					return !(global = _CSS_supports = null); //return true
				} catch (e) { //FAIL
					//_CSS_supports = _CSS_supports.bind(global);
				}
			})()) {
			// EXIT
			return; // Do not need anything to do. Exit from polyfill
		}
	} else {
		// ---=== NO CSS.supports support ===---

		msie = "runtimeStyle" in document.documentElement;
		testElement = document.createElement("_");
		prevResultsCache = {};

		_CSS_supports = function(ToCamel_replacer, testStyle, testElement, propertyName, propertyValue) {
			var name_and_value = propertyName + "\\/" + propertyValue;
			if (name_and_value in prevResultsCache) {
				return prevResultsCache[name_and_value];
			}

			/* TODO:: for IE < 9:
			 _ = document.documentElement.appendChild(document.createElement("_"))
			 _.currentStyle[propertyName] == propertyValue
			*/
			var __bind__RE_FIRST_LETTER = this,
				propertyName_CC = (propertyName + "").replace(__bind__RE_FIRST_LETTER, ToCamel_replacer);

			var result = propertyName && propertyValue && (propertyName_CC in testStyle);

			if (result) {
				/*if( msie ) {
					try {
						testElement.style[propertyName] = propertyValue;// IE throw here, if unsupported this syntax
						testElement.style.cssText = "";
					}
					catch(e) {
						result = false;
					}
					if( result ) {
						testElement.id = uuid;
						_document.body.appendChild(testElement);
						if( (prevPropValue = testElement.currentStyle[propertyName]) != propertyValue ) {
							_document.body.insertAdjacentHTML("beforeend", "<br style='display:none' id='" + uuid + "br'><style id='" + uuid + "style'>" +
								"#" + uuid + "{display:none;height:0;width:0;visibility:hidden;position:absolute;position:fixed;" + propertyName + ":" + propertyValue + "}" +
								"</style>");
							if( !(propertyName in testElement.currentStyle) ) {
								partOfCompoundPropName
							}
							if( /\(|\s/.test(propertyValue) ) {
								currentPropValue = testElement.currentStyle[propertyName];
								result = !!currentPropValue && currentPropValue != prevPropValue;
							}
							else {
								result = testElement.currentStyle[propertyName] == propertyValue;
							}
							//_document.documentElement.removeChild(document.getElementById(uuid + "br"));
							//_document.documentElement.removeChild(document.getElementById(uuid + "style"));
						}
						//_document.documentElement.removeChild(testElement);
					}*/

				if (msie) {
					if (/\(|\s/.test(propertyValue)) {
						try {
							testStyle[propertyName_CC] = propertyValue;
							result = !!testStyle[propertyName_CC];
						} catch (e) {
							result = false;
						}
					} else {
						testStyle.cssText = "display:none;height:0;width:0;visibility:hidden;position:absolute;position:fixed;" + propertyName + ":" + propertyValue;
						document.documentElement.appendChild(testElement);
						result = testElement.currentStyle[propertyName_CC] === propertyValue;
						document.documentElement.removeChild(testElement);
					}
				} else if (testStyle.setProperty && testStyle.getPropertyValue) {
					testStyle.setProperty(propertyName, propertyValue);
					result = testStyle.getPropertyValue(propertyName) != null;
				} else {
					testStyle.cssText = propertyName + ":" + propertyValue;
					result = testStyle[propertyName_CC];
					result = result === propertyValue || result && testStyle.length > 0;
				}
			}

			testStyle.cssText = "";

			return prevResultsCache[name_and_value] = !!result;
		}.bind(
			/(-)([a-z])/g, // __bind__RE_FIRST_LETTER
			function(a, b, c) { // ToCamel_replacer
				return c.toUpperCase();
			},
			testElement.style, // testStyle
			msie ? testElement : null // testElement
		);
	}

	// _supportsCondition("(a:b) or (display:block) or (display:none) and (display:block1)")
	function _supportsCondition(str) {
		var result;
		if (str) {
			try {
				str = str.replace(/[\s\r\n\t]+/g, " ").replace(/\bnot\b/ig, "!").replace(/\band\b/ig, "&&").replace(/\bor\b/ig, "||").replace(/\(([\w\-]+)\s*:\s*(([^\(\):]+(\([^\(\):]+\))*)+)\s*\)/g, function(s, propertyName, propertyValue) {
					return (propertyName && propertyValue) ? _CSS_supports(propertyName, propertyValue) : s;
				});

				result = eval.call({}, str);
				if (typeof result === "boolean") {
					return result;
				}
			} catch (ex) {

			}
		}
		throw new Error("SYNTAX_ERR");
	}

	/**
	 * @expose
	 */
	_CSS.supports = function(a, b) {
		if (!arguments.length) {
			throw new Error("WRONG_ARGUMENTS_ERR"); //TODO:: DOMException ?
		}

		if (arguments.length === 1) {
			return _supportsCondition(a);
		}

		return _CSS_supports(a, b);
	};

	(global.stylefix || require("stylefix")).register(function(css, raw) {
		if (raw) {
			return css.replace(/@supports\s+([^\{]+)/g, function(str, strRules) {
				try {
					if (strRules && _supportsCondition(strRules)) {
						str = "@media all ";
					}
				} catch (ex) {

				}
				return str;
			});
		}
	});

	global = testElement = null; // no need this any more

})();