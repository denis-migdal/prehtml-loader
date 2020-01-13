var loaderUtils = require("loader-utils");

module.exports = function (html) {
   const options = loaderUtils.getOptions(this) || {}

   let result = html.replace(/\${scope\.([^}]*)}/g, (r,k)=>options[k]);

   result = result.replace( /(\$\{[^\}]*)scope\.([\w]*)*([^\}]*\})/g , (r, pre, k, post) => pre + options[k] + post);

   return result;
   //return html.replace(/\!{([^}]*)}/g, (r,k)=>options[k]);
}