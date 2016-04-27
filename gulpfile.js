var gulp = require('gulp'),
    p = require('gulp-load-plugins')(),   
    bs = require('browser-sync').create(),
    min_png = require('imagemin-pngquant');
var base = {
    host_str: '_HOST_',
    host_url: 'http://192.168.1.182:5211',
    host_url_build: 'http://www.bramble.wang/helpful',
    src: './src',
    dev: './dev',
    build: './build',
};
var config = {
    server: base.dev,
    startPath: "/html/index.html",
    jade_src: base.src+'/**/*.jade',
    jade_src_not: base.src+'/html/_temp/**/*.jade',
    html_src: base.dev+'/**/*.html',
    less_src: base.src+'/**/*.less',
    less_src_not: base.src+'/css/_temp/**/*.less',
    to_map: '../maps',
    css_src: base.dev+'/**/*.css',
    img_src: base.dev+'/**/*.{png,jpg,gif,ico}',
    concat_base_src: [base.src+'/js/base/jquery.js',base.src+'/js/base/base.js',base.src+'/js/base/*.js'],
    concat_chart_src: [base.src+'/js/chart/echarts.js',base.src+'/js/chart/renderChart.js'],
    replace_src: [base.src+'/**/*.js',base.src+'/**/*.html',base.src+'/**/*.css','!'+base.src+'/js/{base,chart}/*.js'],
    uglify_src: base.dev+'/**/*.js',
    jshint_src: [base.src+'/js/**/*.js','!'+base.src+'/js/**/{jquery,echarts}.js'],
    copy_src: base.src+'/**/*.{json,png,jpg,gif,ico,eot,svg,ttf,woff,xml,html,css}',
    copy2build_src: base.dev+'/**/*.{json,eot,svg,ttf,woff,xml}',
    watch_reload_src: base.dev+'/**/*.{html,js,json,png,jpg,gif,ico,eot,svg,ttf,woff,xml}',
    del_dev_src: base.dev+"/*",
    del_build_src: [base.build+"/*",'!'+base.build+"/.git"],
};
// 编译jade为html
gulp.task('jade',function(){
    return gulp.src([config.jade_src,'!'+config.jade_src_not])
    .pipe(p.changed(base.dev, {extension: '.html'})) //todo: 写一个有依赖关系的p.changed插件 不然改公共页面时。。。
    .pipe(p.jade({pretty: '    '}))
    .pipe(p.replace(base.host_str,base.host_url))
    .pipe(gulp.dest(base.dev));
});
// 给html中的url设置MD5后缀以及压缩html
gulp.task('html',['jade'],function(){
    var opts = {
        removeComments: true,//清除HTML注释
        collapseWhitespace: true,//压缩HTML
        collapseBooleanAttributes: true,//省略布尔属性的值 <input checked="true"/> ==> <input />
        removeEmptyAttributes: true,//删除所有空格作属性值 <input id="" /> ==> <input />
        removeScriptTypeAttributes: true,//删除<script>的type="text/javascript"
        removeStyleLinkTypeAttributes: true,//删除<style>和<link>的type="text/css"
        minifyJS: true,//压缩页面JS
        minifyCSS: true//压缩页面CSS
    };
    return gulp.src(config.html_src)
    .pipe(p.revAppend())
    .pipe(p.htmlmin(opts))
    .pipe(p.replace(base.host_url,base.host_url_build))
    .pipe(gulp.dest(base.build));
});
// 编译less为css
gulp.task('less',function(){
    return gulp.src([config.less_src,'!'+config.less_src_not])
    // .pipe(p.changed('./dev/css', {extension: '.css'}))    todo: 写一个有依赖关系的p.changed插件
    .pipe(p.sourcemaps.init())
    .pipe(p.less())
    .pipe(p.replace(base.host_str,base.host_url))
    .pipe(p.sourcemaps.write(config.to_map))
    .pipe(gulp.dest(base.dev))
    .pipe(bs.stream());  //存在sourcemaps的时候且输出到非当前文件中时这里会变成刷新。todo: 待研究。
});
// 给css添加浏览器厂商前缀、css中的url添加MD5后缀、压缩css
gulp.task('css',['less'],function(){
    return gulp.src(config.css_src)
    .pipe(p.autoprefixer('last 2 version', 'safari 5', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
    .pipe(p.makeCssUrlVersion())
    .pipe(p.cleanCss({
        advanced: true,//类型：Boolean 默认：true [是否开启高级优化（合并选择器等）]
        compatibility: '*',//保留ie7及以下兼容写法 类型：String 默认：''or'*' [启用兼容模式； 'ie7'：IE7兼容模式，'ie8'：IE8兼容模式，'*'：IE9+兼容模式]
        keepBreaks: false//类型：Boolean 默认：false [是否保留换行]
    }))
    .pipe(p.replace(base.host_url,base.host_url_build))
    .pipe(gulp.dest(base.build));
});
// js代码拼接
gulp.task('concat_base',function(){
    return gulp.src(config.concat_base_src)
    .pipe(p.sourcemaps.init())
    .pipe(p.concat('base.js'))
    .pipe(p.replace(base.host_str,base.host_url))
    .pipe(p.sourcemaps.write(config.to_map))
    .pipe(gulp.dest(base.dev+'/js'));
});
gulp.task('concat_chart',function(){
    return gulp.src(config.concat_chart_src)
    .pipe(p.sourcemaps.init())
    .pipe(p.concat('chart.js'))
    .pipe(p.replace(base.host_str,base.host_url))
    .pipe(p.sourcemaps.write(config.to_map))
    .pipe(gulp.dest(base.dev+'/js'));
});
gulp.task('concat',['concat_base','concat_chart']);
// js replace
gulp.task('replace',function(){
    return gulp.src(config.replace_src)
    .pipe(p.changed(base.dev))
    .pipe(p.replace(base.host_str,base.host_url))
    .pipe(gulp.dest(base.dev));
});
// js代码语法规范解析
gulp.task('jshint',function(){
    return gulp.src(config.jshint_src)
    .pipe(p.jshint({
        // 更多配置见 http://jshint.com/docs/options/
        "bitwise": false,       //如果是true，则禁止使用位运算符
        "curly": false,         //如果是true，则要求在if/while的模块时使用TAB结构
        "debug": true,          // 如果是true，则允许使用debugger的语句
        "eqeqeq": false,        // 如果是true，则要求在所有的比较时使用===和!==
        "evil": true,           // 如果是true，则允许使用eval方法
        "forin": true,          // 如果是true，则不允许for in在没有hasOwnProperty时使用
        "maxerr": 3,           // 默认是50。 表示多少错误时，jsLint停止分析代码
        "newcap": true,         // 如果是true，则构造函数必须大写
        "nopram": false,        // 如果是true，则不允许使用arguments.caller和arguments.callee
        "nomen": false,         // 如果是true，则不允许在名称首部和尾部加下划线
        "onevar": false,        // 如果是true，则在一个函数中只能出现一次var
        "passfail": false,      // 如果是true，则在遇到第一个错误的时候就终止
        "plusplus": false,      // 如果是true，则不允许使用++或者--的操作
        "regexp": false,        // 如果是true，则正则中不允许使用.或者[^…]
        "undef": true,          // 如果是ture，则所有的局部变量必须先声明之后才能使用
        "sub": true,            // 如果是true，则允许使用各种写法获取属性(一般使用.来获取一个对象的属性值)
        "strict": true,         // 如果是true，则需要使用strict的用法，详见http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
        "white": false,         // 如果是true，则需要严格使用空格用法。
        "unused": true,         // 所有的变量必须都被使用
        "predef": [ "base","$" ]    // 这里的变量可以不用检测是否已经提前声明
    }))
    .pipe(p.jshint.reporter('default'));
});
// js代码压缩
gulp.task('uglify',['jshint','concat'],function(){
    return gulp.src(config.uglify_src)
    .pipe(p.uglify({
        //mangle: true,//类型：Boolean 默认：true 是否修改变量名
        mangle: {except: ['require' ,'exports' ,'module' ,'$']}//排除混淆关键字
    }))
    .pipe(p.replace(base.host_url,base.host_url_build))
    .pipe(gulp.dest(base.build));
});
// 图片压缩、png图的深度压缩
gulp.task('img',function(){
    return gulp.src(config.img_src)
    .pipe(p.cache(p.imagemin({
            optimizationLevel: 5, //类型：Number  默认：3  取值范围：0-7（优化等级）
            progressive: true, //类型：Boolean 默认：false 无损压缩jpg图片
            interlaced: false, //类型：Boolean 默认：false 隔行扫描gif进行渲染
            multipass: false, //类型：Boolean 默认：false 多次优化svg直到完全优化,
            svgoPlugins: [{removeViewBox: false}],//不要移除svg的viewbox属性
            use: [min_png()] //使用pngquant深度压缩png图片的imagemin插件
        })))
    .pipe(gulp.dest(base.build));
});
// 无需编译的代码 复制到dev
gulp.task('copy',['replace'],function(){
    return gulp.src(config.copy_src, { base: base.src })
    .pipe(p.changed(base.dev))
    .pipe(gulp.dest(base.dev));
});
gulp.task('copy2build',['copy'],function(){
    return gulp.src(config.copy2build_src, { base: base.dev })
    .pipe(gulp.dest(base.build));
});
//清空文件夹
gulp.task('del_dev',function(cb){
    return gulp.src(config.del_dev_src,{read: false})
    .pipe(p.clean());
});
gulp.task('del_build',function(cb){
    return gulp.src(config.del_build_src,{read: false})
    .pipe(p.clean());
});
// 监听
gulp.task('watch',function(){
    gulp.watch(config.less_src,['less']);
    gulp.watch(config.jade_src,['jade']);
    gulp.watch(config.concat_base_src,['concat_base']);
    gulp.watch(config.concat_chart_src,['concat_chart']);
    gulp.watch(config.copy_src,['copy']);
    gulp.watch(config.watch_reload_src).on('change',bs.reload);
});
// 默认启动任务
gulp.task('default',function(){
    p.sequence('del_dev',['less','jade','concat','copy'],'watch',function(){
        bs.init({
            server: config.server,
            port: 5211,
            open: "external",
            startPath: config.startPath
        });
    });
});
// 生成到生产环境
gulp.task('build',function(cb){
    p.sequence(['del_dev','del_build'],'copy2build','img',['uglify','css'],'html',cb);
});