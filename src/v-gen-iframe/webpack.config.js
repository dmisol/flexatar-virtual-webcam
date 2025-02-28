const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  // mode: 'development',
  resolve:{
    fallback: {"fs": false,"path": false}
  },
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        // type: "asset/inline",
        // use: {
        //   loader: 'esbuild-loader', // 🚀 Faster alternative to Babel (optional)
        //   options: { loader: 'js',target: 'esnext' }
        // }
        
      },
    ],
  },
  devServer: {
    port: 8082,
    static: './dist',
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Resource-Policy": "cross-origin",
      "Origin-Agent-Cluster": "?1",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers":  "Origin, X-Requested-With, Content-Type, Accept, Range",
    },
  },
};