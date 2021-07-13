const path = require('path');
const fs = require('fs');


const {BUILDERS, WebPage} = require('webpack-framework');

BUILDERS.WebPage.DEFAULT_RULES.html = function(config, {ROOT, src, dst, args, optimize}) {

	if( fs.existsSync(`${ROOT}/${src}/index.html`) )
		config.entry.push(`${src}/index.html?${JSON.stringify(args)}`);


	if(optimize)
		throw 'TODO';

	let prehthml = 'prehtml-loader';

	config.module.rules.push({
		test: /\.html$/,
		use: optimize ? ['html-minifier-loader', prehthml] : [prehthml],
	});

	config.module.rules.push({
		enforce: 'post',
		test: /\.html$/,
		use: {
			loader: 'file-loader',
			options: { name: `${dst}/index.html` }
		}
	});
}

// list your builds here (see Webpack-Framwork documentation).
module.exports = [
	// Build individual pages
	BUILDERS.WebPage('./dist/dev/1.JS', './src/1.JavaScript'),
	// -- OR --
	BUILDERS.WebPage('./dist/dev/2.Args_JSON', new WebPage('./src/2.Args', {args: {text: 'obj'}}) ),
	// -- OR --
	BUILDERS.WebPage('./dist/dev/2.Args_URI', new WebPage('./src/2.Args?text=uri') ),
];