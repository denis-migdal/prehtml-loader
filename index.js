var loaderUtils = require("loader-utils");

function merge_loaders(query, k, path, loader_query) {

	query = loaderUtils.parseQuery(query);
	if(loader_query)
		query = Object.assign( loaderUtils.parseQuery(loader_query) , query);

	return '!' + path + 'prehtml-loader?' + JSON.stringify(query);
}

async function importToRequire(pthis, k, pre, quote, str, query, post) {

	let pre_str = '';

	str = await replaceAsync(str, /(^|\!)([^\?\!]*)(\?[^\!]*|$)/g,
			async (k, pre, module_name, post) => {
				return pre + (await resolve(pthis, module_name)) + post
			});

	if( ! str.startsWith('!') )
		pre_str = '!prehtml-loader' + query + '!';
	else
		str = str.replace( /\!([^\!]*)prehtml-loader([^\!]*)/g, (...args) => merge_loaders(query, ...args) );


	let result = pre + 'require(' + quote + pre_str + str + quote + ')' + post;

	return result;
}


function getOptions(pthis) {

	let options = loaderUtils.getOptions(pthis) || {};

   if(pthis.resourceQuery)
	   options = Object.assign(options, loaderUtils.parseQuery(pthis.resourceQuery));

	return options;
}

function parseOptions(pthis, options) {

	let composed_fields = {};

	function add_field(fiels, key_parts, value) {

		if( typeof key_parts == 'string')
			key_parts = key_parts.split('\.');

		let dir = key_parts[0];

		let obj = composed_fields[dir] = composed_fields[dir] || {};

		if( key_parts.length == 2)
			obj[key_parts[1]] = value;
		else
			add_field(obj, key_parts.slice(1), value);
	}

	for(let key in options) {

		if( key.includes('.') )
			add_field(composed_fields, key, options[key]);

		if( typeof options[key] == 'string' && options[key].startsWith('relpath:') )
			options[key] = this._module.issuer.context + '/' + options[key].slice('relpath:'.length);

		if( typeof options[key] != 'string')
			options[key] = JSON.stringify(options[key]);
	}

	for(let key in composed_fields)
		options[key] = JSON.stringify(composed_fields[key]);

	/*** TEMPLATE ***/

	if( options.TEMPLATE_CONTENT) {

		let file = options.TEMPLATE_CONTENT.split('/');
		file = file[file.length - 1].split('.');

		pthis.loaders[0].query = pthis.loaders[0].query.replace('[name]', file[0]);
		pthis.loaders[0].query = pthis.loaders[0].query.replace('[ext]',  file[1]);
	}

	options.__args = JSON.stringify(options);


	return options;
}

//From: https://stackoverflow.com/questions/33631041/javascript-async-await-in-replace
async function replaceAsync(str, regex, asyncFn) {
    const promises = [];
    str.replace(regex, (match, ...args) => {
        const promise = asyncFn(match, ...args);
        promises.push(promise);
    });
    const data = await Promise.all(promises);
    return str.replace(regex, () => data.shift());
}


async function exportToRequire(pthis, k, request, quote, name) {

	let require = await SearchAndReplaceImports(pthis, '${import '+ request +'}');

	require = require.slice(2,-1);
	
	return '<export_script>'+ require +' as '+ name +'</export_script>';
}

