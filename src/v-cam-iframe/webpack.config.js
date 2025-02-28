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
        test: /\.js$/,
        exclude: /node_modules/
        
      },
    ],
  },
  devServer: {
    static: './dist',

  },
};