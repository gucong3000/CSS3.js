(function(window) {
	"use strict";
	var location = window.location,
		document = window.document,
		html = document.documentElement,
		StyleFix = window.stylefix || require("stylefix"),
		prefixfree = window.prefixfree || require("prefixfree"),
		docFns = {
			url: function(url) {
				// 匹配整个URL
				return location.href === url;
			},
			"url-prefix": function(url) {
				// 匹配文档的URL是否以参数指定的值开头
				return regTest("^" + url);
			},
			domain: function(domain) {
				// 匹配文档的域名是否为参数中指定的域名或者为它的子域名
				return regTest("(^|.*?\\.)" + domain + "$", location.hostname);
			},
			regexp: function(regexp) {
				// 匹配文档的URL是否和参数中指定的正则表达式匹配.该表达式必须匹配整个URL.
				return regTest(regexp.replace(/([\"\'])(.+)\1/, "^$2$"));
			}
		};

	// 动态生成正则检测字符串
	function regTest(regexp, string) {
		return new RegExp(regexp).test(string || location.href);
	}

	// 测试浏览器是否原生支持@support指令
	function support() {
		// 已确定IE不支持、判断prefixfree组件是否有@document指令的私有属性前缀兼容
		var result = !StyleFix.ieVersion && prefixfree.atrules.indexOf("document") >= 0;
		if (!result) {
			// 目前尚无支持无前缀@support指令的浏览器，尝试向未来兼容
			var style = document.createElement("style");
			html.appendChild(style);
			// Safari 4 has issues with style.innerHTML
			style.textContent = "@document regexp(\".*\") {}";
			result = style.sheet.cssRules.length;
			html.removeChild(style);
		}
		return result;
	}

	function _document(strRules) {
		return strRules.split(/\s*,\s*(?=[\w\-]+\()/).some(function(rule) {
			rule = rule.match(/(.+)\(\s*(.+)\s*\)/);
			return docFns[rule[1]](rule[2]);
		});
	}

	if (!support()) {
		StyleFix.register(function(css, raw) {
			if (raw) {
				return css.replace(/@document\s+([^\{]+)/g, function(str, strRules) {
					try {
						if (strRules && _document(strRules)) {
							str = "@media all ";
						}
					} catch (ex) {

					}
					return str;
				});
			}
		});
		if (window.addEventListener) {
			window.addEventListener("popstate", function() {
				StyleFix.process();
			}, false);
		}
	}
})(window);