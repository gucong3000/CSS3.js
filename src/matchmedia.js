/* MediaMatch v.2.0.2 - Testing css media queries in Javascript. Authors & copyright (c) 2013: WebLinc, David Knight. */

"use strict";
(function(win) {
	var eventPrefix = "",
		addEvent = win.addEventListener || (eventPrefix = "on") && win.attachEvent,
		StyleFix = win.stylefix || require("stylefix"),
		cssunits = win.cssunits || require("cssunits");

	// Internal globals
	var _dpi,
		_doc = win.document,
		_queries = [],
		_queryID = 0,
		_type = "",
		_features = {},
		// only screen
		// only screen and
		// not screen
		// not screen and
		// screen
		// screen and
		_typeExpr = /\s*(only|not)?\s*(screen|print|[a-z\-]+)\s*(and)?\s*/i,
		// (min-width: 300px)
		// (width: 300px)
		// (width)
		// (orientation: portrait|landscape)
		_mediaExpr = /^\s*\(\s*(min-|max-)?([\w\-]+)\s*(:?\s*(\d+(\.\d+)?(\/\d+(\.\d+)?)?|portrait|landscape)(\w+)?)?\s*\)\s*$/,
		_timer,

		// Helper methods

		/*
			_matches
		 */
		_toFixed = function(num) {
			// 数字精确到小数点后四位，再往后四舍五入
			return +(num).toFixed(4);
		},

		/*
			_matches
		 */
		_matches = function(media) {

			// screen and (min-width: 400px), screen and (max-width: 500px)
			var mql = (media.indexOf(",") !== -1 && media.split(",")) || [media],
				mqIndex = mql.length - 1,
				mqLength = mqIndex,
				mq = null,

				// not screen, screen
				negateType = null,
				negateTypeFound = "",
				negateTypeIndex = 0,
				negate = false,
				type = "",

				// (min-width: 400px), (min-width)
				exprListStr = "",
				exprList = null,
				exprIndex = 0,
				exprLength = 0,
				expr = null,

				prefix = "",
				length = "",
				unit = "",
				value = "",
				feature = "",

				match = false;

			if (media === "") {
				return true;
			}

			do {
				mq = mql[mqLength - mqIndex];
				negate = false;
				negateType = mq.match(_typeExpr);

				if (negateType) {
					negateTypeFound = negateType[0];
					negateTypeIndex = negateType.index;
				}

				if (!negateType || ((mq.substring(0, negateTypeIndex).indexOf("(") === -1) && (negateTypeIndex || (!negateType[3] && negateTypeFound !== negateType.input)))) {
					match = false;
					continue;
				}

				exprListStr = mq;

				negate = negateType[1] === "not";

				if (!negateTypeIndex) {
					type = negateType[2];
					exprListStr = mq.substring(negateTypeFound.length);
				}

				// Test media type
				// Test type against this device or if "all" or empty ""
				match = type === _type || type === "all" || type === "";

				exprList = (exprListStr.indexOf(" and ") !== -1 && exprListStr.split(" and ")) || [exprListStr];
				exprIndex = exprList.length - 1;
				exprLength = exprIndex;

				if (match && exprIndex >= 0 && exprListStr !== "") {
					do {
						expr = exprList[exprIndex].match(_mediaExpr);

						if (!expr || !(feature = _features[expr[2]])) {
							match = false;
							break;
						}

						prefix = expr[1];
						length = expr[4];
						unit = expr[8];
						feature = feature.call ? feature() : feature;

						// Convert unit types
						if (unit) {
							value = cssunits.parse(length + unit);
							if (!value) {
								if (unit === "px") {
									// If unit is px
									value = Number(length);
								} else if (unit === "dppx") {
									// Convert resolution dppx unit to pixels
									value = length * 96;
								} else if (unit === "dpcm") {
									// Convert resolution dpcm unit to pixels
									value = length * 0.3937;
								}
							}
						} else if (expr[6]) {
							try {
								value = eval.call(_features, length);
							} catch (ex) {

							}
						}
						value = value || Number(length);

						// Test for prefix min or max
						// Test value against feature
						if (value) {
							feature = _toFixed(feature);
							value = _toFixed(value);
							if (prefix === "min-") {
								match = feature >= value;
							} else if (prefix === "max-") {
								match = feature <= value;
							} else {
								match = feature === value;
							}
						} else {
							match = !!feature;
						}

						// If "match" is false, break loop
						// Continue main loop through query list
						if (!match) {
							break;
						}
					} while (exprIndex--);
				}

				// If match is true, break loop
				// Once matched, no need to check other queries
				if (match) {
					break;
				}
			} while (mqIndex--);

			return negate ? !match : match;
		},

		/*
			_watch
		 */
		_watch = function() {
			clearTimeout(_timer);

			_timer = setTimeout(function() {
				var query = null,
					qIndex = _queryID - 1,
					qLength = qIndex,
					match = false;

				if (qIndex >= 0) {

					do {
						query = _queries[qLength - qIndex];

						if (query) {
							match = _matches(query.mql.media);

							if (match !== query.mql.matches) {
								query.mql.matches = match;

								if (query.listeners) {
									for (var i = 0, il = query.listeners.length; i < il; i++) {
										if (query.listeners[i]) {
											query.listeners[i].call(win, query.mql);
										}
									}
								}
							}
						}
					} while (qIndex--);
				}

			}, 10);
		},

		/*
			_init
		 */
		_init = function() {
			var head = _doc.getElementsByTagName("head")[0],
				style = _doc.createElement("style"),
				info = null,
				typeList = ["screen", "print", "speech", "projection", "handheld", "tv", "braille", "embossed", "tty"],
				typeIndex = 0,
				typeLength = typeList.length,
				cssText = "#mediamatchjs { position: relative; z-index: 0; }",
				w = function() {
					return cssunits.innerWidth;
				},
				h = function() {
					return cssunits.innerHeight;
				},
				screen = win.screen,
				dw = screen.width,
				dh = screen.height,
				c = screen.colorDepth,
				ratio = cssunits.ratio;

			_dpi = cssunits.dpi;

			// Sets properties of "_features" that change on resize and/or orientation.
			_features["aspect-ratio"] = function() {
				return (w() / h());
			};
			_features.orientation = function() {
				return (h() >= w() ? "portrait" : "landscape");
			};

			_features.msie = StyleFix.ieVersion;
			_features.width = w;
			_features.height = h;
			_features["device-width"] = dw;
			_features["device-height"] = dh;
			_features["device-aspect-ratio"] = (dw / dh);
			_features.color = c;
			_features["color-index"] = Math.pow(2, c);
			_features.resolution = _dpi;
			_features["device-pixel-ratio"] = ratio;

			style.type = "text/css";
			style.id = "mediamatchjs";

			head.appendChild(style);

			// Must be placed after style is inserted into the DOM for IE
			info = (win.getComputedStyle && win.getComputedStyle(style)) || style.currentStyle;

			// Create media blocks to test for media type
			for (; typeIndex < typeLength; typeIndex++) {
				cssText += "@media " + typeList[typeIndex] + " { #mediamatchjs { z-index: " + typeIndex + " } }";
			}

			// Add rules to style element
			if (style.styleSheet) {
				style.styleSheet.cssText = cssText;
			} else {
				style.textContent = cssText;
			}

			// Get media type
			_type = typeList[(info.zIndex * 1) || 0];

			head.removeChild(style);

			// Set up listeners
			addEvent(eventPrefix + "resize", _watch);
			addEvent(eventPrefix + "orientationchange", _watch);

		};

	_init();
	/*
	A list of parsed media queries, ex. screen and (max-width: 400px), screen and (max-width: 800px)
	*/

	function matchMedia(media) {
		var id = _queryID,
			mql = {
				matches: false,
				media: media,
				addListener: function addListener(listener) {
					_queries[id].listeners || (_queries[id].listeners = []);
					listener && _queries[id].listeners.push(listener);
				},
				removeListener: function removeListener(listener) {
					var query = _queries[id],
						i = 0,
						il = 0;
					if (!query) {
						return;
					}
					il = query.listeners.length;
					for (; i < il; i++) {
						if (query.listeners[i] === listener) {
							query.listeners.splice(i, 1);
						}
					}
				}
			};
		if (media === "") {
			mql.matches = true;
			return mql;
		}
		mql.matches = _matches(media);
		_queryID = _queries.push({
			mql: mql,
			listeners: null
		});
		return mql;
	}

	var self;

	if (win.matchMedia) {
		self = win.matchMedia;
	} else {

		win.matchMedia = self = matchMedia;

		// 判断浏览器是否支持media query
		if (win.styleMedia) {
			// 如果浏览器原生支持media query，则仅仅兼容(max-msie: x)语法即可，其他功能依赖cssunits插件实现即可
			StyleFix.register(function(css, raw) {
				if (raw) {
					return css.replace(/@media\s+([^\{]+)/g, function(str, strRules) {
						return "@media " + strRules.replace(/\(\s*(m(ax|in)-)?msie\s*:\s*\d(\.\d+)?\s*\)/ig, function(str) {
							return _matches(strRules) ? "(min-width:0)" : str;
						});
					});
				}
			});
		} else {
			// 如果浏览器完全不支持media query，则为其添加支持
			StyleFix.register(function(css, raw) {
				if (raw) {
					return css.replace(/@media\s+(.*?\(.*?)\s*\{/g, function(str, strRules) {
						strRules = strRules.toLowerCase();
						// 将注释中储存了的原始值，再次取出
						if (/^all\s*\/\*\s*rawrules`([^`]+)`\s*\*\/$/.test(strRules)) {
							strRules = RegExp.$1;
						}
						// 屏幕宽度，高度，长宽比等才是动态数据，才需要在注释中保留原始值
						var strRawRules = /\(\s*(m(ax|in)-)?(height|width|aspect-ratio)\s*\:/.test(strRules) || /\(\s*orientation\s*:\s*(portrait|landscape)\s*\)/.test(strRules) ? " /* rawrules`" + strRules + "` */" : "";
						str = "@media " + (_matches(strRules) ? "all" + strRawRules : strRules) + " {";
						return str;
					});
				}
			});
		}

	}

	try {
		module.exports = self;
	} catch (e) {}
})(window);