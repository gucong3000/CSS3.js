(function(f){typeof define==="function"?define("cssprops",f):f()})(function(require,exports,module){"use strict";!function(e){function i(i){var t=i.uniqueID;if(!n[t])try{(e.PIE||require("PIE")).attach(i),n[t]=!0}catch(s){}}var t=e.stylefix||require("stylefix"),s=t.ieVersion,r=9>s?["border-radius","box-shadow"]:[],o={},n={},a={},p=[];11>s&&(r.push("border-image"),10>s&&(p.push([/^(background(-\w+)?\s*:\s*(\w+-)+gradient\s*\([^;\}]+)/i,"-pie-$1;"]),r.push("-pie-background"),9===s?(p.push([/^(transform(-\w+)?\s*:[^;\}]+)/i,"-ms-$1;"]),p.push([/^filter\s*:\s*([^;\}]+)/i,function(e,i){return i=i.split(/\s+(?=\w+\s*[\(\:])/).filter(function(e){return!/^(progid\s*\:\s*DXImageTransform\.Microsoft\.)?(Alpha|Matrix|Gradient|FlipH|FlipV)\s*\(/i.test(e)}).join(" ").trim(),i?"filter: "+i:""}])):8>s&&(p.push([/^(display\s*:\s*inline)-block\b/i,"$1;zoom:1"]),7>s&&(p.push([/^(position)\s*:\s*(\w+)([\};]|$)/i,'$1:expression(seajs.require("cssprops")(this,"$1","$2"))$3']),p.push([/^(left|top|right|bottom)\s*:\s*([\d\.+]*\w*)([\};]|$)/i,'$1:expression(seajs.require("cssprops")(this,"$1","$2"))$3']),r.push("-pie-png-fix")))),r=new RegExp("([^{}]+){[^{}]+("+r.join("|")+")","g"),t.register(function(e,t,s){p.length&&(e=e.replace(/\b[\w\-]+\s*:[^\{\};]+([\};]|$)/g,function(e){return p.forEach(function(i){e=e.replace(i[0],i[1])}),e}));var o=e.match(r);return o&&(t?o.forEach(function(e){a[e.replace(/^\s+/,"").replace(/\s*{[\s\S]*$/,"").replace(/[\s\t\r\n]+/g," ")]=i}):i(s)),e}),t.ready(function(){setInterval(function(){for(var e in a)t.query(e).forEach(a[e])},250)})),module.exports=function(e,i,t){var s,r=e.uniqueID,n=o[r];if(i=i.toLowerCase(),t=t.toLowerCase(),n||(o[r]=n={}),"position"===i&&"fixed"===t){var a=parseInt(n.left),p=parseInt(n.top),u=parseInt(n.right),f=parseInt(n.bottom),c=document.documentElement;n.fixedleft=isNaN(a)?isNaN(u)?n.left:c.scrollLeft+c.clientWidth-e.offsetHeight-u:c.scrollLeft+a,n.fixedright="auto",n.fixedtop=isNaN(p)?isNaN(f)?n.top:c.scrollTop+c.clientHeight-e.offsetHeight-u:c.scrollTop+p,n.fixedbottom="auto",s="absolute"}else"fixed"===n.position&&(s=n["fixed"+i]);return n[i]=t,s||t}}(window);});