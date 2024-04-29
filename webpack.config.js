const path = require('path');

module.exports = {
  entry: './src/app.ts', // Change 'app.ts' to your main TypeScript file
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public/dist'),
  },
  mode: 'development',
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
      watch: true,
    },
    devMiddleware: {
      writeToDisk: true,
    },
    port: 9000,
    hot: true,
  },
};
