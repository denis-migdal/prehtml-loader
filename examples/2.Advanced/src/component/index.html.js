module.exports = {

	prerender: function($, options) {
		$('.cpreproc').text( JSON.stringify(options) );
	}
};