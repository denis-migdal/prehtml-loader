module.exports = {

	prerender: function($, options) { // executed before any insertion of components.

		let footer_text = $('footer').text() + ' [modified by preprocessing]';
		$('footer').text( footer_text );
	},

	render: function($, options) { // executed after any insertion of components.

		let value = options.value;
		$('.preproc').text( value ); // modify the content of  component/index.html
	}

};