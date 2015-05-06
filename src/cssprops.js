"use strict";
(function(window) {

	var StyleFix = window.stylefix || require("stylefix"),
		ieVersion = StyleFix.ieVersion,
		properties = ieVersion < 9 ? ["border-radius", "box-shadow"] : [],
		cssValCache = {},
		attachCache = {},
		domPatches = {},
		replace = [];

	function attachPie(element) {
		var uniqueID = element.uniqueID;
		if (!attachCache[uniqueID]) {
			try {
				(window.PIE || require("PIE")).attach(element);
				attachCache[uniqueID] = true;
			} catch (ex) {}
		}
	}

	// IE6-10
	if (ieVersion < 11) {
		// 兼容border-image
		properties.push("border-image");

		// IE6-9
		if (ieVersion < 10) {
			// background: xxxx-gradient(...) >>> -pie-background: xxxx-gradient(...)
			replace.push([
				/^(background(-\w+)?\s*:\s*(\w+-)+gradient\s*\([^;\}]+)/i,
				"-pie-$1;"
			]);

			properties.push("-pie-background");

			// IE9
			if (ieVersion === 9) {
				// transform: xxxx >>> -ms-transform: xxxx
				replace.push([
					/^(transform(-\w+)?\s*:[^;\}]+)/i,
					"-ms-$1;"
				]);
				// filter: Alpha(0.8); >>> NULL;
				replace.push([
					/^filter\s*:\s*([^;\}]+)/i,
					function(s, vals) {
						// Disable some filter that conflict with CSS3
						vals = vals.split(/\s+(?=\w+\s*[\(\:])/).filter(function(filter) {
							return !/^(progid\s*\:\s*DXImageTransform\.Microsoft\.)?(Alpha|Matrix|Gradient|FlipH|FlipV)\s*\(/i.test(filter);
						}).join(" ").trim();
						return vals ? "filter: " + vals : "";
					}
				]);
				// IE6-8
			} else if (ieVersion < 8) {
				// display: inline-block; >>> display: inline;zoom:1;
				replace.push([
					/^(display\s*:\s*inline)-block\b/i,
					"$1;zoom:1"
				]);
				// IE6
				if (ieVersion < 7) {
					// position: fixed; >>> position: absolute;
					replace.push([
						//用正则匹配到position：fixed代码段
						/^(position)\s*:\s*(\w+)([\};]|$)/i,
						//替换IE的css表达式，并且传入逻辑处理的函数
						"$1:expression(seajs.require(\"cssprops\")(this,\"$1\",\"$2\"))$3"
					]);
					replace.push([
						/^(left|top|right|bottom)\s*:\s*([\d\.+]*\w*)([\};]|$)/i,
						"$1:expression(seajs.require(\"cssprops\")(this,\"$1\",\"$2\"))$3"
					]);
					properties.push("-pie-png-fix");
				}
			}
		}

		properties = new RegExp("([^{}]+){[^{}]+(" + properties.join("|") + ")", "g");
		StyleFix.register(function(css, raw, element) {
			// css样式内容替换
			if (replace.length) {
				// 将所有css属性拆解
				css = css.replace(/\b[\w\-]+\s*:[^\{\};]+([\};]|$)/g, function(prop) {
					// 将单条css属性hack
					replace.forEach(function(rep) {
						prop = prop.replace(rep[0], rep[1]);
					});
					return prop;
				});
			}
			// 查找需要应用PIE的元素
			var props = css.match(properties);
			if (props) {
				if (raw) {
					// 注册需要应用PIE的css选择符
					props.forEach(function(raw) {
						domPatches[raw.replace(/^\s+/, "").replace(/\s*{[\s\S]*$/, "").replace(/[\s\t\r\n]+/g, " ")] = attachPie;
					});
				} else {
					// 将DOM元素应用PIE
					attachPie(element);
				}
			}
			return css;
		});
		StyleFix.ready(function() {
			setInterval(function() {
				// 遍历已注册的需要应用PIE的css的选择器，查找到DOM元素应用PIE
				for (var i in domPatches) {
					StyleFix.query(i).forEach(domPatches[i]);
				}
			}, 250);
		});
	}

	//暴露出的接口
	module.exports = function(element, propName, propVlaue) {
		// uniqueID：IE的特有属性，表示dom唯一标识
		var uniqueID = element.uniqueID,
			// cssCache
			cssCache = cssValCache[uniqueID],
			returnValue;


		// 转化为小写
		propName = propName.toLowerCase();
		propVlaue = propVlaue.toLowerCase();

		// 第一次运行函数时，cssCache不存在，将以下值缓存
		if (!cssCache) {
			cssValCache[uniqueID] = cssCache = {};
		}

		if (propName === "position" && propVlaue === "fixed") {
			var left = parseInt(cssCache.left),
				top = parseInt(cssCache.top),
				right = parseInt(cssCache.right),
				bottom = parseInt(cssCache.bottom),
				html = document.documentElement;
			cssCache.fixedleft = isNaN(left) ? (isNaN(right) ? cssCache.left : html.scrollLeft + html.clientWidth - element.offsetHeight - right) : html.scrollLeft + left;
			cssCache.fixedright = "auto";
			cssCache.fixedtop = isNaN(top) ? (isNaN(bottom) ? cssCache.top : html.scrollTop + html.clientHeight - element.offsetHeight - right) : html.scrollTop + top;;
			cssCache.fixedbottom = "auto";

			returnValue = "absolute";

		} else if (cssCache.position === "fixed") {
			returnValue = cssCache["fixed" + propName];
		}

		cssCache[propName] = propVlaue;
		return returnValue || propVlaue;
	};
})(window);