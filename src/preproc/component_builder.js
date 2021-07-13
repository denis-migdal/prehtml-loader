module.exports = ($, name, args, children = []) => {

	let component = $(`<component template='${name}'></component>`);

	component.attr('__args', JSON.stringify(args));

	component.append(children);

	return component;
};
