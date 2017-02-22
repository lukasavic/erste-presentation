import gulp from 'gulp';
import sass from 'gulp-sass';
import moduleImporter from 'sass-module-importer';
import sourcemaps from 'gulp-sourcemaps';
import autoprefixer from 'gulp-autoprefixer';
import svgstore from 'gulp-svgstore';
import cheerio from 'gulp-cheerio';
import rename from 'gulp-rename';
import webpack from 'webpack';
import gulpWebpack from 'webpack-stream';
var named = require('vinyl-named');
import webpackConfig from './.config/webpack';
import path from 'path';
import plumber from 'gulp-plumber';
import environments from 'gulp-environments';
import cleanCSS from  'gulp-clean-css';

const autoprefixerOptions = {
  browsers: ['last 10 versions']
};
const PATHS = {
    src: 'assets/'
}
const appData =  require('./.config/config.env.json');

let development = environments.development;
let production = environments.production;

// Scss styles
gulp.task('sass', function () {
  return gulp.src( PATHS.src + 'scss/**/*.scss')
    .pipe(development(sourcemaps.init()))
    .pipe(sass({ importer: moduleImporter() }).on('error', sass.logError))
    .pipe(production(cleanCSS()))
    .pipe(autoprefixer(autoprefixerOptions))
    .pipe(development(sourcemaps.write()))
    .pipe(gulp.dest( PATHS.src + 'css'));
});


// SVG Sprites
gulp.task('svgstore', function () {
    return gulp.src( PATHS.src + 'svg/*.svg', {base: 'sprite'})
        .pipe(cheerio({
            run: function($) {
                $('[fill]').removeAttr('fill');
            },
            parserOptions: { xmlMode: true }
        }))
        .pipe(svgstore({ inlineSvg: true }))
        .pipe(gulp.dest( PATHS.src +'img/svg/' ));
});


// ES6 JS Via Webpack
gulp.task('js', function() {
  return gulp.src([ PATHS.src + 'js/main.js', PATHS.src + 'js/mobile.js' ])
    .pipe(plumber())
    .pipe(named())
    .pipe(gulpWebpack(webpackConfig, webpack))
    .pipe(gulp.dest( PATHS.src + 'js/' ));
});


// Rerun the task when a file changes
gulp.task('watch', function() {
    gulp.watch(PATHS.src + 'scss/**/*.scss', ['sass'] );
});

// start tasks
gulp.task('default', ['watch', 'js', 'svgstore', 'sass']); // dev
gulp.task('build', ['sass', 'js', 'svgstore']); // production
