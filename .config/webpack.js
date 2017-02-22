const path = require('path');
const merge = require('webpack-merge');
const webpack = require('webpack');

let config;
let common = {
    debug: true,
    output: {
        filename: "[name].bundle.js",
    },
    resolve: {
        root: path.resolve(__dirname, '..', 'assets'),
        extensions: ['', '.js'],
        alias: {
             'vue$': '../../node_modules/vue/dist/vue.common.js'
        }
    },
    module: {
      loaders: [
        {
            test: /\.json$/,
            loader: "json-loader",
            exclude: /(node_modules|bower_components)/,
        },
        {
            test: /\.js$/,
            exclude: /(node_modules|bower_components)/,
            include: path.resolve(__dirname, '..', 'assets'),
            loader: 'babel', // 'babel-loader' is also a legal name to reference
            query: {
                cacheDirectory: true,
                presets: ['es2015']
            }
        }
      ]
    },
    plugins: [
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery'
        })
    ]
};

switch( process.env.npm_lifecycle_event ) {
    case 'build':
        config = merge(
            common,
            {
                devtool: 'source-map'
            },
            {
                module: {
                    loaders: [
                        {
                            test: /\.js$/,
                            loader: "webpack-strip?strip[]=console.log",
                            exclude: /(node_modules|bower_components)/
                        }
                    ]
                },
                plugins: [
                    new webpack.optimize.UglifyJsPlugin({
                	  compress: { warnings: true },
                	  output: { comments: false }
                	})
                ]
            },
        );
        break;
    default:
        config = merge(
            common,
            {
                watch: true,
                devtool: 'eval-source-map'
            }
        );
}

export default config;
