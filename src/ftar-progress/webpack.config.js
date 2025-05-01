const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
 
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, './dist'),
  },
  // mode: 'development',
  resolve:{
    fallback: {"fs": false,"path":  false}
  },
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/
        
      },
     
      // {
      //   test: /\.wasm$/,
      //   type: 'asset/resource', 
      // }
    ],
  },
  experiments: {
    asyncWebAssembly: true, // Ensures WebAssembly files are loaded separately
},
  devServer: {
    static: './dist',
    

  },
  // optimization: {
  //     usedExports: true,
  //     minimize: true,
  //     minimizer: [
  //       new TerserPlugin({
  //         terserOptions: {
  //           compress: {
  //             dead_code: true,
  //             drop_console: true, // <-- This removes console.* calls
  //           },
  //         },
  //       }),
  //     ],
  //   },
};