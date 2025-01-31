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

    mode: 'production',
    // mode: 'development',
    entry: './src/v-cam-lib.js',
    target: 'web',
    output: {
      path: path.resolve(__dirname, outputPath),
      filename: 'ftar-v-cam.js',
    
      library: 'VCAM',
      libraryTarget: 'umd', // Universal Module Definition
      globalObject: 'this', // Ensures compatibility for Node.js and browser
     
    },
    // experiments: {
    //     asyncWebAssembly: true
    // },

   

   
    
    module: {
    //   rules: [{ test: /\.txt$/, use: 'raw-loader' }],
      rules: [
        {
            test: /\.wasm$/,
            // type: "webassembly/sync",
            type: "asset/inline",
        },

      ]

    },
    plugins: [
         
        ]
  };

  

  
  return config;
}