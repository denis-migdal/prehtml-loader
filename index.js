var loaderUtils = require("loader-utils");
const fs = require('fs');

function merge_loaders(query, k, path, loader_query) {

	query = loaderUtils.parseQuery(query);
	if(loader_query)
		query = Object.assign( loaderUtils.parseQuery(loader_query) , query);

	return '!' + path + 'prehtml-loader?' + JSON.stringify(query);
}

function importToRequire(k, pre, left_quote, str, query, right_quote, post) {

	query = query || query2;

	let pre_str = '';

	if( ! str.startsWith('!') )
		pre_str = '!prehtml-loader' + query + '!';
	else
		str = str.replace( /\!([^\!]*)prehtml-loader([^\!]*)/g, (...args) => merge_loaders(query, ...args) );


	let result = pre + 'require(' + left_quote + pre_str + str + right_quote + ')' + post;

	return result;
}

module.exports = function (html) {

   let options = loaderUtils.getOptions(this) || {};

   if(this.resourceQuery)
	   options = Object.assign(options, loaderUtils.parseQuery(this.resourceQuery));

	/** Arguments processings **/

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

	if( options.TEMPLATE_CONTENT ) {

		let file = options.TEMPLATE_CONTENT.split('/');
		file = file[file.length - 1].split('.');

		this.loaders[0].query = this.loaders[0].query.replace('[name]', file[0]);
		this.loaders[0].query = this.loaders[0].query.replace('[ext]',  file[1]);
	}

	/** replace scope variables **/

   let result = html.replace(/\${scope\.([^}]*)}/g, (r,k)=>options[k]);

   result = result.replace( /(\$\{(?:[^\}]*[^w]|))scope\.([\w]*)((?:|[\w][^\}]*)\})/g , (r, pre, k, post) => pre + options[k] + post);

   if( options.IMPORT_SUPPORT !== false )
		// add support for requires query strings.
		result = result.replace( /(\$\{(?:[^\}]*[^w]|))import ("|')((?:[^\2\\]|\\.)*)(\?(?:[^!\2\\]|\\.)*)(\2)([^\}]*\})/g , (...args) => importToRequire(...args) );

   return result;
}