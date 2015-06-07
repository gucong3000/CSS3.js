CSS3.js
=======

CSS3 polyfill

此项目为IE6+、UC手机版或其他老旧浏览器带来各种CSS3属性的兼容

## css属性兼容

- IE下兼容圆角，阴影、渐变。基于[PIE](http://css3pie.com/)
- IE9下自动屏蔽 与css3冲突的滤镜(Alpha|Matrix|Gradient|FlipH|FlipV)
- IE9下transform属性免前缀
- IE6、7下兼容 `display : inline-block;`

```javascript
	require("cssprops");
```

### IE6下兼容 `position: fixed;`

- 暂时只兼容left、top，right、bottom取值的单位为px的情形，其他单位的兼容正在开发中

```javascript
	require("posfixed");
```

## css3 免私有前缀(`-webkit-`、`-moz-`等)

- css文件中免浏览器私有前缀
- js操作DOM对象中的样式，免浏览器私有前缀

```javascript
	require("prefixfree");
```

> 基于[prefixfree](http://leaverou.github.io/prefixfree/)

## 伪类和css3选择符兼容

- 为IE6-8下提供各种css选择符中的伪类选、伪对象、属性择器支持。基于[selectivizr](http://www.selectivizr.com/)

```javascript
	require("selectivizr");
```

## 媒体查询 @media

- 为IE提响应式媒体查询css语句的支持

```javascript
	require("matchmedia");
	if (window.matchMedia("(min-width:480px)").matches) {
		//view port至少480px宽度  
	} else {
		//view port比480px宽度小  
	}
	if (window.matchMedia("(max-msie:9)").matches) {
		//IE6-9
	} else {
		//其他浏览器  
	}
```

```CSS
	@media screen and (min-width: 960px) {
		body{ background: #999; }
	}
```

> 基于[media-match](https://github.com/weblinc/media-match)

## 兼容性查询 @supports

```javascript
	require("supports");
	CSS.supports("display", "flex");
```

```CSS
	@supports ( display: flexbox ) {
		#navigation,
		#content {
			display: flexbox;
		}
	}
```

上面的规则表示，当浏览器支持弹性盒子布局时，括号里的所有样式将会生效

基于[CSS.supports](https://github.com/termi/CSS.supports)

## url查询 @document

```javascript
	require("document");
```

```CSS
	@document url(http://www.w3.org/),
				url-prefix(http://www.w3.org/Style/),
				domain(mozilla.org),
				regexp("https:.*")
	{
		/* 该条CSS规则会应用在下面的网页:
		 + URL为"http://www.w3.org/"的页面.
		 + 任何URL以"http://www.w3.org/Style/"开头的网页
		 + 任何主机名为"mozilla.org"或者主机名以".mozilla.org"结尾的网页     
		 + 任何URL以"https:"开头的网页 */

		/* make the above-mentioned pages really ugly */
		body { color: purple; background: yellow; }
	}
```

[@document文档](https://developer.mozilla.org/zh-CN/docs/Web/CSS/@document)

## 长度单位兼容

- IE兼容vw、vh、vmax、vmin、rem等相对长度单位
- 移动端兼容绝对长度(忽略缩放)，如厘米(cm)、毫米(mm)、英寸(in)、点(pt)、派卡(pc)

```javascript
	require("cssunits");
```

## placeholder 文本框占位符

- 为低端浏览器提供placeholder功能，为老版本浏览器抹平差异

```javascript
	require("placeholder");
```