async function SearchAndReplaceImports(pthis, result) {

	return await replaceAsync(result, /(\$\{(?:[^\}]*[^w]|))import ("|')((?:\\\2|[^\2])*?)(|\?(?:\\\2|[^!\2])*?)\2([^\}]*\})/g,
			async (...args) => await importToRequire(pthis, ...args) );
}

/** replace scope variables **/
async function parse(pthis, html, options) {

   let result = html.replace(/\${scope\.([^}]*)}/g, (r,k)=>options[k]);

   result = result.replace( /(\$\{(?:[^\}]*[^w]|))scope\.([\w]*)((?:|[\w][^\}]*)\})/g , (r, pre, k, post) => pre + options[k] + post);


   if( options.IMPORT_SUPPORT !== false )
		result = await SearchAndReplaceImports(pthis, result);

	if(options.EXPORT_SUPPORT !== false)
		result = await replaceAsync(result, /<\!--EXPORT (("|')(?:\\\1|[^\1])*?\1) as ([\.\w]+) -->/g,
			async (...args) => await exportToRequire(pthis, ...args) );
		//<!--EXPORT './../API' as KGUI.Template -->

	return result;
}

async function resolve(pthis, name, context = pthis.rootContext) {

	if( name.startsWith('.') )
		context = pthis.context;

	let args = await pthis.getResolve( pthis._compilation.options.resolve )(context, name);

	return args;
}

async function run(pthis, html, map, meta) {

	let template = html.match(/<\!--TEMPLATE: ([^\n]*) -->\n(?:<\!--((?:\t}|[^}])*}\n)-->|)/sm);
	
	if(template !== null) {

		if( pthis._module.issuer.resource.endsWith('.js') ) {

			//let template_name = await resolve(pthis, template[1], this.rootContext); //TODO ?
			let template_name = template[1];
			let template_arguments = JSON.parse(template[2]);

			let options = Object.assign(template_arguments, getOptions(pthis) );
			options.TEMPLATE_CONTENT = pthis.resourcePath;

			html = "${import '"+ template_name +"?${scope.__args}'}";

			options = parseOptions(pthis, options);
			html = await parse(pthis, html, options);

			return html;
		}

		html = html.replace(template[0], '');
	}

	let options = parseOptions( pthis, getOptions(pthis) );
	html = await parse(pthis, html, options);

	return html;
}

module.exports = function (html, map, meta) {


	let callback = this.async();


	run(this, html, map, meta).then( (html) => {
		callback(null, html, map, meta);
	});
}

function beforeLoader(html, map, meta) {

	html = replaceAsync(
		html,
		/<export_script>(require\(("|')(?:\\\1|[^\1])*?\1\)) as ([\.\w]*)<\/export_script>/g,
		async (k, require, quote, name) => {

			this.data.exports[name] = require;
			
			return '';
		}
	);

	return html;
}

function postExecution(html, map, meta) {

	this.data.exports['results'] = JSON.stringify(html);

	let js_content = [];

	js_content.push('let PREHTML_Export = {};');

	let keys = new Set();
	keys.add('');

	function addKey(key) {

		if( keys.has(key) )
			return;

		addKey( key.split('.').slice(0, -1).join('.') );

		js_content.push('PREHTML_Export.' + key + ' = {};');
		keys.add(key)
	}

	Object.entries( this.data.exports ).forEach( (e) => {

		addKey( e[0].split('.').slice(0, -1).join('.') );

		js_content.push( 'PREHTML_Export.' + e[0] + ' = ' + e[1] + ';' );
	});

	js_content.push('module.exports = PREHTML_Export;');

	return js_content.join('\n');
}

module.exports.pitch = function (...args) {

	let options = getOptions(this);

	if( options.EXPORT_SUPPORT !== false
		&& this._module.issuer !== null
		&& this._module.issuer.resource !== undefined
		&& this._module.issuer.resource.endsWith('.js') && this.resourcePath.endsWith('.html') ) {

		let data = { exports:{} };

		this.loaders.unshift({
			path:'',
			query:'',
			options:'',
			ident: undefined,
			normal: postExecution,
			pitch: () => {},
			raw: undefined,
			data: data,
			pitchExecuted:true,
			normalExecuted:false 
		});

		let fileloaderIdx = this.loaders.findIndex( (e) => e.path.endsWith('file-loader/dist/cjs.js') );

		if(fileloaderIdx == -1)
			fileloaderIdx = 0;

		this.loaders.splice(fileloaderIdx + 1, 0, {
			path:'',
			query:'',
			options:'',
			ident: undefined,
			normal: beforeLoader,
			pitch: () => {},
			raw: undefined,
			data: data,
			pitchExecuted:true,
			normalExecuted:false 
		});
	}
};