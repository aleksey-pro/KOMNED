var gulp = require("gulp"),
	browserSync = require("browser-sync"),
	imagemin = require("gulp-imagemin"),
	concat = require("gulp-concat"),
	minifyCSS = require("gulp-clean-css"),
	uglify = require("gulp-uglify-es").default,
	gulpif = require("gulp-if"),
	notify = require("gulp-notify"),
	sourcemaps = require("gulp-sourcemaps"),
	spritesmith = require("gulp.spritesmith"),
	pug = require("gulp-pug"),
	sass = require("gulp-sass"),
	del = require("del"),
	autoprefixer = require("gulp-autoprefixer"),
	argv = require("yargs").argv,
	eslint = require("gulp-eslint"),
	autoFixTask = require("gulp-eslint-auto-fix"),
	// gulpStylelint = require('gulp-stylelint'),
	svgSprite = require("gulp-svg-sprite"),
	cheerio = require("gulp-cheerio"),
	svgmin = require("gulp-svgmin"),
	htmlmin = require("gulp-html-minifier");

var config = {
	server: {
		baseDir: "build"
	},
	tunnel: false,
	host: "localhost",
	port: 34567,
	logPrefix: "Webxieter docs.",
	browser: "chrome"
};

gulp.task("browserSync", function() {
	browserSync(config);
});

gulp.task("images", function() {
	return gulp
		.src("dev/images/*.*")
		.pipe(imagemin(imagemin.jpegtran({ progressive: true }), { verbose: true }))
		.pipe(gulp.dest("build/images"));
});

gulp.task("svg-sprite", function() {
	return gulp
		.src("dev/images/icons/*.svg")
		.pipe(
			svgmin({
				js2svg: {
					pretty: true
				}
			})
		)
		.pipe(
			cheerio({
				run: function($) {
					$("[fill]").removeAttr("fill");
					$("[stroke]").removeAttr("stroke");
					$("[style]").removeAttr("style");
				},
				parserOptions: { xmlMode: true }
			})
		)
		.pipe(
			svgSprite({
				mode: {
					symbol: {
						sprite: "../SVG.svg"
					}
				}
			})
		)
		.pipe(gulp.dest("build/images/"));
});

gulp.task("fonts", function() {
	return gulp.src("dev/fonts/**/*").pipe(gulp.dest("build/fonts"));
});

gulp.task("html", function() {
	return gulp
		.src("dev/templates/pages/*.pug")
		.pipe(
			pug({
				pretty: true
			})
		)
		.on(
			"error",
			notify.onError(function(error) {
				return {
					title: "Pug",
					message: error.message
				};
			})
		)
		.pipe(
			gulpif(
				argv.production,
				htmlmin({ collapseWhitespace: true, removeComments: true })
			)
		)
		.pipe(gulp.dest("build/"))
		.pipe(browserSync.reload({ stream: true }));
});

gulp.task("style", function() {
	return gulp
		.src("dev/styles/main.scss")
		.pipe(sourcemaps.init())
		.pipe(
			sass({
				outputStyle: "expanded", // compressed
				includePaths: ["dev/style/**/*.scss", ["node_modules"]]
			}).on("error", sass.logError)
		)
		.pipe(autoprefixer({ browsers: ["last 5 versions"] }))
		.pipe(gulpif(argv.production, minifyCSS({ specialComments: 0 })))
		.pipe(sourcemaps.write("."))
		.pipe(gulp.dest("build/css/"))
		.pipe(browserSync.reload({ stream: true }));
});

const libsSrc = [
	"./node_modules/jquery/dist/jquery.min.js",
	"./node_modules/svg4everybody/dist/svg4everybody.min.js",
	"./node_modules/bootstrap/dist/js/bootstrap.bundle.min.js",
	"./node_modules/swiper/dist/js/swiper.min.js",
	"dev/js/libs/svg-to-storage.js",
	"dev/js/libs/domshim.js"
];

gulp.task("libs", function() {
	return gulp
		.src(libsSrc)
		.pipe(concat("common.js"))
		.pipe(gulp.dest("build/js"));
});

gulp.task("scripts", function() {
	return gulp
		.src("dev/js/scripts.js")
		.pipe(sourcemaps.init())
		.pipe(gulpif(argv.production, uglify()))
		.pipe(sourcemaps.write("."))
		.pipe(gulp.dest("build/js"))
		.pipe(browserSync.reload({ stream: true }));
});

gulp.task("lint-css", function() {
	return gulp.src("dev/**/*.scss").pipe(
		gulpStylelint({
			reporters: [{ formatter: "string", console: true }]
		})
	);
});

autoFixTask("fix-js", ["dev/js /c ommon.js", "dev/js/scripts.js"]);

gulp.task("watch", function() {
	gulp.watch("dev/templates/**/*.pug", ["html"]);
	gulp.watch("dev/styles/**/*.scss", ["style"]);
	gulp.watch("dev/js/*.js", ["scripts", "fix-js"]);
});

gulp.task("start", [
	"html",
	"images",
	"svg-sprite",
	"libs",
	"scripts",
	"style",
	"browserSync",
	"watch"
]);
gulp.task("build", ["html", "images", "libs", "scripts", "style"]); // , 'sprite', 'images', 'fonts'
gulp.task("del", function() {
	return del.sync("build");
});
