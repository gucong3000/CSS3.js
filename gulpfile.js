"use strict";
var gulp = require("gulp"),
	msgErrs = {};

/**
 * 异常处理
 * @param  {Error} e 错误对象
 */

function errrHandler(e) {
	var msg = e.toString().replace(/\x1B\[\d+m/g, "");
	if (!msgErrs[msg]) {
		msgErrs[msg] = msg;
		console.error(JSON.stringify(e, 0, 4).trim() || msg);
	}
}

function compiler() {
	var wrapper = require("gulp-wrapper"),
		plumber = require("gulp-plumber"),
		jshint = require("gulp-jshint"),
		uglify = require("gulp-uglify");

	gulp.src(["./src/**/*.js"])
		.pipe(plumber(errrHandler))
		.pipe(jshint())
		.pipe(jshint.reporter("fail"))
		.pipe(jshint.reporter())
		.pipe(uglify({
			//保留IE的jscript条件注释
			preserveComments: function(o, info) {
				return /@(cc_on|if|else|end|_jscript(_\w+)?)\s/i.test(info.value);
			}
		}))
		.pipe(wrapper({
			header: function(file) {
				if (/\bcss3.js$/.test(file.path)) {
					return "";
				}
				return "(function(f){typeof define===\"function\"?define(\"" + file.path.match(/([^\/\\]+)(\.\w+)$/)[1] + "\",f):f()})(function(require,exports,module){";
			},
			footer: function(file) {
				if (/\bcss3.js$/.test(file.path)) {
					return "";
				}
				return "});";
			}
		}))
		.pipe(gulp.dest("./build/"));
}

gulp.task("default", function() {
	compiler();
	gulp.watch("./src/**/*.js", compiler);
});

/*
 * jsDoc任务
 */
gulp.task("doc", function() {
	var port = process.argv.indexOf("--port");
	port = port >= 0 ? parseInt(process.argv[port + 1]) : 8080;

	require("yuidocjs").Server.start({
		port: port,
		paths: ["./src"],
		quiet: true
	});
	require("opener")("http://localhost:" + port);
});