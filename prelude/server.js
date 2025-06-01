import {
	utils,
	HandcraftElement,
	HandcraftEventTarget,
	HandcraftRoot,
	namespaces,
} from "../dom.js";

let parents = new WeakMap();

Object.assign(utils, {
	wrap(node) {
		if (node.tag) {
			return new HandcraftElement(node);
		}

		if (node.shadow) {
			return new HandcraftRoot(node);
		}

		return new HandcraftEventTarget(node);
	},
	define() {},
	create(tag, namespace) {
		let element = {tag};

		if (namespace !== namespaces.html) {
			element.namespace = namespace;
		}

		return element;
	},
	comment(content = "") {
		return {comment: content};
	},
	text(content = "") {
		return {text: content};
	},
	fragment() {
		return {fragment: true, children: []};
	},
	stylesheet: {
		create() {
			return {stylesheet: true, css: ""};
		},
		adopt(element, stylesheet) {
			element.stylesheets.push(stylesheet);
		},
		css(stylesheet, css) {
			stylesheet.css = css;
		},
	},
	observer: {
		create() {
			return {observer: true};
		},
		disconnect() {},
		observe() {},
	},
	append(element, ...children) {
		element.children ??= [];

		children = children
			.reduce((acc, child) => {
				if (child.fragment) {
					acc.push(...child.children);
				} else {
					acc.push(child);
				}

				return acc;
			}, [])
			.map((child) => {
				if (typeof child !== "object") {
					child = {text: child};
				}

				parents.set(child, element);

				return child;
			});

		element.children.push(...children);
	},
	root() {
		return {};
	},
	attr: {
		set(element, key, value) {
			element.attrs ??= {};

			if (value == null) {
				delete element.attrs[key];
			} else if (value === true || value === false) {
				element.attrs[key] = !!value;
			} else {
				element.attrs[key] = value;
			}
		},
		get(element, key) {
			return element?.attrs?.[key];
		},
	},
	class(element, key, value) {
		element.classes ??= {};

		element.classes[key] = value;
	},
	data(element, key, value) {
		element.dataset[key] = value;
	},
	find() {
		return [];
	},
	on() {},
	shadow(element, options) {
		if (!element.shadow) {
			element.shadow = {...options, children: []};
		}

		return element.shadow;
	},
	style(element, key, value) {
		element.style ??= {};

		element.style[key] = value;
	},
	next(element) {
		let parent = parents.get(element);

		if (parent) {
			let index = parent.children.findIndex((v) => v === element);

			return parent.children[index + 1];
		}
	},
	remove(element) {
		let parent = parents.get(element);

		if (parent) {
			let index = parent.children.findIndex((v) => v === element);

			parent.children.splice(index, 1);
		}
	},
	replace(current, next) {
		let parent = parents.get(current);

		if (parent) {
			let index = parent.children.findIndex((v) => v === current);

			parent.children.splice(index, 1, next);
		}

		return next;
	},
	before(element, ...children) {
		let parent = parents.get(element);

		children = children
			.reduce((acc, child) => {
				if (child.fragment) {
					acc.push(...child.children);
				} else {
					acc.push(child);
				}

				return acc;
			}, [])
			.map((child) => {
				if (typeof child !== "object") {
					child = {text: child};
				}

				parents.set(child, element);

				return child;
			});

		if (parent) {
			let index = parent.children.findIndex((v) => v === element);

			parent.children.splice(index, 1, ...children, element);
		}
	},
	content(element, content) {
		element.children = [{text: content}];
	},
	unsafe(content) {
		return {unsafe: content}; // @todo parse to array acutally here
	},
});
