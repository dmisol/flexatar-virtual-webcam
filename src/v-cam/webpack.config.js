const path = require('path');

module.exports = {
 
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  mode: 'development',
  resolve:{
    fallback: {"fs": false,"path":  require.resolve("path-browserify")}
  },
  // mode: 'production',
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
    // server: {
    // type: 'https',
    //   options: {

    //     key: fs.readFileSync('/home/naospennikov/Documents/self_signed_cert/localhost.key'),
    //     cert: fs.readFileSync('/home/naospennikov/Documents/self_signed_cert/localhost.crt'),
    //     passphrase: 'webpack-dev-server',
    //     requestCert: true,
    //   },
    // }
  },
};