<h2 align="center">Install</h2>

```bash
npm i -D prehtml-loader
```

<h2 align="center">Usage (standalone)</h2>

prehtml-loader replaces ${scope.*varname*} occurrences by values you provide to the loader:

Example 1:
```html
<!-- foo.html -->
<html>Hello ${scope.data}!</html>
```

```js
require('prehtml-loader?data=world!./foo.html');
// => <html>Hello world!</html>
```

Example 2:
```html
<!-- foo.html -->
<script>let x = ${scope.value};</script>
```

```js
require('prehtml-loader?value=42!./foo.html');
// => <script>let x = 42;</script>
```

prehtml-loader also replaces scope.*varname* occurrences inside string literals:

Example 1:
```html
<!-- foo.html -->
<script>let x = `${10 + scope.value}`;</script>
```

```js
require('prehtml-loader?value=42!./foo.html');
// => <script>let x = `${10 + 42}`;</script>
```

Example 2:
```html
<!-- foo.html -->
<script>let x = `${10 + ${scope.value}}`;</script>
```

```js
require('prehtml-loader?value=42!./foo.html');
// => <script>let x = `${10 + 42}`;</script>
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
require('prehtml-loader?value=42!./foo.html');
// or require('!html-loader?interpolate!prehtml-loader?value=42!./foo.html');
// => <script>let x = 52;</script>
```

You can also send parameters to required sub html files:
```html
<!-- foo.html -->
<div>${required('prehtml-loader?link=${scope.value + 10}!./subfoo.html')}</div>
```

```html
<!-- subfoo.html -->
<a>${scope.link}</a>
```

```js
<!-- foo.js -->
require('prehtml-loader?value=42!./foo.html');
// or require('!html-loader?interpolate!prehtml-loader?value=42!./foo.html');
// => <div><a>52</a><div>
```

<h2 align="center">Usage (with file-loader)</h2>

<a href='https://github.com/webpack-contrib/file-loader'>file-loader</a> enables to create files into the output directory.
You will thus need to distinguish between your source html files that will create new files into the output directory, and the ones you just want to include. We suggest to use the ".c.html" extension for the latter.


```js
<!-- webpack.config.js -->
var path = require('path');

module.exports = {

	module: {
		rules: [{
			enforce: 'post',
			test: /\.html$/,
			exclude: /\.c.html$/,
			use: ['file-loader?name=[name].[ext]', 'extract-loader', 'html-loader?interpolate'],
		},{
			enforce: 'post',
			test: /\.c.html$/,
			use: ['html-loader?interpolate'],
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
<div>${required('prehtml-loader?link=${scope.value + 10}!./subfoo.html')}</div>
```

```html
<!-- subfoo.html -->
<a>${scope.link}</a>
```

```js
<!-- foo.js -->
require('prehtml-loader?value=42!./foo.html');
// or require('!html-loader?interpolate!prehtml-loader?value=42!./foo.html');
```