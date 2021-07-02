// noinspection WebpackConfigHighlighting

const path = require('path');

module.exports = {
  entry: './src/telosevm-js.ts',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'telosevm-js.js',
    libraryTarget: 'umd',
    path: path.resolve(__dirname, 'dist'),
  },
};
