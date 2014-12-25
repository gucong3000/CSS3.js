(function(f){typeof define==="function"?define("browser",f):f()})(function(require,exports,module){"use strict";

var win = window,
	doc = win.document,
	documentMode = doc.documentMode,
	compatMode = doc.compatMode,
	Prefix = "",
	prefix = "",
	msie,
	rv,
	jscript = (function(udf) {
		/*@cc_on return @_jscript_version @*/
		return udf;
	})();

if (jscript) {
	/*
	 * IE浏览器版本获取思路
	 * IE9-11， js引擎版本号与浏览器版本号相同
	 * 有document.documentMode，说明IE8以上
	 * 有XMLHttpRequest，说明IE7以上
	 * 有compatMode，说明IE6以上
	 */
	//IE版本，msie为文档模式，rv为浏览器版本
	rv = jscript > 8 ? jscript : compatMode ? "XMLHttpRequest" in win ? documentMode ? 8 : 7 : 6 : 5;
	//msie直接采用document.documentMode，IE6\7浏览器按高版IE的documentMode规则计算
	msie = documentMode || (compatMode === "CSS1Compat" ? rv : 5);
} else if (documentMode) {
	msie = documentMode;
	rv = rv || documentMode;
} else if (win.opera) {
	Prefix = "O";
} else if (win.netscape) {
	Prefix = "Moz";
} else {
	Prefix = "webkit";
}
if (documentMode > 8) {
	Prefix = "ms";
}
if (Prefix) {
	prefix = "-" + Prefix.toLowerCase() + "-";
}

module.exports = {
	Prefix: Prefix,
	prefix: prefix,
	msie: msie,
	rv: rv
};});