var gulp = require('gulp'),
	browserSync  = require('browser-sync'),
	imagemin = require('gulp-imagemin'),	
	concat = require('gulp-concat'),
	minifyCSS = require('gulp-clean-css'),
	uglify  = require('gulp-uglify'),
	gulpif = require('gulp-if'),	
	notify = require("gulp-notify"),
	rename = require("gulp-rename"),	
	sourcemaps = require('gulp-sourcemaps'),
	spritesmith = require('gulp.spritesmith'),
  pug = require('gulp-pug'),
  sass = require('gulp-sass'),
  del  = require('del'),
  autoprefixer = require('gulp-autoprefixer'),
	argv = require('yargs').argv, 
  eslint = require('gulp-eslint'),
  autoFixTask = require('gulp-eslint-auto-fix'),
  gulpStylelint = require('gulp-stylelint'),
  htmlmin = require('gulp-html-minifier');
  // path = require('path'),
  // plumber = require("gulp-plumber"),


var config = {
  server: {
    baseDir: 'prod'
  },
  tunnel: false,
  host: 'localhost',
  port: 3000,
  logPrefix: "Webxieter prod.",
  browser: "chrome"
};

gulp.task ('browserSync', function(){
  browserSync(config)
});

gulp.task('images', function() {
	return gulp.src('dev/images/*.*')
  .pipe(imagemin())
	.pipe(gulp.dest('prod/img'))
});


gulp.task('sprite', function() {
	var spriteData =
		gulp.src('dev/images/sprite/*.png')
			.pipe(spritesmith({
				imgName: 'sprite.png',
				cssName: 'sprite.scss',
        cssFormat: 'css'
        // ,
        // imgPath: '../img/'
			}));
	spriteData.img.pipe(gulp.dest('prod/img/'));
	spriteData.css.pipe(gulp.dest('dev/styles/'));
});


gulp.task('fonts', function() {
	return gulp.src('dev/fonts/**/*')
	.pipe(gulp.dest('prod/fonts'))
});


gulp.task('html', function() {
  return gulp.src('dev/templates/index.pug')
    .pipe(pug({
      pretty: true
    }))
    .on('error', notify.onError(function(error) {
      return {
        title: 'Pug',
        message:  error.message
      }
     }))
    .pipe(gulpif(argv.production, htmlmin({collapseWhitespace: true, removeComments: true})))
    .pipe(gulp.dest('prod/'))
    .pipe(browserSync.reload({stream: true}))
});

gulp.task('style', function() {
  return gulp.src('dev/styles/main.scss')
    .pipe(sourcemaps.init())
    .pipe(sass({
        outputStyle: 'expanded', //compressed
        includePaths: [
          'dev/style/**/*.scss',
          ['node_modules']
        ]
      }).on('error', sass.logError))
    .pipe(autoprefixer({browsers: ['last 5 versions']}))
    .pipe(gulpif(argv.production, minifyCSS()))
    .pipe(gulpif(argv.production, rename({suffix: '.min'})))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('prod/css/'))
    .pipe(browserSync.reload({stream: true}))
});


gulp.task('vendorsJS', function(){
  return gulp.src(['./node_modules/bootstrap/dist/js/bootstrap.min.js', './node_modules/jquery/dist/jquery.min.js']) 
    .pipe(gulp.dest('prod/js')); 
});

gulp.task('js', function() {
  return gulp.src('dev/js/*.js')
    .pipe(sourcemaps.init())
    // .pipe(filter('**/*.js'))
    .pipe(concat('custom.js'))
    .pipe(gulpif(argv.production, uglify()))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('prod/js'))
    .pipe(browserSync.reload({stream: true}))
});

gulp.task('lint-css', function () {
  return gulp.src('dev/**/*.scss')
    .pipe(gulpStylelint({
      reporters: [
        {formatter: 'string', console: true}
      ]
    }));
});

autoFixTask('fix-js', ['dev/js/*.js']);

gulp.task ('watch', function(){
	gulp.watch('dev/templates/**/*.pug', ['html']);
	gulp.watch('dev/styles/**/*.scss', ['style']);
	gulp.watch('dev/js/*.js', ['js']);
});

gulp.task ('default', ['html', 'vendorsJS', 'js', 'style', 'js.lint', 'browserSync', 'watch', 'fix-js']);
gulp.task ('build', ['html', 'vendorsJS', 'js', 'images', 'sprite', 'fonts', 'style']);
gulp.task('del', function() {return del.sync('prod'); });