"use strict";
(function(window) {

	var expression = express("$1", "$2") + "$3",
		StyleFix = window.stylefix || require("stylefix"),
		cssprops = window.cssprops || require("cssprops"),
		document = window.document,
		html = document.documentElement,
		fixedhelper = "fixed_helper_" + document.uniqueID,
		head = html.childNodes[0],
		ieVersion = StyleFix.ieVersion,
		cssValCache = {},
		style;

	function express(propName, propVlaue) {
		propVlaue = propVlaue || "auto";
		return propName + ":expression(seajs.require(\"posfixed\")(this,\"" + propName + "\",\"" + propVlaue + "\"))";
	}

	function posfixed(element, propName, propVlaue) {
		// uniqueID：IE的特有属性，表示dom唯一标识
		var uniqueID = element.uniqueID,
			// cssCache
			cssCache = cssValCache[uniqueID],
			returnValue;


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
					var left = parseInt(cssCache.left),
						top = parseInt(cssCache.top),
						right = parseInt(cssCache.right),
						bottom = parseInt(cssCache.bottom);

					cssCache.fixedleft = isNaN(left) ? (isNaN(right) ? cssCache.left : html.scrollLeft + html.clientWidth - element.offsetWidth - right) : html.scrollLeft + left;
					cssCache.fixedtop = isNaN(top) ? (isNaN(bottom) ? cssCache.top : html.scrollTop + html.clientHeight - element.offsetHeight - bottom) : html.scrollTop + top;

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
			/^(left|top|right|bottom)\s*:\s*([\d\.+]*\w*)([\};]|$)/i,
			expression
		]);

		StyleFix.ready(function() {
			style = document.createElement("style");
			head.insertBefore(style, head.firstChild);
			StyleFix.cssContent(style, "html{background: url(about:blank) no-repeat fixed}." + fixedhelper + "{" + express("top") + ";" + express("left") + "}");
		});


		//暴露出的接口
		try {
			module.exports = posfixed;
		} catch (e) {
			window.posfixed = posfixed;
		}
	}
})(window);