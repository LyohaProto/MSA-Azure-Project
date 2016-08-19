// Include gulp
var gulp = require('gulp');

// Include Our Plugins
var jshint = require('gulp-jshint');
var concatCss = require('gulp-concat-css');
var minifyCss = require('gulp-minify-css');
//var uncss = require('gulp-uncss');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var livereload = require('gulp-livereload');
var connect = require('gulp-connect');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');

// HTML
gulp.task('html', function() {
    gulp.src('./src/*.html')
        .pipe(gulp.dest('./dist/'))
        .pipe(connect.reload());
});

// Compile Our Sass
gulp.task('sass', function() {
    return gulp.src('./src/scss/*.scss')
        .pipe(sass())
        .pipe(gulp.dest('dist/css'))
        .pipe(connect.reload());
});

// Minify and optimize CSS
gulp.task('css', function() {
    gulp.src([
     './node_modules/bootstrap/dist/css/bootstrap.css',
     './node_modules/jquery-easy-loading/dist/jquery.loading.css',
     './node_modules/jssocials/dist/jssocials.css',
     './node_modules/jssocials/dist/jssocials-theme-plain.css',
     './src/css/*.css'])
        .pipe(concatCss("style.min.css"))
        .pipe(minifyCss({ compatibility: 'ie8' }))
   //     .pipe(uncss({
   //         html: ['./dist/**/*.html']
   //     }))
        .pipe(gulp.dest('./dist/css'))
        .pipe(connect.reload());
});

// Fonts
gulp.task('fonts', function() {
    gulp.src('./node_modules/bootstrap/dist/fonts/*')
        .pipe(gulp.dest('./dist/fonts/'))
        .pipe(connect.reload());
});

// Lint Task
gulp.task('lint', function() {
    return gulp.src('./src/js/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(connect.reload());
});

// Concatenate & Minify JS
gulp.task('scripts', function() {
    return gulp.src([
        './node_modules/jquery/dist/jquery.js',
        './node_modules/bootstrap/dist/js/bootstrap.js',
        './node_modules/jquery-easy-loading/dist/jquery.loading.js',
        './node_modules/jssocials/dist/jssocials.js',
        './src/js/*.js',])
        .pipe(concat('all.js'))
        .pipe(gulp.dest('dist'))
        .pipe(rename('all.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'))
        .pipe(connect.reload());
});

// Minimize images
gulp.task('img', function() {
    gulp.src('./src/img/*')
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{ removeViewBox: false }],
            use: [pngquant()]
        }))
        .pipe(gulp.dest('./dist/img/'))
        .pipe(connect.reload());
});

// Connect
gulp.task('connect', function() {
    connect.server({
        root: 'dist',
        livereload: true
    });
});

// Watch Files For Changes
gulp.task('watch', function() {
    gulp.watch('./src/*.html', ['html']);
    gulp.watch('./src/css/*.css', ['css']);
    gulp.watch('./src/js/*.js', ['lint', 'scripts']);
    gulp.watch('./src/scss/*.scss', ['sass']);
});

// Default Task
gulp.task('default', [/*'lint',*/ 'html', 'sass', 'css', 'scripts', 'img', 'fonts', 'connect', 'watch']);