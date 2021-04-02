module.exports = {


	component_builder: ($, name, args) => {
		return $(`<component template='${name}' __args='${ JSON.stringify(args) }'></component>`);
	}

}
