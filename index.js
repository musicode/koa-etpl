/**
 * @file etpl 适配 koa
 * @author musicode
 */

var path = require('path');

var fs = require('co-fs');
var etpl = require('etpl');

/**
 * etpl 默认配置
 *
 * @inner
 * @type {Object}
 */
var defaultEngineConfig = {

    // 清除命令标签前后的空白字符
    strip: true,

    // target 或 master 名字冲突时的处理策略
    // 冲突必须报错，否则出了问题太难搞
    namingConflict: 'error'

};

/**
 * 遍历对象
 *
 * @inner
 * @param {Object} target
 * @param {Function} handler
 */
function each(target, handler) {
    for (var key in target) {
        if (target.hasOwnProperty(key)) {
            handler(target[key], key);
        }
    }
}

/**
 * 扩展对象
 *
 * @inner
 * @param {Object} target
 * @param {Object} source
 */
function extend(target, source) {
    each(source, function (value, key) {
        target[key] = value;
    });
}

/**
 *
 * @param {Application} app
 * @param {Object} options
 * @property {string} options.root 模板根目录，绝对路径
 * @property {string=} options.extname 模板文件扩展名，默认是 .html
 * @property {boolean=} options.cache 是否开缓存，默认开启
 * @property {Object=} options.engine 引擎配置
 * @property {Object=} options.filters 过滤函数
 * @return {Function}
 */
module.exports = function (app, options) {

    if (!options || !options.root) {
        throw new Error('[koa-etpl]options.root is required.');
    }

    // 引擎配置
    var engineConfig = { };
    extend(engineConfig, defaultEngineConfig);

    var engine = options.engine;
    if (engine) {
        extend(engineConfig, engine);
    }

    // 根据配置实例化
    var engineInstance = new etpl.Engine(engineConfig);

    // 添加过滤函数
    var filters = options.filters;
    if (filters) {
        each(filters, function (filter, name) {
            engineInstance.addFilter(name, filter);
        });
    }

    // 是否开启缓存
    var cache = typeof options.cache === 'boolean'
              ? options.cache
              : true;

    // 模板根目录
    var root = options.root;

    // 模板文件扩展名
    var extname = options.extname || '.html';

    // 编译缓存
    var compileCache = { };

    function* renderEtpl(viewPath, data) {

        viewPath = path.join(root, viewPath) + extname;

        var render;

        if (!cache || !compileCache[viewPath]) {

            var tpl = yield fs.readFile(viewPath, 'utf8');
            render = engineInstance.compile(tpl);

            if (cache && !compileCache[viewPath]) {
                compileCache[viewPath] = render;
            }

        }
        else {
            render = compileCache[viewPath];
        }

        return render(data);

    }

    app.context.render = function* (viewPath, viewData) {

        var renderData = { };

        if (this.state) {
            extend(renderData, this.state);
        }

        if (viewData) {
            extend(renderData, viewData);
        }

        var html = yield renderEtpl(viewPath, renderData);

        return html;

    };

};