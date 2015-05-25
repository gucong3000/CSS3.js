"use strict";
(function(window) {
	require("prefixfree");
	require("stylefix");
	var StyleFix = window.stylefix || require("stylefix"),
		devicePixelRatio = window.devicePixelRatio || 1,
		regexp = /([\s\:\,])image-set\(\s*url\(.*?\)\s+\d+(\.\d+)?x(\s*,\s*url\(.*?\)\s+\d+(\.\d+)?x)*\s*\)/i;

	function imageset(sets) {
		var url,
			ratio;
		sets.forEach(function(set) {
			set = set.match(/^(.*?)\s+([\d\.]+)x$/);
			var ratioX = +set[2];

			if (ratioX >= devicePixelRatio && (!ratio || ratioX <= ratio)) {
				ratio = ratioX;
				url = set[1];
			}
		});
		return url || "imageset(" + sets.join(", ") + ")";
	}

	if (!CSS.supports("(background:image-set(url(foo.png) 1x)")) {
		StyleFix.register(function(css) {
			return css.replace(regexp, function($0, $1) {
				return $1 + imageset($0.slice(11, $0.length - 1).trim().split(/\s*,\s*/));
			});
		});
	}
})(window);