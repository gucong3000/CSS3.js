(function(f){typeof define==="function"?define("units",f):f()})(function(require,exports,module){"use strict";
(function(window) {
	var StyleFix = window.StyleFix || require("StyleFix"),
		getComputedStyle = window.getComputedStyle,
		addEventListener = window.addEventListener,
		document = window.document,
		root = document.documentElement,
		regLength = /^([\d\.]+)(\w+)$/,
		screen = window.screen,
		Math = window.Math,
		dpi = 96,
		absUnits = {
			cm: 2.54,
			mm: 25.4,
			q: 101.6,
			pt: 72,
			pc: 6,
			"in": 1
		},
		remUnits = {
			"%": 0.12,
			em: 12,
			ch: 6,
			ex: 5.4376
		},
		relUnits = {
			px: 1
		},
		self = {
			parse: parse
		},
		support = {
			q: 0,
			cm: 0,
			mm: 0,
			pt: 0,
			pc: 0,
			vh: 0,
			vw: 0,
			rem: 0,
			vmax: 0,
			vmin: 0,
			"in": 0
		},
		tester,
		rem,
		vh,
		vw;


	// 计算rem、vw、vh等相对长度单位所需各种变量
	function resize() {
		// 获取html元素的font-size
		rem = (getComputedStyle ? getComputedStyle(root, null) : root.currentStyle).fontSize.match(regLength);
		if (rem && remUnits[rem[2]]) {
			rem[1] *= remUnits[rem[2]];
			rem[2] = "pt";
		}
		// 计算显示器dpi值
		var innerHeight = window.innerHeight || root.clientHeight,
			innerWidth = window.innerWidth || root.clientWidth,
			logicalXDPI = screen.logicalXDPI,
			ratio = window.devicePixelRatio || (screen.deviceXDPI / logicalXDPI) || 1;

		dpi = logicalXDPI || (ratio * 96);

		// 计算每单位的vw、vh、vmax、vmin换算像素值
		vh = innerHeight / 100;
		vw = innerWidth / 100;
		relUnits.vmax = Math.max(vh, vw);
		relUnits.vmin = Math.min(vh, vw);
		relUnits.vh = vh;
		relUnits.vw = vw;

		// 对外暴漏供调用的数据
		self.ratio = ratio;
		self.dpi = dpi;
		self.innerHeight = innerHeight;
		self.innerWidth = innerWidth;

	}

	// 数字精确到小数点后四位，再往后四舍五入
	function toFixed(num) {
		return parseFloat((num).toFixed(4));
	}

	// 将浏览器不支持的长度单位转换为等效的px单位的长度
	function parse(strValue) {
		var newValue = strValue.match(/^([\d\.]+)(\w+)$/);
		var value = newValue[1],
			unit = newValue[2];

		// 如果是浏览器已支持的长度单位，则返回undefined
		if (/^px$/i.test(unit) || support[unit]) {
			return;
			// 如果单位是rem,则用html标签的字体大小换算
		} else if (rem && /^rem$/i.test(unit)) {
			value *= rem[1];
			unit = rem[2];
		}

		// 如果是绝对长度单位，根据dpi换算
		if (newValue = absUnits[unit]) {
			return toFixed(value * dpi / newValue);
			// 如果是相对长度单位，则换算为像素
		} else if (newValue = relUnits[unit]) {
			return toFixed(value * newValue);
		}
	}

	// 找出大字符串中的css长度单位，替换浏览器不支持的长度单位为px，原始值用注释方式存起来“ 192px /* RawVal`10vw` */”
	function cssUnits(css) {
		return css.replace(
			// 先将保存在注释中的原始值还原
			/\b[\d\.]+px\s*\/\*\s*RawVal`(.*)`\s*\*\//g,
			"$1"
		).replace(
			// 将浏览器不识别的长度单位长度单位转化为px，原始值存进注释
			/\b[\d\.]+\w+\b/g,
			function(rawValue) {
				var newValue = parse(rawValue);
				return newValue ? newValue + "px /* RawVal`" + rawValue + "` */" : rawValue;
			}
		);
	}

	// 按优先执行的原则绑定事件
	function addEvent(eventName, eventHandler) {
		if (addEventListener) {
			addEventListener(eventName, eventHandler, true);
		} else {
			// IE的attachEvent方式绑定的事件，绑定越晚，执行越早
			StyleFix.ready(function() {
				setTimeout(function() {
					window.attachEvent("on" + eventName, eventHandler);
				}, 250);
			});
			// 对外暴漏的self.parse方法，添加resize()，以防未按正确的viewport计算相对长度单位
			self.parse = function(val) {
				resize();
				return parse(val);
			};
		}
	}

	resize();
	addEvent("resize", function() {
		resize();
		StyleFix.process();
	});

	StyleFix.ready(function() {

		// 检查浏览器不兼容的长度单位
		tester = document.createElement("div");
		(document.body || root).appendChild(tester);
		for (var i in support) {
			var testVal = 0xffff + i,
				style = tester.style,
				currVal;
			style.top = 0;
			try {
				// 浏览器赋值正常，且计算样式结果误差小于15，则算作支持
				style.top = testVal;
				currVal = style.pixelTop || parseFloat(getComputedStyle(tester, null).top);
				support[i] = Math.abs(parse(testVal) - currVal) < 0xf;
			} catch (ex) {
				// 浏览器赋值时报错则直接判定为不支持此种单位
				support[i] = false;
			}
		}
		tester.parentNode.removeChild(tester);
	});
	StyleFix.register(cssUnits);

	try {
		module.exports = self;
	} catch (e) {
		window.units = self;
	}
})(window);});