/**
 * Created by balank on 1/03/2017.
 */
var path = require('path');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var extractCSS =  new ExtractTextPlugin('styles.css');

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
                test: /\.js/,
                use: ['babel-loader']
            },
            /*{
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },*/
            {
                test: /\.css$/,
                use: extractCSS.extract('css-loader')
            }
        ]
    },
    plugins: [
        extractCSS
    ]
};