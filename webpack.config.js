const path = require('path');

module.exports = {
  entry: './src/app.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        include: [path.resolve(__dirname, 'src')],
      },
    ],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public'),
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
    fallback: { "crypto": false } // Using mersenne-twister in the browser, so won't need crypto
  },
  mode: 'development',
  devServer: {
    port: 9000,
    host: '0.0.0.0',
  },
  watchOptions: {
    poll: 1000 // enable polling since fsevents are not supported in docker
  },
};
