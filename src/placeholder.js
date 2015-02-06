(function(window, document, undefined) {

	"use strict";

	var strPlaceholder = "placeholder",
		styleRules = strPlaceholder + "{position:absolute;cursor:text;color:gray;padding:0;border:0;overflow:hidden;-ms-user-select:none;user-select:none;pointer-events:none;}textarea{overflow: auto;}",
		attrName = "data-" + strPlaceholder + new Date().getTime() + Math.random(),
		strDOMAttrModified = "DOMAttrModified",
		root = document.documentElement,
		head = root.children[0],
		parseInt = window.parseInt,
		supportDOMAttrModified,
		placeholderCache = {},
		strNormal = "normal",
		strStatic = "static",
		strPx = "px",
		styleNode,
		getComputedStyle = window.getComputedStyle ? function(node) {
			return window.getComputedStyle(node, null);
		} : 0;

	// document.createElement  快捷方式
	function createElement(tagName) {
		return document.createElement(tagName);
	}

	//判断对象是否文本框
	function isTextbox(node) {
		return /^text(area)?|password|email|search|tel|url$/i.test(node.type);
	}

	//设置节点的holder
	function setPlaceholder(node, value) {
		if (node.uniqueID) {
			placeholderCache[node.uniqueID] = value;
		} else {
			node[attrName] = value;
		}
	}

	//获取节点的holder状态
	function getPlaceholder(node) {
		var value;
		if (node.uniqueID) {
			value = placeholderCache[node.uniqueID];
			placeholderCache[node.uniqueID] = value || true;
		} else {
			value = node[attrName];
			node[attrName] = value || true;
		}
		return value;
	}

	//获取node的style对象，优先使用runtimeStyle
	function runtimeStyle(node) {
		return node.runtimeStyle || node.style;
	}

	//获取node的计算样式，兼容IE，非IE
	function currentStyle(node) {
		return node.currentStyle || getComputedStyle(node);
	}

	function forEach(array, fn) {
		if (array) {
			[].slice.call(array, 0).forEach(fn);
		}
	}

	function addEventListener(node, type, listener, useCapture) {
		node.addEventListener(type, listener, !!useCapture);
	}

	/**
	 * @method placeholder
	 * @param {HTMLInputElement | HTMLTextAreaElement} node 需要修正placeholder的DOM元素
	 * @description 修正或更新文本框的placeholder功能 默认只在低端浏览器下使用
	 */

	//为input建立模拟的placeholder
	function createHolder(input) {
		var currStyle = currentStyle(input),
			holder = getPlaceholder(input),
			timer,
			on = function(eType, fn, node) {
				addEventListener(node || input, eType, fn, true);
			},
			//更新placeholder文本
			setText = function() {
				//读取placeholder
				var text = input[strPlaceholder];
				//如果placeholder属性不为空而node还没有建立
				if ((!holder || !holder.tagName) && text) {
					//建立一个node
					holder = createElement(strPlaceholder);
					holder.onmousedown = function() {
						//鼠标点holder时文本框获得焦点
						setTimeout(function() {
							input.focus();
						}, 1);
						return false;
					};
					setPlaceholder(input, holder);
				}
				//如果有node，更新其内容为placeholder属性值
				if (holder && holder.tagName) {
					holder.innerHTML = text || "";
				}
			},
			//控制node的样式
			setDisplay = function() {
				clearTimeout(timer);
				if (holder && holder.tagName) {
					var show = holder.innerHTML && !input.value && isTextbox(input),
						style = runtimeStyle(holder),
						parent = input.parentNode,
						disp = parent && (input.offsetHeight || input.offsetWidth);
					style.display = show && disp ? "block" : "none";

					//如果文本框可见时
					if (!disp) {
						//文本框不可见时延迟运行setDisplay
						timer = setTimeout(setDisplay, 50);
					} else if (show) {
						timer = setTimeout(function() {
							if (currStyle.position === strStatic && currentStyle(parent).position === strStatic) {
								runtimeStyle(input).position = "relative";
							}
							if (parent === input.offsetParent && !document.querySelector && /^normal$/i.test(currentStyle(parent).zoom)) {
								runtimeStyle(parent).zoom = 1;
							}
							//如果文本框或其父元素定位不为static，则自动计算placeholder的位置
							style.maxWidth = getComputedStyle && !/^auto$/.test(currStyle.width) ? currStyle.width : (input.clientWidth - parseInt(currStyle.paddingLeft) - parseInt(currStyle.paddingRight)) + strPx;
							style.width = "XMLHttpRequest" in window && currStyle.textAlign === "left" ? "auto" : style.maxWidth;
							style.left = (input.offsetLeft + input.clientLeft) + strPx;
							style.top = (input.offsetTop + input.clientTop) + strPx;
							currCss("marginLeft", "paddingLeft");
							currCss("marginTop", "paddingTop");

							if (/^input$/i.test(input.tagName)) {
								style.whiteSpace = "nowrap";
								style.wordBreak = strNormal;
								if (getComputedStyle) {
									style.lineHeight = getComputedStyle(input).height;
								} else {
									currCss("lineHeight");
								}
							} else {
								style.whiteSpace = strNormal;
								style.wordBreak = "break-all";
								//style.wordWrap = "break-word";
								currCss("lineHeight");
							}

							currCss("textAlign");
							currCss("textIndent");
							currCss("fontFamily");
							//currCss("fontWidth");
							currCss("fontSize");

							//将node插入文本框之后
							if (input.nextSibling) {
								parent.insertBefore(holder, input.nextSibling);
							} else {
								parent.appendChild(holder);
							}
						}, 0);

					}
				}
			},
			//样式继承，取文本框的样式赋值给placeholder
			currCss = function(name, attr) {
				try {
					runtimeStyle(holder)[name] = currentStyle(input)[attr || name];
				} catch (e) {}
			};

		if (!holder) {
			try {

				//高级浏览器下事件注册
				forEach(["input", "change", "keypress", strDOMAttrModified], function(eType) {
					on(eType, function() {
						setTimeout(function() {
							setText();
							setDisplay();
						}, 0);
					});
				});

				forEach(["resize", "scroll"], function(eType) {
					on(eType, setDisplay, window);
				});

			} catch (ex) {
				// IE下事件注册
				window.attachEvent("onresize", setDisplay);
				input.attachEvent("onpropertychange", function() {
					var propName = event.propName;
					setTimeout(function() {
						switch (propName) {
							//如placeholder属性发生改变，重置文案和样式
							case strPlaceholder:
								setText();
								//如value属性发生改变，重置重置样式
								/* falls through */
							default:
								setDisplay();
						}
					}, 0);
				});
			}
		} else if (supportDOMAttrModified) {
			return;
		}
		//初始化placeholder及其样式
		setText();
		setDisplay();
	}

	function init() {
		forEach(document.querySelectorAll("input,textarea"), createHolder);
	}
	if (window.opera) {
		// 老版本Opera 12.1 及以前版本不做任何处理，因为无解决方案
		return;
	} else if (!("placeholder" in createElement("input")) || document.documentMode || +navigator.userAgent.replace(/.*(?:\bA\w+WebKit)\/?(\d+).*/i, "$1") < 536) {
		// 老版本webkit浏览器、IE9+下兼容placeholder
		try {
			if (/interactive|complete/.test(document.readyState)) {
				init();
			} else {
				addEventListener(document, "DOMContentLoaded", init);
			}

			// 现代浏览器中使用定时器不断刷新页面上的placeholder效果
			setInterval(init, 200);

			// IE 10+、Safari中placeholder在文本框focus时则消失，这与其他浏览器有差异，用css干掉其原生的placeholder功能
			forEach([":-ms-input-", "::-webkit-input-"], function(prefix) {
				styleRules += prefix + strPlaceholder + "{color:transparent !important;}";
			});

			(function() {
				var id = root.id;

				function fn() {
					root.removeEventListener(strDOMAttrModified, fn, false);
					supportDOMAttrModified = true;
				}

				addEventListener(root, strDOMAttrModified, fn);
				root.id = "mass"; //更新属性
				root.id = id; //无论如何也还原它
			})();
		} catch (ex) {
			// IE6-8兼容placeholder，依赖jQuery
			(function(init) {
				var $ = window.$;
				if ($) {
					init($);
				} else {
					require.async(["jquery"], init);
				}
			})(function($) {
				$(function() {
					$("input,textarea").each(function() {
						createHolder(this);
					});
				});
			});
		}

		// 写样式表
		styleNode = createElement("style");
		head.insertBefore(styleNode, head.firstChild);
		if (styleNode.styleSheet) {
			styleNode.styleSheet.cssText = styleRules;
		} else {
			styleNode.textContent = styleRules;
		}

		try {
			module.exports = createHolder;
		} catch (e) {
			window[strPlaceholder] = createHolder;
		}

	} else {
		// 完美支持Placeholder效果的浏览器，检查需要前缀的，自动添加前缀
		try {
			document.querySelector("::placeholder");
		} catch (ex) {
			strPlaceholder = "::-" + (window.netscape ? "moz" : "webkit-input") + "-$1";
			require.async(["stylefix"], function(StyleFix) {
				StyleFix.register(function(css, raw) {
					if (raw) {
						return css.replace(/::(placeholder)\b/g, strPlaceholder);
					}
				});
			});
		}
	}

})(this, document);