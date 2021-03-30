<div align="center">
  <img width="200" height="200"
    src="https://worldvectorlogo.com/logos/html5.svg">
  <a href="https://github.com/webpack/webpack">
    <img width="200" height="200" vspace="" hspace="25"
      src="https://worldvectorlogo.com/logos/webpack.svg">
  </a>
  <h1>PRE-HTML Loader</h1>
  <p>Easily creates static HTML pages at build time using templates, components, interpolations, and/or preprocessings.<br/>
No JS required and nothing new to learn ;)<p>
</div>


<h2>Install</h2>

```bash
npm i -D prehtml-loader
```

<h2>Examples</h2>

Websites using prehtml-loader:
* https://github.com/denis-migdal/keystroke.fr

See the directory /examples for some more advanced usage examples.

<h2>Basic usage</h2>

<h3>Step 1: declare your website structure</h3>

```
// ./src/main.js
module.exports = {

	pages_input_dir: './src/', // optionnal
	pages_output_dir: './dist/pages/', // optionnal
	pages: {
		home: { __src: 'home', __args: { name: 'Denis Migdal' } },
		error_404: { __src: 'error', __args: { code: 404 } },
		error_403: { __src: 'error', __args: { code: 403 } },
		demos: { // this is a directory
			demo_1: {__src: 'demos/demo_1'},
			demo_2: {__src: 'demos/demo_2'}
		}
	}

};
```
Tip: You can even dynamically generate your website structure from your project.

<h3>Step 2: tell webpack to build your pages</h3>

```
// ./webpack.config.js
let website = require('./src/main.js');

let {build_website} = require('prehtml-loader/webpack_helper.js');

let html_config = (dst_path, src) => { // write here how you want HTML files to be build.

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

let js_config = (dst_path, src) => {  // write here how you want JS files to be build.

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
```

<h3>Step 3: Write an HTML file !</h3>

```
// ./src/error/index.html
You got an error !

Error {{code}} // contents inside {{}} are evaluated.

{{let message = ''; if(error == 403) message = 'Forbidden !'; message}} // prints 'Forbidden !' if the code is 403.

<div class='message'></div>
```

<h2>Components</h2>

<h3>Step 1: Create a component</h3>

```
// ./src/component/index.html
<div>Hello ! I am {{name}}</div>
```

<h3>Step 2: includes your component</h3>

```
// ./src/home/index.html
<component template='../component' name='{{name}}'></component> // use '' to surround the value.
```

<h2>With templates ;)</h2>

<h3>Step 1: Write your template</h3>

```
<html>
	<head>
		<title>{{title}}</title>
	</head>
	<header>My header</header>
	<component template='{{page}}' __args='{{args}}'></component> // includes the page content
	// __args enables to set all arguments at once.
	// {{__args}} can also be used, it contains all arguments given to the page.
	<footer>My footer</footer>
</html>
```

<h3>Step 2: Add your template to your website</h3>

```
// ./src/main.js
module.exports = {

	templates_input_dir: `${__dirname}/`, // __dirname required
	templates: {
		__default:{ // the default template
			__src: 'template',
			__args: {
				title: 'Error'
			}
		},
		template2:{ // another template (optionnal)
			__src: 'template',
			__args: {
				title: 'Home'
			}
		}
	},

	pages_input_dir: './src/', // optionnal
	pages_output_dir: './dist/pages/', // optionnal
	pages: {
		home: { __src: 'home', __args: { name: 'Denis Migdal' }, __template: 'template2' }, // use the template2 for this page.
		error_404: { __src: 'error', __args: { code: 404 } }, // use the default template
		error_403: { __src: 'error', __args: { code: 403 }, __template_args: {title: 'Error 403'} }, // use the default template and override its arguments
		demos: { // this is a directory
			demo_1: {__src: 'demos/demo_1', _template: 'none'}, // don't use a template for this page
			demo_2: {__src: 'demos/demo_2', __template: 'none',} // don't use a template for this page
		}
	}

};
```



<h2>Pre-processings</h2>

Just put a JS file named as the html file you which to preprocess.
```
// ./src/error/index.html.js

module.exports = {

	prerender: function($, options) { // use it to modify the current html file before the components has been included.

		let message = '';
		if( options.code == 404 )
			message = 'not found';

		$('.message').text( message ); // JQuery interface.
	}

	render: function($, options) { // use it to modify the current html file after the components has been included.
		// ...
	}
};
```


<h2>Using it with html-loader</h2>

```
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
	// put your html-loader configuration here.
	// note: you may need to use extract-loader after html-loader.
},{
	test: /\.html$/,
	use: ['prehtml-loader'],
}]
```

