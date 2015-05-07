CSS3.js
=======

CSS3 polyfill

## css属性兼容

- IE下兼容圆角，阴影、渐变。基于[PIE](http://css3pie.com/)
- IE9下自动屏蔽 与css3冲突的滤镜(Alpha|Matrix|Gradient|FlipH|FlipV)
- IE9下transform属性免前缀
- IE6、7下兼容 `display : inline-block;`
- 

```javascript
	require("cssprops");
```

### IE6下兼容 `position: fixed;`

- 暂时只兼容left、top，right、bottom取值的单位为px的情形，其他单位的兼容正在开发中

```javascript
	require("cssprops");
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

## 媒体查询 Media Queries

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

> 基于[media-match](https://github.com/weblinc/media-match)

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

