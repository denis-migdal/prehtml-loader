const jsdom = require("jsdom");
const jquery_builder = require('jquery');
const fs = require('fs');


var loaderUtils = require("loader-utils");

function getOptions(pthis) {

	let options = loaderUtils.getOptions(pthis) || {};

	if(pthis.resourceQuery)
	   options = Object.assign(options, loaderUtils.parseQuery(pthis.resourceQuery));

	options.__args = JSON.parse( JSON.stringify(options) );

	return options;
}

/** replace scope variables **/
async function parse(pthis, html, options) {

	let pre = Object.entries(options).map( e => `let ${e[0]} = ${JSON.stringify(e[1])};` );

	pre = pre.join('');

	return html.replace(/\{\{([^}]*)}}/g, (r,script) => {

		let result = eval(pre + script);

		if(result === undefined)
			return '';

		if( typeof result !== 'string' )
			result = JSON.stringify(result);

		return result;
	} );
}

async function resolve(pthis, name, context) {

	if( name.startsWith('/') ) // abs path
		return name;

	if( context === undefined)
		context = name.startsWith('.') ? pthis.context : pthis.rootContext;

	return await pthis.getResolve( pthis._compilation.options.resolve )(context, name);
}

async function importComponents(pthis, $, context) {

	for(let elem of $.find('component') ) {

		let options = {};

		let attr = elem.attributes;

		for(let i = 0; i < attr.length; ++i)
			options[attr[i].name] = attr[i].value;

		let template = options.template;
		delete options.template;

		function addField(target, name_parts, value) {


			let dir = name_parts[0];

			let obj = target[dir] = target[dir] ?? {};

			if( name_parts.length == 2)
				obj[name_parts[1]] = value;
			else
				addField(obj, name_parts.slice(1), value);
		}


		function parseField(value) {

			try { //if JSON.parse fails, then it's a string.
				return JSON.parse(value);
			} catch(e){


				console.log('Parse Error', value);
			}

			return value;
		}

		//Parse value...
		for(let name in options) {

			if( ! name.includes('.') ) {
				options[name] = parseField(options[name]);
				continue;
			}

			addField(options, name.split('\.'), parseField(options[name]) );

			delete options[name];
		}

		if( '__args' in options) {
			let args = options.__args;
			delete options.__args;
			options = Object.assign({}, args, options);
		}

		options.__args = JSON.parse( JSON.stringify(options) );

		let path = await resolve(pthis, `${template}/index.html`, context);
		let content = fs.readFileSync(path, 'utf8');
		
		content = await run(pthis, content, options, { htmlPath: path});
		$(elem).replaceWith( $.parseHTML(content) );
	}

}

async function templateRedir(pthis, options, {htmlPath, rootHtmlPath, isRootComponent}) {

	let pagePath = htmlPath;

	let template = options.__template;
	let template_opts = options.__template_args;
	
	delete options.__args;
	delete options.__template;
	delete options.__template_args;

	template_opts.args = options;
	template_opts.page = pagePath.split('/').slice(0,-1).join('/');

	let path = await resolve(pthis, `${template}/index.html`);
	let content = fs.readFileSync(path, 'utf8');

	return await run(pthis, content, template_opts, { htmlPath: path, rootHtmlPath, isRootComponent});
}

function insertScriptElement(pthis, $, dir) {

	if( ! fs.existsSync(`${dir}/main.js`) )
		return;

	let script = $(`<script src='./bundle.js' defer="defer" />`);
	$('head')[0].appendChild( script[0] ); // dunno why JQuery is adding the script twice...
	//$('head').eq(0).append( script[0] );
}


async function renderHTML(pthis, html, options, {htmlPath, rootHtmlPath, isRootComponent}) {

	let render_fcts = {};

	let renderJSPath = `${htmlPath}.js`;
	let dir = htmlPath.split('/').slice(0, -1).join('/');

	if( fs.existsSync(renderJSPath) )
		render_fcts = require(renderJSPath);

	let jhtml = new jsdom.JSDOM(html);
	global.document = jhtml.window.document;
	let $ = jquery_builder(jhtml.window);

	if( render_fcts.prerender )
		render_fcts.prerender( $, options, {
			__file__: renderJSPath,
			__dir__: dir
		});

	await importComponents(pthis, $, dir);

	if( isRootComponent ) {
		let jsdir = rootHtmlPath.split('/').slice(0, -1).join('/');
		insertScriptElement(pthis, $, jsdir);
	}


	if( render_fcts.render )
		render_fcts.render( $, options, {
			__file__: renderJSPath,
			__dir__: dir
		});

	return jhtml.serialize();
}

async function run(pthis, html, options, meta) {

	if( options === undefined)
		options = getOptions(pthis);

	if( meta === undefined)
		meta = {
			htmlPath: pthis.resourcePath,
			rootHtmlPath : pthis.resourcePath,
			isRootComponent: true
		};


	if( '__template' in options )
		return templateRedir(pthis, options, meta);


	html = await parse(pthis, html, options);
	html = await renderHTML(pthis, html, options, meta);

	return html;
}

module.exports = function (html, map, meta) {

	let callback = this.async();

	run(this, html).then( (html) => {
		callback(null, html, map, meta);
	});
}
