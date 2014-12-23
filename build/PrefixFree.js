(function(f){typeof define==="function"?define("PrefixFree",f):f()})(function(require,exports,module){/**
 * PrefixFree
 */

"use strict";
(function(window) {
	var document = window.document,
		root = document.documentElement,
		getComputedStyle = window.getComputedStyle,
		StyleFix = window.StyleFix || require("StyleFix");

	if (!StyleFix || !getComputedStyle) {
		return;
	}
	// Private helper
	function fix(what, before, after, replacement, css) {
		what = self[what];
		if (what.length) {
			var regex = new RegExp(before + "(" + what.join("|") + ")" + after, "gi");
			css = css.replace(regex, replacement);
		}
		return css;
	}

	/**
	 * @description 将字符串转换为驼峰式字符串
	 * @function camelCase
	 * @param {String} str 原始字符串
	 * @return {String} 驼峰式字符串
	 */
	function camelCase(str) {
		return str.replace(/-([a-z])/g, function($0, $1) {
			return $1.toUpperCase();
		}).replace("-", "");
	}

	/**
	 * @description 将字符串转换为连字符式字符串
	 * @function deCamelCase
	 * @param {String} str 原始字符串
	 * @return {String} 连字符式字符串
	 */
	function deCamelCase(str) {
		return str.replace(/[A-Z]/g, function($0) {
			return "-" + $0.toLowerCase();
		});
	}

	var self = {
		camelCase: camelCase,
		deCamelCase: deCamelCase,
		prefixCSS: function(css, raw) {
			var prefix = self.prefix;
			// Gradient angles hotfix
			if (self.functions.indexOf("linear-gradient") > -1) {
				// Gradients are supported with a prefix, convert angles to legacy
				css = css.replace(/(\s|:|,)(repeating-)?linear-gradient\(\s*(-?\d*\.?\d*)deg/gi, function($0, delim, repeating, deg) {
					return delim + (repeating || "") + "linear-gradient(" + (90 - deg) + "deg";
				});
			}
			css = fix("functions", "(\\s|:|,)", "\\s*\\(", "$1" + prefix + "$2(", css);
			css = fix("keywords", "(\\s|:)", "(\\s|;|\\}|$)", "$1" + prefix + "$2$3", css);
			css = fix("properties", "(^|\\{|\\s|;)", "\\s*:", "$1" + prefix + "$2:", css);
			// Prefix properties *inside* values (issue #8)
			if (self.properties.length) {
				var regex = new RegExp("\\b(" + self.properties.join("|") + ")(?!:)", "gi");
				css = fix("valueProperties", "\\b", ":(.+?);", function($0) {
					return $0.replace(regex, prefix + "$1");
				}, css);
			}
			if (raw) {
				css = fix("selectors", "", "\\b", self.prefixSelector, css);
				css = fix("atrules", "@", "\\b", "@" + prefix + "$1", css);
			}
			// Fix double prefixing
			css = css.replace(new RegExp("-" + prefix, "g"), "-");
			// Prefix wildcard
			css = css.replace(/-\*-(?=[a-z]+)/gi, self.prefix);
			return css;
		},
		property: function(property) {
			return (self.properties.indexOf(property) >= 0 ? self.prefix : "") + property;
		},
		value: function(value, property) {
			value = fix("functions", "(^|\\s|,)", "\\s*\\(", "$1" + self.prefix + "$2(", value);
			value = fix("keywords", "(^|\\s)", "(\\s|$)", "$1" + self.prefix + "$2$3", value);
			if (self.valueProperties.indexOf(property) >= 0) {
				value = fix("properties", "(^|\\s|,)", "($|\\s|,)", "$1" + self.prefix + "$2$3", value);
			}
			return value;
		},
		// Warning: Prefixes no matter what, even if the selector is supported prefix-less
		prefixSelector: function(selector) {
			return selector.replace(/^:{1,2}/, function($0) {
				return $0 + self.prefix;
			});
		},
		// Warning: Prefixes no matter what, even if the property is supported prefix-less
		prefixProperty: function(property, camelCase) {
			var prefixed = self.prefix + property;
			return camelCase ? self.camelCase(prefixed) : prefixed;
		}
	};
	/**************************************
	 * Properties
	 **************************************/
	(function() {
		var prefixes = {},
			properties = [],
			style = getComputedStyle(root, null),
			dummy = document.createElement("div").style,
			prefix = StyleFix.ieVersion ? "ms" : (window.opera ? "o" : (window.netscape ? "moz" : "webkit")),
			styleProto = window.CSSStyleDeclaration.prototype,

			// Why are we doing this instead of iterating over properties in a .style object? Cause Webkit won't iterate over those.
			iterate = function(property) {
				property = property.match(/^(-\w+-)(.+)/);
				if (property && !supported(property[2]) && supported(property[0])) {
					stylePropFix(property[2], property[0]);
				}
			},
			supported = function(property) {
				return property in style || self.camelCase(property) in dummy;
			},
			styleFnfix = function(fnName) {
				try {
					var fn = styleProto[fnName];
					if (fn && fn.apply) {
						styleProto[fnName] = function() {
							var propName = arguments[0];
							arguments[0] = prefixes[propName] || propName;
							return fn.apply(this, arguments);
						};
					}
				} catch(ex){
				}
			},
			stylePropFix = function(prop, prefixProp) {
				if (!prefixes[prop]) {
					prefixes[prop] = prefixProp;
					properties.push(prop);
					iterate(prefixProp.replace(/-\w+$/, ""));
					prefixProp = self.camelCase(prefixProp);
					Object.defineProperty(styleProto, self.camelCase(prop), {
						get: function() {
							return this[prefixProp];
						},
						set: function(val) {
							this[prefixProp] = val;
						},
						configurable: true,
						enumerable: true
					});
				}
			};

		for (var i in styleProto) {
			if (/Property/.test(i)) {
				styleFnfix(i);
			}
		}

		// Some browsers have numerical indices for the properties, some don't
		if (style.length > 0) {
			[].slice.call(style, 0).forEach(iterate);
		} else {
			for (var property in style) {
				iterate(self.deCamelCase(property));
			}
		}

		self.prefix = "-" + prefix + "-";
		self.Prefix = self.camelCase(prefix);

		// IE fix
		if (self.Prefix === "Ms" && !("transform" in dummy) && !("MsTransform" in dummy) && "msTransform" in dummy) {
			properties.push("transform", "transform-origin");
		}
		self.properties = properties.sort();
	}());
	/**************************************
	 * Values
	 **************************************/
	(function() {
		// Values that might need prefixing
		var functions = {
			"linear-gradient": {
				property: "backgroundImage",
				params: "red, teal"
			},
			"calc": {
				property: "width",
				params: "1px + 5%"
			},
			"element": {
				property: "backgroundImage",
				params: "#foo"
			},
			"cross-fade": {
				property: "backgroundImage",
				params: "url(a.png), url(b.png), 50%"
			}
		};
		functions["repeating-linear-gradient"] = functions["repeating-radial-gradient"] = functions["radial-gradient"] = functions["linear-gradient"];
		// Note: The properties assigned are just to *test* support. 
		// The keywords will be prefixed everywhere.
		var keywords = {
			"initial": "color",
			"zoom-in": "cursor",
			"zoom-out": "cursor",
			"box": "display",
			"flexbox": "display",
			"inline-flexbox": "display",
			"flex": "display",
			"inline-flex": "display",
			"grid": "display",
			"inline-grid": "display",
			"min-content": "width"
		};
		var property;
		self.functions = [];
		self.keywords = [];
		var style = document.createElement("div").style;

		function supported(value, property) {
			style[property] = "";
			style[property] = value;
			return !!style[property];
		}
		for (var func in functions) {
			var test = functions[func],
				value = func + "(" + test.params + ")";
			property = test.property;
			if (!supported(value, property) && supported(self.prefix + value, property)) {
				// It's supported, but with a prefix
				self.functions.push(func);
			}
		}
		for (var keyword in keywords) {
			property = keywords[keyword];
			if (!supported(keyword, property) && supported(self.prefix + keyword, property)) {
				// It's supported, but with a prefix
				self.keywords.push(keyword);
			}
		}
	}());
	/**************************************
	 * Selectors and @-rules
	 **************************************/
	(function() {
		var selectors = {
				":read-only": null,
				":read-write": null,
				":any-link": null,
				"::selection": null
			},
			atrules = {
				"keyframes": "name",
				"viewport": null,
				"document": "regexp(\".\")"
			},
			test;
		self.selectors = [];
		self.atrules = [];
		var style = root.appendChild(document.createElement("style"));

		function supported(selector) {
			style.textContent = selector + "{}";
			// Safari 4 has issues with style.innerHTML
			return !!style.sheet.cssRules.length;
		}
		for (var selector in selectors) {
			test = selector + (selectors[selector] ? "(" + selectors[selector] + ")" : "");
			if (!supported(test) && supported(self.prefixSelector(test))) {
				self.selectors.push(selector);
			}
		}
		for (var atrule in atrules) {
			test = atrule + " " + (atrules[atrule] || "");
			if (!supported("@" + test) && supported("@" + self.prefix + test)) {
				self.atrules.push(atrule);
			}
		}
		root.removeChild(style);
	}());
	// Properties that accept properties as their value
	self.valueProperties = [
		"transition",
		"transition-property"
	];
	// Add class for current prefix
	root.className += " " + self.prefix;
	StyleFix.register(self.prefixCSS);

	try {
		module.exports = self;
	} catch (e) {
		window.PrefixFree = self;
	}

})(window);});