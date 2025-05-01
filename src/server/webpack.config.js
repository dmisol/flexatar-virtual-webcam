const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  mode: 'development',
  resolve:{
    fallback: {"fs": false,"path": false}
  },
//   mode: 'production',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/
        
      },
      {
        test: /\.worker\.js$/,
        use: [{ loader: 'worker-loader' ,
          options: {
            inline: 'no-fallback', // Inline the worker and do not create an asset file
            esModule: true,
            // type: "module" 
          },
        }
      ],
        
      }
    ],
  },
  devServer: {
    static: './dist',
    proxy: [
      {
        context: ['/api'],
        target: 'https://dev.vgen.flexatar-sdk.com',
        secure: true,
        changeOrigin: true
      },
    ],
  },
};