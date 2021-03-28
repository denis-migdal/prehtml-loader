var path = require('path');

let website = require('./src/main.js');

let {build_website} = require('prehtml-loader/webpack_helper.js');

let html_config = (dst_path, src) => {

	return {
		module: {
			rules: [{
				enforce: 'post',
				test: /\.html$/,
				use: {
					loader: 'file-loader',
					options: {
						outputPath: './../', // required
						name: dst_path
					}
				}
			},{
				test: /\.html$/,
				use: ['prehtml-loader'],
			}
		]},
		entry: { 
			main: src
		},
		output: {
			path: path.resolve(__dirname, 'out'),
			publicPath: '',
			filename: `${dst_path}.junk`,
			//clean: true
		}
	};
};

let js_config = (dst_path, src) => {

	return {
		module: {},
		entry: {
			main: src
		},
		output: {
			path: path.resolve(__dirname),
			publicPath: '',
			filename: dst_path,
			//clean: true
		}
	};
};

module.exports = build_website(website, html_config, js_config);