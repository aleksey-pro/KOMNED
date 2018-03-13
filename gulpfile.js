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
    baseDir: 'docs'
  },
  tunnel: false,
  host: 'localhost',
  port: 3000,
  logPrefix: "Webxieter docs.",
  browser: "chrome"
};

gulp.task ('browserSync', function(){
  browserSync(config)
});

gulp.task('images', function() {
	return gulp.src('dev/images/**/*.*')
  .pipe(imagemin(imagemin.jpegtran(
    {progressive: true}),
    {verbose: true}))
	.pipe(gulp.dest('docs/img'))
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
	spriteData.img.pipe(gulp.dest('docs/img/'));
	spriteData.css.pipe(gulp.dest('dev/styles/'));
});


gulp.task('fonts', function() {
	return gulp.src('dev/fonts/**/*')
	.pipe(gulp.dest('docs/fonts'))
});


gulp.task('html', function() {
  return gulp.src(['dev/templates/index.pug', 'dev/templates/projects/*.pug'])
    .pipe(pug({
      pretty: true
    }))
    .on('error', notify.onError(function(error) {
      return {
        title: 'Pug',
        message:  error.message
      }
     }))
    .pipe(gulpif(argv.docsuction, htmlmin({collapseWhitespace: true, removeComments: true})))
    .pipe(gulp.dest('docs/'))
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
    .pipe(gulpif(argv.docsuction, minifyCSS()))
    .pipe(gulpif(argv.docsuction, rename({suffix: '.min'})))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('docs/css/'))
    .pipe(browserSync.reload({stream: true}))
});


gulp.task('scripts', function(){
  return gulp.src([    
    './node_modules/jquery/dist/jquery.min.js',
    './node_modules/imagesloaded/imagesloaded.pkgd.min.js',
    './node_modules/masonry-layout/dist/masonry.pkgd.min.js',    
    'dev/js/logo.js', 
    'dev/js/mainpage.js', 
    'dev/js/projects.js'
  ]) 
  .pipe(gulp.dest('docs/js')) 
  .pipe(browserSync.reload({stream: true}));
});

gulp.task('vendorsJS', function(){
  return gulp.src([
    './node_modules/three/build/three.min.js',  
    './node_modules/image-map/image-map.min.js',     
    'dev/js/libs/ColladaLoader.js',
    'dev/js/libs/Detector.js',
    'dev/js/libs/OrbitControls.js',
    'dev/js/libs/stats.min.js'
  ]) 
  .pipe(sourcemaps.init())
  .pipe(concat('libs.js'))
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest('docs/js')); 
});

gulp.task('lint-css', function () {
  return gulp.src('dev/**/*.scss')
    .pipe(gulpStylelint({
      reporters: [
        {formatter: 'string', console: true}
      ]
    }));
});

autoFixTask('fix-js', ['dev/js/maipage.js', 'dev/js/projects.js']);

gulp.task ('watch', function(){
	gulp.watch('dev/templates/**/*.pug', ['html']);
	gulp.watch('dev/styles/**/*.scss', ['style']);
	gulp.watch('dev/js/*.js', ['scripts']);
});

gulp.task ('default', ['html', 'vendorsJS', 'scripts', 'style', 'browserSync', 'watch', 'fix-js']);
gulp.task ('build', ['html', 'vendorsJS', 'scripts', 'fonts', 'style']); // , 'sprite', 'images'
gulp.task('del', function() {return del.sync('docs'); });