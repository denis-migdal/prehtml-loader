module.exports = {

	templates_input_dir: `${__dirname}/`, // __dirname required
	templates: {
		__default:{
			__src: 'template',
			__args: {
				value: 1337
			}
		},
		template2:{
			__src: 'template',
			__args: {
				value: 2337
			}
		}
	},

	pages_input_dir: './src/', // optionnal
	pages_output_dir: './dist/pages/', // optionnal
	pages: {
		page: {
			__template: 'none',
			__src: 'page',
			__args: {
				value: 42,
				nested: {value: 142}
			}
		},
		with_template: {
			page_with_template: { // use the __default template
				__src: 'page',
				__args: {
					value: 43,
					nested: {value: 143}
				},

				the_same_page: {
					__template: 'template2',
					__src: 'page',
					__args: {
						value: 44,
						nested: {value: 144}
					}
				}
			}
		}
	}

};