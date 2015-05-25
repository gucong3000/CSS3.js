/**
 * IE下各种css3属性兼容，圆角、盒阴影、背景渐变等
 */

"use strict";
(function(window) {

	var StyleFix = window.stylefix || require("stylefix"),
		ieVersion = StyleFix.ieVersion,
		properties = ieVersion < 9 ? ["border-radius", "box-shadow"] : [],
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
		//暴露出的接口
		try {
			module.exports = replace;
		} catch (e) {
			window.cssprops = replace;
		}
	}

})(window);