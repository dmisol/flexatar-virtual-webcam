const path = require('path');

module.exports = {
 
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  // mode: 'development',
  resolve:{
    fallback: {"fs": false,"path":  require.resolve("path-browserify")}
  },
  mode: 'production',
  module: {
    rules: [
        {
            test: /\.js$/,  // Apply Babel to JavaScript files
            exclude: /node_modules/,
            use: {
                loader: "babel-loader",
                options: {
                    presets: ["@babel/preset-env"],  // Transpile to ES5
                },
            },
        },
    ],
  },
  devServer: {
    static: './dist',

  },
};