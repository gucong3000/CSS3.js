/**
 * IE6下position: fixed;兼容
 */

"use strict";
(function(window, StyleFix, cssprops) {

	var expression = express("$1", "$2") + "$3",
		document = window.document,
		html = document.documentElement,
		fixedhelper = "fixed_helper_" + document.uniqueID,
		ieVersion = StyleFix.ieVersion,
		isNaN = window.isNaN,
		cssValCache = {},
		absUnits = {
			cm: 2.54,
			mm: 25.4,
			q: 101.6,
			pt: 72,
			pc: 6,
			"in": 1
		};

	function express(propName, propVlaue) {
		propVlaue = propVlaue || "auto";
		return propName + ":expression((window.posfixed || seajs.require)(\"posfixed\")(this,\"" + propName + "\",\"" + propVlaue + "\"))";
	}

	function posfixed(element, propName, propVlaue) {
		// uniqueID：IE的特有属性，表示dom唯一标识
		var uniqueID = element.uniqueID,
			// cssCache
			cssCache = cssValCache[uniqueID],
			returnValue;

		// 将长度+单位的字符串数据，转为Number
		function parseLength(propVlaue, isWidth) {
			var value,
				unit;
			if (propVlaue && (propVlaue = propVlaue.match(/^([\d\.]+)(.*)$/))) {
				value = parseFloat(propVlaue[1]);
				unit = propVlaue[2];

				if (unit && unit !== "px") {
					if (unit === "%") {
						value *= html[isWidth ? "offsetWidth" : "offsetHeight"] / 100;
					} else if (unit && absUnits[unit]) {
						// 如果是绝对长度单位，根据dpi换算
						value *= (screen[isWidth ? "logicalXDPI" : "logicalYDPI"] || 96) / absUnits[unit];
					} else if (unit === "rem" && element !== html) {
						value *= parseLength(html.currentStyle.fontSize);
					} else if (unit === "em") {
						value *= parseLength(element.currentStyle.fontSize);
					}
				}
			} else {
				value = NaN;
			}
			return value;
		}

		// 将长度+单位的字符串数据，转为Int
		function length2Int(propVlaue, isWidth) {
			return Math.round(parseLength(propVlaue, isWidth));
		}

		// 转化为小写
		propName = propName.toLowerCase();
		propVlaue = propVlaue.toLowerCase();

		// 第一次运行函数时，cssCache不存在，将建立新缓存
		if (!cssCache) {
			cssValCache[uniqueID] = cssCache = {};
			cssCache.fixedright = cssCache.fixedbottom = "auto";
		}

		cssCache[propName] = propVlaue;

		if (propName === "position") {
			if (propVlaue === "fixed") {
				if (cssCache.fixed) {
					var left = length2Int(cssCache.left, true),
						top = length2Int(cssCache.top),
						right = length2Int(cssCache.right, true),
						bottom = length2Int(cssCache.bottom),
						body = document.body,
						offsetParent = element.offsetParent,
						scrollTop = html.scrollTop || body.scrollTop,
						scrollLeft = html.scrollLeft || body.scrollLeft;

					// 修正父定位对象（offsetParent）不为文档根节点时，与其他浏览器的位置差异
					while (offsetParent && offsetParent !== html) {
						scrollTop -= offsetParent.offsetTop;
						scrollLeft -= offsetParent.offsetLeft;
						offsetParent = offsetParent.offsetParent;
					}

					cssCache.fixedtop = isNaN(top) ? (isNaN(bottom) ? cssCache.top : scrollTop + html.clientHeight - element.offsetHeight - bottom) : scrollTop + top;
					cssCache.fixedleft = isNaN(left) ? (isNaN(right) ? cssCache.left : scrollLeft + html.clientWidth - element.offsetWidth - right) : scrollLeft + left;

				} else {
					setTimeout(function() {
						if (!(cssCache.top && cssCache.left)) {
							element.className += " " + fixedhelper;
						}
					}, 1);

					cssCache.fixed = true;
				}

				returnValue = "absolute";
			}
		} else if (cssCache.position === "fixed") {
			returnValue = cssCache["fixed" + propName];
		}

		return returnValue || propVlaue;
	}


	if (ieVersion < 7) {
		// position: fixed; >>> position: absolute;
		cssprops.push([
			//用正则匹配到position：fixed代码段
			/^(position)\s*:\s*(\w+)([\};]|$)/i,
			//替换IE的css表达式，并且传入逻辑处理的函数
			expression
		]);
		cssprops.push([
			/^(left|top|right|bottom)\s*:\s*([\d\.]+[\w\%]*)([\s\}\/;]|$)/i,
			expression
		]);

		//暴露出的接口
		try {
			module.exports = posfixed;
		} catch (e) {
			window.posfixed = posfixed;
		}

		// 向文档中写入css
		StyleFix.ready(function() {
			StyleFix.addRestCss("html{background: url(about:blank) no-repeat fixed}." + fixedhelper + "{" + express("top") + ";" + express("left") + "}");
		});
	}
})(window, window.stylefix || require("stylefix"), window.cssprops || require("cssprops"));