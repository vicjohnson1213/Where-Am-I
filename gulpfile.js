var gulp        = require('gulp');
var browserify  = require('browserify');
var babelify    = require('babelify');
var esmify      = require('esmify');
var source      = require('vinyl-source-stream');
var sass        = require('gulp-sass');

function build() {
    return browserify({
        entries: './app/main.js',
        plugin: [esmify],
        transform: [babelify.configure({ presets: ['@babel/preset-env'] })]
    })
        .bundle()
        .pipe(source('bundle.js'))
        .pipe(gulp.dest('dist'));
}

function css() {
    return gulp.src('./app/styles.scss')
        .pipe(sass())
        .pipe(gulp.dest('dist'));
}

function copy() {
    return gulp.src('./app/*.html')
        .pipe(gulp.dest('dist'));
}

function watch() {
    gulp.watch('./app/*', gulp.parallel(build, css, copy));
}

exports.default = gulp.parallel(build, css, copy);
exports.watch = watch;
exports.css = css;
exports.copy = copy;