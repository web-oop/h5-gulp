//引入gulp和gulp插件
var gulp = require('gulp'),
    runSequence = require('run-sequence'),
    rev = require('gulp-rev'),
    revCollector = require('gulp-rev-collector'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    clean = require('gulp-clean'),
    watch = require('gulp-watch'),
    jshint = require('gulp-jshint'),
    replace = require('gulp-replace'),
    htmlmin = require('gulp-htmlmin'),
    cleanCSS = require('gulp-clean-css'),
    imageMin = require('gulp-imagemin'),
    connect = require('gulp-connect');

var open = require("open");

var configDev=require('./config/dev.env');
var configPro=require('./config/pro.env');



//定义css、js源文件路径
var cssSrc = 'src/css/*.css',
    jsSrc = 'src/js/*.js',
    imagesSrc= 'src/images/*.*',
    htmlSrc= 'src/*.html';



//监控文件变化
gulp.task('watch', function () {
    gulp.watch(htmlSrc, ['devHtml']);
    gulp.watch(jsSrc, ['changeDevJs']);
    gulp.watch(cssSrc,['devCss']);
});

gulp.task('connect', function() {
    connect.server({
        livereload: true,
        root:'distDev',
        port:'9081'
    })
});

gulp.task('openChrome',function(){
    open('http://localhost:9081','chrome');
});


//检查js语法
gulp.task('jslint', function() {
    return gulp.src(jsSrc)
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});





/*-----------下面是开发gulp环境配置----------*/


//清空目标文件
gulp.task('cleanDev', function () {
    return gulp.src(['distDev'], {read: false})
        .pipe(clean());
});

gulp.task('devCss', function(){
    return gulp.src(cssSrc)
        .pipe(gulp.dest('distDev/css')).pipe(connect.reload())
});

gulp.task('devJs', function(){
    return gulp.src(jsSrc)
        .pipe(gulp.dest('distDev/js')).pipe(connect.reload());
});

gulp.task('devHtml', function () {
    return gulp.src(htmlSrc)
        .pipe(gulp.dest('distDev')).pipe(connect.reload())
});


gulp.task('mvNotDealAssetDev', function () {
    return gulp.src(['src/**/*','!'+cssSrc, '!'+jsSrc,'!'+htmlSrc])
        .pipe(gulp.dest('distDev'));
});


gulp.task('changeDevJs',['devJs'],function(){
    return gulp.src(['distDev/js/*.js'])
        .pipe(replace('%baseUrl%',configDev.API_ROOT))
        .pipe(replace('%serveUrl%',configDev.WEB_URL))
        .pipe(replace('%imgUrl%',configDev.IMG_URL))
        .pipe(gulp.dest('distDev/js/'));
});





//开发构建
gulp.task('dev', function (done) {
    condition = false;
    runSequence(
        ['cleanDev'],
        ['changeDevJs'],
        ['devCss'],
        ['devHtml'],
        ['mvNotDealAssetDev'],
        ['watch'],
        ['connect'],
        ['openChrome'],
        done);
});

















/*-----------下面是测试gulp环境配置----------*/



//清空目标文件
gulp.task('cleanDst', function () {
    return gulp.src(['dist','rev'], {read: false})
        .pipe(clean());
});

//CSS生成文件hash编码并生成 rev-manifest.json文件名对照映射
gulp.task('revCss', function(){
    return gulp.src(cssSrc)
        .pipe(rev())
        // 压缩css
        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(gulp.dest('dist/css'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('rev/css'));
});

//js生成文件hash编码并生成 rev-manifest.json文件名对照映射
gulp.task('revJs', function(){

    return gulp.src(jsSrc)
        .pipe(rev())
        //压缩
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'))
        //生成rev-manifest.json
        .pipe(rev.manifest())
        .pipe(gulp.dest('rev/js'));
});

gulp.task('imagesDist',function(){
    gulp.src(imagesSrc)
        .pipe(imageMin({progressive: true}))
        .pipe(gulp.dest('dist/images'))
});

//Html替换css、js文件版本
gulp.task('revHtml', function () {
    var options = {
        removeComments: true,//清除HTML注释
        collapseWhitespace: true,//压缩HTML
        removeEmptyAttributes: true,//删除所有空格作属性值 <input id="" /> ==> <input />
        removeScriptTypeAttributes: true,//删除<script>的type="text/javascript"
        removeStyleLinkTypeAttributes: true,//删除<style>和<link>的type="text/css"
        minifyJS: true,//压缩页面JS
        minifyCSS: true//压缩页面CSS
    };
    return gulp.src(['rev/**/*.json', 'src/**/*.html'])
        .pipe(revCollector({
            replaceReved: true
        }))
        .pipe(htmlmin(options))
        .pipe(gulp.dest('dist'));
});

// 将非js、非css、非html文件 移动到目标目录
gulp.task('mvNotDealAsset', function () {
    return gulp.src(['src/**/*','!'+cssSrc, '!'+jsSrc,'!'+htmlSrc,'!'+imagesSrc])
        .pipe(gulp.dest('dist'));
});

gulp.task('changePro',function(){
    return gulp.src(['dist/js/*.js'])
        .pipe(replace('%baseUrl%',configPro.API_ROOT))
        .pipe(replace('%serveUrl%',configPro.WEB_URL))
        .pipe(replace('%imgUrl%',configPro.IMG_URL))
        .pipe(gulp.dest('dist/js/'));
});



//测试构建
gulp.task('build', function (done) {
    condition = false;
    runSequence(
        ['cleanDst'],
        ['revCss'],
        ['revJs'],
        ['revHtml'],
        ['imagesDist'],
        ['mvNotDealAsset'],
        ['changePro'],
        done);
});


