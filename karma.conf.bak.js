/**
 * Created by balank on 1/03/2017.
 */
/*var path = require('path');
var webpackConfig = require('./webpack.config');
var entry = path.resolve(webpackConfig.context, webpackConfig.entry);
var preprocessors = {};
preprocessors[entry] = ['webpack'];*/

module.exports = function (config) {
    config.set({
        frameworks: ['jasmine'],
        browsers: [],

        files: [
            './node_modules/angular/angular.js',
            './node_modules/angular-mocks/angular-mocks.js',
            './js/main.js',
            './js/main.spec.js'
        ]
    })
}