Enables to provide parameters for webpack html-loader interpolation. Consequently, it enables to use html templates.

<h2 align="center">Install</h2>

```bash
npm i -D prehtml-loader
```

<h2 align="center">Usage (standalone)</h2>

<h3>Scope variables replacements</h3>

prehtml-loader replaces ${scope.*varname*} occurrences by values you provide to the loader:

```html
<!-- foo.html -->
<html>Hello ${scope.data}!<script>let x = ${scope.value};</script></html>
```

Example 1 (with require):
```js
<!-- foo.js -->
require('!prehtml-loader?data=world&value=42!./foo.html');
// => <html>Hello world!<script>let x = 42;</script></html>
```

Example 2 (with import):
```js
<!-- foo.js -->
import '!prehtml-loader!./foo.html?value=42'
// or import '!prehtml-loader?value=42!./foo.html'
// => <html>Hello world!<script>let x = 42;</script></html>
```

Example 3 (with import and implicit loader):
```js
<!-- foo.js -->
import './foo.html?value=42'
// => <html>Hello world!<script>let x = 42;</script></html>
```

```js
<!-- webpack.config.js -->
var path = require('path');

module.exports = {

	module: {
		rules: [{
			test: /\.html$/,
			use: ['prehtml-loader'],
		}
	]},
	entry: './foo.js',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'foo.bundle.js'
	}
};
```

<h3>Scope variables advanced replacements</h3>

prehtml-loader also replaces scope.*varname* occurrences inside string literals:

```js
require('prehtml-loader?value=42!./foo.html');
```

Example 1:
```html
<!-- foo.html -->
<script>let x = `${10 + ${scope.value}}`;</script>
```

Output: 
```<script>let x = `${10 + 42}`;</script>```

Example 2:
```html
<!-- foo.html -->
<script>let x = `${10 + scope.value}`;</script>
```

Output: 
```<script>let x = `${10 + 42}`;</script>```

<h3>Nested arguments</h3>

prehtml-loader support nested arguments:

```html
<!-- foo.html -->
${scope.data.value}
${scope/data}
```

```js
import './foo.html?data.value=42&data.data=world';
// => 42
// => {'value': 42, 'data':'world'}
```

<h3>JSON arguments</h3>

You can also provide JSON arguments to prehtml-loader:
```js
<!-- foo.js -->
import "./foo.html?{'data':'world', value': 42}";
```


<h2 align="center">Usage (with html-loader)</h2>

<a href='https://github.com/webpack-contrib/html-loader'>html-loader</a> needs to be executed **after** prehtml-loader:

```js
<!-- webpack.config.js -->
var path = require('path');

module.exports = {

	module: {
		rules: [{
			enforce: 'post',
			test: /\.html$/,
			use: ['html-loader?interpolate'],
		}, {
			test: /\.html$/,
			use: ['prehtml-loader'],
		}
	]},
	entry: './foo.js',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'foo.bundle.js'
	}
};
```

```html
<!-- foo.html -->
<script>let x = ${10 + ${scope.value}};</script>
```

```js
<!-- foo.js -->
import './foo.html?value=42';
// => <script>let x = 52;</script>
```

<h3>import/require in HTML file</h3>

You can also send parameters to required sub html files:


```html
<!-- subfoo.html -->
<a>${scope.link}</a>
```

```js
<!-- foo.js -->
import './foo.html>value=42';
// => <div><a>52</a><div>
```

Example 1 (with require):

```html
<!-- foo.html -->
<div>${required('prehtml-loader?link=${scope.value + 10}!./subfoo.html')}</div>
```

Example 2 (with import):

prehtml-loader transform import into require.

```html
<!-- foo.html -->
<div>${import './subfoo.html?link=${scope.value + 10}'}</div>
```

<h3>Disable import transformation</h3>

You can disable this features by adding a IMPORT_SUPPORT=false option.

Example 1 (in webpack.config.js):
```js
<!-- webpack.config.js -->
//...
	use: ['prehtml-loader?IMPORT_SUPPORT=false'],
//...
```

Example 2 (with require):

```js
<!-- foo.js -->
require('!prehtml-loader?IMPORT_SUPPORT=false!./foo.html');
//...
```

Example 3 (with import):

```js
<!-- foo.js -->
import '!prehtml-loader?IMPORT_SUPPORT=false!./foo.html';
```

<h2 align="center">Usage (with file-loader)</h2>

<a href='https://github.com/webpack-contrib/file-loader'>file-loader</a> enables to create files into the output directory.
We suggest to create new html files only when required in a .js file.

```js
<!-- webpack.config.js -->
var path = require('path');

module.exports = {

	module: {
		rules: [{
			issuer: {test: /\.js$/},
			enforce: 'post',
			test: /\.html$/,
			use: ['file-loader?name=[name].[ext]', 'extract-loader', 'html-loader?interpolate']
		}, {
			issuer: {exclude: /\.js$/},
			enforce: 'post',
			test: /\.html$/,
			use: ['html-loader?interpolate']
		}, {
		    test: /\.html$/,
		    use: 'prehtml-loader'
		},
	]},
	entry: './foo.js',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'foo.bundle.js'
	}
};
```

```html
<!-- foo.html -->
<div>${ import './subfoo.html?link=${scope.value + 10}'}</div>
```

```html
<!-- subfoo.html -->
<a>${scope.link}</a>
```

```js
<!-- foo.js -->
import './foo.html?value=42';
```

Produces foo.html file in /dist directory.

<h3>HTML Templates</h3>

The special option TEMPLATE_CONTENT enables you to build HTML template.
`relpath:` before an option value transforms a relative path to an absolute path.
In this example, we put the page parameters into the variable `scope.TCA`.
Please note that `scope.TCA` is in JSON format.

```html
<!-- foo.html -->
<div>${scope.data}: ${scope.value}</div>
```

```html
<!-- template.html -->
<html>${ import '${scope.TEMPLATE_CONTENT}?${scope.TCA}' }</html>
```

```js
<!-- foo.js -->
import './template.html?TEMPLATE_CONTENT=relpath:./foo.html&TCA.value=10&TCA.data=world}';
```

Outputs a foo.html file in /dist directory:
```html
<!-- foo.html -->
<html><div>world: 10</div></html>
```