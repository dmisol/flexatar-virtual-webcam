const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  // mode: 'development',
    mode: 'production',
  resolve:{
    fallback: {"fs": false,"path": false}
  },

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
  optimization: {
      usedExports: true,
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              dead_code: true,
              drop_console: true, // <-- This removes console.* calls
            },
          },
        }),
      ],
    },
};