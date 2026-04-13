const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
 
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, './dist'),
  },
  resolve:{
    fallback: {"fs": false, "path": false}
  },
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/
      }
    ],
  },
  experiments: {
    asyncWebAssembly: true,
  },
  devServer: {
    static: './dist',
  },
  optimization: {
    usedExports: true,
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            dead_code: true,
            drop_console: true,
          },
        },
      }),
    ],
  },
};
