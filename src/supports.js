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
		_CSS = global.CSS || (global.CSS = {}),
		_CSS_supports = _CSS.supports;

	// ---=== HAS supportsCSS support ===---
	if (typeof _CSS_supports === "function") {
		try {
			_CSS_supports.call(_CSS, "(a:a)");
			// SUCCESS
			return; // Do not need anything to do. Exit from polyfill
		} catch (e) {
			//FAIL
		}
	} else if (global.supportsCSS) { // Opera 12.10 impl
		_CSS_supports = function() {
			return global.supportsCSS.apply(global, arguments);
		};
	} else {

		// ---=== NO CSS.supports support ===---

		var document = global.document,
			testElement = document.createElement("_"),
			prevResultsCache = {},
			testStyle = testElement.style, // testStyle
			html = document.documentElement,
			StyleFix;

		// _CSS_supports = function(ToCamel_replacer, testStyle, testElement, propertyName, propertyValue) {
		_CSS_supports = function(propertyName, propertyValue) {
			var name_and_value = propertyName + "\\/" + propertyValue,
				propertyName_CC;
			if (name_and_value in prevResultsCache) {
				return prevResultsCache[name_and_value];
			}

			var result = propertyName && propertyValue && ((propertyName_CC = propertyName.replace(/-(\w)/g, toCamel_replacer)) in testStyle);

			if (result) {

				// 优先尝试使用setProperty和getPropertyValue，因为prefixfree插件在这里留了私有属性前缀兼容
				if (testStyle.setProperty && testStyle.getPropertyValue) {
					testStyle.setProperty(propertyName, propertyValue);
					result = testStyle.getPropertyValue(propertyName) === propertyValue;
				} else if (testElement.currentStyle) {
					testStyle.cssText = "top:-99999px;left:-99999px;position:absolute;" + propertyName + ":" + propertyValue;
					html.appendChild(testElement);
					result = testElement.currentStyle[propertyName_CC] === propertyValue;
					html.removeChild(testElement);
				} else {
					testStyle.cssText = propertyName + ":" + propertyValue;
					result = testStyle[propertyName_CC];
					result = result === propertyValue || result && testStyle.length > 0;
				}
			}

			testStyle.cssText = "";

			return prevResultsCache[name_and_value] = !!result;
		};

		try {
			StyleFix = global.stylefix || require("stylefix");
		} catch (ex) {

		}

		// 在此注册StyleFix.register，是因Opera 12.1下支持window.supportsCSS()，且无需修复css，只需兼容DOM API即可
		if (StyleFix) {
			StyleFix.register(function(css, raw) {
				if (raw) {
					return css.replace(/@supports\s+(.*?)\s*\{/g, function(str, strRules) {
						try {
							if (strRules && _supportsCondition(strRules)) {
								str = "@media all {";
							}
						} catch (ex) {

						}
						return str;
					});
				}
			});
		}
	}

	// toCamel_replacer
	function toCamel_replacer(a, letter) {
		return letter.toUpperCase();
	}

	// _supportsCondition("(a:b) or (display:block) or (display:none) and (display:block1)")
	function _supportsCondition(str) {
		var result;
		if (str) {
			str = str.replace(/[\s\r\n\t]+/g, " ").replace(/\bhttps?:(\/\/)/ig, "$1").replace(/\bnot\b/ig, "!").replace(/\band\b/ig, "&&").replace(/\bor\b/ig, "||").replace(/\(([\w\-]+)\s*:\s*(([^\(\):]+(\(([^\(\):]+(\([^\(\):]+\))*)+\))*)+)\s*\)/g, function(s, propertyName, propertyValue) {
				return (propertyName && propertyValue) ? _CSS_supports(propertyName, propertyValue) : s;
			});
			try {
				result = eval.call({}, str);
			} catch (ex) {

			}
		}
		return result || false;
	}

	/**
	 * @expose
	 */
	_CSS.supports = function(a, b) {
		var argLen = arguments.length;

		if (argLen) {
			return argLen === 1 ? _supportsCondition(a) : _CSS_supports(a, b);
		} else {
			throw new Error("WRONG_ARGUMENTS_ERR"); //TODO:: DOMException ?
		}
	};

})();