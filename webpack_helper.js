
function * getPages(website_pages, prefix = '') {

	for(let page in website_pages) {

		if( page.startsWith('__') ) // nor a page, nor a directory.
			continue;

		if( '__src' in website_pages[page] ) // it's a webpage.
			yield [`${prefix}${page}/`, website_pages[page] ];

		yield* getPages(website_pages[page], `${prefix}${page}/`); // get subpages
	}


	return;
}


function make_uri({__src, __args = {}, __template} = {}, templates, pages_input_dir, templates_input_dir) {

	if( templates && __template !== 'none') {

		let template_name = __template ?? '__default';
		let template_options = templates[template_name];

		__args.__template = `${templates_input_dir}${template_options.__src}`;
		__args.__template_args = template_options.__args;
	}

	return `${pages_input_dir}${__src}/index.html?${JSON.stringify(__args)}`;
}

function make_jsuri({__src, __args}, pages_input_dir) {

	if(false)
		return false;

	return `${pages_input_dir}${__src}/main.js`;
}

module.exports = {

	build_website: function (website, html_config, js_config) {

		let pages_input_dir = website.pages_input_dir ?? '';
		let pages_output_dir = website.pages_output_dir ?? '';

		let config = [];

		for(let [dst, args] of getPages(website.pages) ) {
			let output = `${pages_output_dir}${dst}/index.html`;
			config.push( html_config(output, make_uri(args, website.templates, pages_input_dir, website.templates_input_dir) ) );
	

			let js_uri = make_jsuri(args, pages_input_dir);
			let js_output = `${pages_output_dir}${dst}/bundle.js`;

			if( js_uri )
				config.push( js_config(js_output, js_uri ) );
		}


		return config;
	}
}
