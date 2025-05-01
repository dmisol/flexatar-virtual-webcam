const path = require('path');


module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    library: {
      type: 'module',    // ⬅️ ESM output!
    },
  },
  experiments: {
    outputModule: true   // ⬅️ enable ESM output
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,

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
  mode: 'production',
};