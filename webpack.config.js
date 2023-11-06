const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const postcssPresetEnv = require('postcss-preset-env');

const mode = process.env.NODE_ENV || "development"

const devMode = (mode === "development")

const target = devMode ? 'web' : 'browserslist'
const devtool = (devMode ? "source-map" : undefined)

module.exports = {
	mode,
	target,
	devtool,
	devServer: {
		hot: true,
	},
	entry: [path.resolve(__dirname, 'src', 'scripts', 'index.js'), 'core-js'],
	output: {
		path: path.resolve(__dirname, 'dist'),
		clean: true,
		filename: 'script.[contenthash].js',
		assetModuleFilename: 'assets/[name][ext]'
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: path.resolve(__dirname, 'src', 'index.html')
		}),
		new MiniCssExtractPlugin({
			filename: "style.[contenthash].css"
		})
	],
	module: {
		rules: [
			{
				test: /\.html$/i,
				loader: "html-loader",
			},
			{
				test: /\.(c|sa|sc)ss$/i,
				use: [
					devMode ? "style-loader" : MiniCssExtractPlugin.loader,
					"css-loader",
					{
						loader: "postcss-loader",
						options: {
							postcssOptions: {
								plugins: [postcssPresetEnv]
							},
						},
					},
					"sass-loader",
				],
			},
			{
				test: /\.(?:js|mjs|cjs)$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: [
							['@babel/preset-env', { targets: "defaults" }]
						]
					}
				}
			},
			{
				test: /\.woff2?$/i,
				type: 'asset/resource',
				generator: {
					filename: 'fonts/[name][ext]'
				}
			},
		],
	},
}