/**
 * 兼容css中 background: image-set(url(foo.png) 1x);
 * 兼容HTML中<img srcset="foo_1x.png 1x, foo_2x.png 2x">
 */

"use strict";
(function(window) {
	require("prefixfree");
	require("stylefix");
	var StyleFix = window.stylefix || require("stylefix"),
		screen = window.screen,
		devicePixelRatio = window.devicePixelRatio || (screen.deviceXDPI / screen.logicalXDPI) || 1,
		strSrcSet = "srcset";

	// 从给入的srcset属性或image-set()方法参数中返回匹配devicePixelRatio的项目
	function imageset(sets) {
		var uri,
			ratio;
		sets.trim().split(/\s*,\s*/).forEach(function(set) {
			set = set.match(/^(.*?)\s+([\d\.]+)x$/);
			var ratioX = +set[2];

			if (ratioX >= devicePixelRatio && (!ratio || ratioX <= ratio)) {
				ratio = ratioX;
				uri = set[1];
			}
		});
		return uri;
	}

	function srcSet(img) {
		var srcset = img.srcset || img.getAttribute(strSrcSet, 2);
		// 直接使用img.src会导致赋值后某些浏览器自动为其补全完整url，从而导致不等式永远为真
		if (srcset && (srcset = imageset(srcset)) && srcset !== img.getAttribute("src")) {
			img.setAttribute("src", srcset);
		}
	}

	function fixSrcSet() {
		StyleFix.query("img").forEach(srcSet);
	}

	// CSS中兼容image-set()方法
	if (!CSS.supports("(background: image-set(url(foo.png) 1x))")) {
		StyleFix.register(function(css) {
			return css.replace(/([\s\:\,])image-set\(\s*(url\(.*?\)\s+\d+(\.\d+)?x(\s*,\s*url\(.*?\)\s+\d+(\.\d+)?x)*)\s*\)/ig, function($0, $1, $2) {
				return $1 + (imageset($2) || $0.slice(0));
			});
		});
	}

	// HTML中兼容srcset属性
	if (!(strSrcSet in new Image())) {
		StyleFix.ready(fixSrcSet);
		if (window.addEventListener) {
			["DOMAttrModified", "DOMNodeInserted"].forEach(function(eventName) {
				window.addEventListener(eventName, fixSrcSet, false);
			});

			// 修复Image.prototype
			Object.defineProperty(Image.prototype, strSrcSet, {
				get: function() {
					return this.getAttribute(strSrcSet, 2) || "";
				},
				set: function(val) {
					if (val !== this[strSrcSet]) {
						this.setAttribute(strSrcSet, val);
					}
					srcSet(this);
				},
				enumerable: true
			});
		}

		if (window.attachEvent) {
			window.attachEvent("onpropertychange", fixSrcSet);
		}
	}

})(window);