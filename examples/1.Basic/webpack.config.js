var path = require('path');

module.exports = [{
	module: {
		rules: [{
			enforce: 'post',
			test: /\.html$/,
			use: {
				loader: 'file-loader',
				options: {
					outputPath: './../dist', // required
					context: 'src/',
					name: '[path][name].[ext]'
				}
			}
		},{
			test: /\.html$/,
			use: ['prehtml-loader'],
		}
	]},
	entry: { // put your HTML Files here.
		//page: './src/page/index.html?{value: 42, nested: {value: 40}}',
		page_with_template: './src/page/index.html?{value: 42, nested: {value: 40}, __template: "../template", __template_args: {value: 1337}}'
	},
	output: {
		path: path.resolve(__dirname, 'out'),
		publicPath: '',
		filename: '[name].junk',
		clean: true
	}
},
{
	module: {},
	entry: {
		'page': './src/page/main.js'
	},
	output: {
		path: path.resolve(__dirname, 'dist'),
		publicPath: '',
		filename: '[name]/bundle.js',
		clean: true
	}
}
];
