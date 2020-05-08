const mode = process.env.NODE_ENV || 'development';
const path = require('path');
module.exports = {
  mode: mode,
  entry: './src/index.ts',
  output: {
    path: __dirname,
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader'
      }
    ]
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    extensions: ['.ts', '.js']
  }
}
