module.exports = {


	component_builder: ($, name, args, children = []) => {

		let component = $(`<component template='${name}' __args='${ JSON.stringify(args) }'></component>`);

		component.append(children);

		return component;
	}

}
