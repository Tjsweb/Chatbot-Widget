// webpack.config.js
const path = require('path');

module.exports = {
  entry: './index.js',
  module: {
    rules: [
      {
        test: /\.tsx?$/, // Matches .ts and .tsx files
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'chatbot.min.js',
    path: path.resolve(__dirname, 'dist'),
  },
  mode: 'production',
};
