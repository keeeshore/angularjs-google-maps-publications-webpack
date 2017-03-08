/**
 * Created by balank on 1/03/2017.
 */
var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var extractCSS =  new ExtractTextPlugin('styles.css');
var uglifyJs = new webpack.optimize.UglifyJsPlugin({
    compress: {
        warnings: false,
        drop_console: false
    }
});

module.exports = {

    context: __dirname,

    entry: './js/main.js',

    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist/')
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: ['babel-loader']
            },
            {
                test: /\.scss$/,
                use: [{
                    loader: 'style-loader' // creates style nodes from JS strings
                }, {
                    loader: 'css-loader'// translates CSS into CommonJS
                }, {
                    loader: 'sass-loader' // compiles Sass to CSS
                }]
            }
        ]
    },
    plugins: [ extractCSS/*, uglifyJs */]
};


/* backuop
use: extractCSS.extract('css-loader')
*/
