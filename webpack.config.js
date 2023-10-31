const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: "./src/js/index.ts",
  mode: "development",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "main.js",
  },

  module: {
    rules: [
      {
        test: /\.html$/,
        loader: "raw-loader",
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        loader: "file-loader",
      },
      {
        test: /\.ts/,
        exclude: /node_modules/,
        loader: "ts-loader",
        options: {
          transpileOnly: true,
          compilerOptions: {
            isolatedModules: true,
          },
        },
      },
      {
        test: /\.wgsl$/,
        loader: "raw-loader",
      },
    ],
  },

  resolve: {
    alias: {
      components: path.resolve(__dirname, "./src/js/components"),
    },
    extensions: [".ts", ".js"],
  },

  devServer: {
    static: {
      directory: path.join(__dirname, "dist"),
    },
    compress: true,
    port: 8000,
  },

  plugins: [
    new HtmlWebpackPlugin({
      filename: "index.html",
      template: "./src/index.html",
      hash: true,
    }),
  ],
};
