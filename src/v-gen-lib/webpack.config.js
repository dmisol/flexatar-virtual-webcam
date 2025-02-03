const path = require('path');


// npx webpack --config webpack.config.js

module.exports = function(env) {
  const outputPath = '../server/src/'
  // const outputPath = 'dist/custom'

  const config = {
    optimization: {
      splitChunks: false,
      minimize: true,
    },

    // mode: 'production',
    mode: 'development',
    entry: './src/v-gen-lib.js',
    target: 'web',
    output: {
      path: path.resolve(__dirname, outputPath),
      filename: 'ftar-v-gen.js',
    
      library: 'VGEN',
      libraryTarget: 'umd', // Universal Module Definition
      globalObject: 'this', // Ensures compatibility for Node.js and browser
     
    },

    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/
           
        },

      ]

    },
    plugins: [
         
        ]
  };

  

  
  return config;
}