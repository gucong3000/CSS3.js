(function(window) {
	"use strict";
	var location = window.location,
		document = window.document,
		html = document.documentElement,
		StyleFix = window.stylefix || require("stylefix"),
		prefixfree = window.prefixfree || require("prefixfree");


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

	function _CSS_doc() {
		var result = true;
		for (var i = arguments.length - 1; i >= 0; i--) {
			result = result && _documentCondition(arguments[i]);
		}
		return result;
	}

	// _documentCondition("url() url-prefix() domain() regexp()")
	function _documentCondition(str) {
		var result,
			rule_type,
			rule_content,
			url_href = location.href;

		if (str) {
			rule_type = str.substr(0, str.indexOf("("));
			rule_content = (str.match(/\((.*?)\)/))[1];
			switch (rule_type) {
				case "url":
					if (url_href === rule_content) {
						result = true;
					}
					break;
				case "url-prefix":
					var url_prefix = url_href.substr(0, (url_href.lastIndexOf("/") + 1));
					if (url_prefix === rule_content) {
						result = true;
					}
					break;
				case "domain":
					var url_hostname = location.hostname;
					if (url_hostname.match(rule_content)) {
						result = true;
					}
					break;
				case "regexp":
					rule_content = rule_content.substr(1, (rule_content.length - 2));
					if (url_href.match(rule_content)) {
						result = true;
					}
					break;
				default:
					console.log("there no document solution like you write!");
			}
			return result || false;
		}
	}

	if (!support()) {
		StyleFix.register(function(css, raw) {
			if (raw) {
				return css.replace(/@document\s+([^\{]+)/g, function(str, strRules) {
					try {
						if (strRules && _CSS_doc(strRules)) {
							str = "@media all ";
						}
					} catch (ex) {

					}
					return str;
				});
			}
		});
	}

})(window);