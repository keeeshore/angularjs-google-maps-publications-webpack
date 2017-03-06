/**
 * Created by balank on 1/03/2017.
 */
var path = require('path');
var webpackConfig = require('./webpack.config.js');
//webpackConfig.entry = {};
/*var entry = path.resolve(webpackConfig.context, webpackConfig.entry);
console.log('entry ============', entry);
var preprocessors = {};
preprocessors[entry] = ['webpack'];
preprocessors['./js/main.spec.js'] = ['webpack'];*/

module.exports = function (config) {
    config.set({

        basePath: '',

        frameworks: ['jasmine'],

        reporters: ['progress'],

        browsers: ['Chrome'],

        logLevel: config.LOG_INFO,

        files: [
            './js/main.js',
            './node_modules/angular-mocks/angular-mocks.js',
            './js/main.spec.js'
        ],

        preprocessors: {
            './js/main.js': ['webpack'],
            './js/main.spec.js': ['webpack']
        },

        webpack: webpackConfig,

        webpackMiddleware: {
            noInfo: true
        }

    })
};