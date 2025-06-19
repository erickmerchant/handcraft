import {$} from "../dom.js";
import {HandcraftElement} from "../dom/HandcraftElement.js";
import {HandcraftEventTarget} from "../dom/HandcraftEventTarget.js";
import {HandcraftRoot} from "../dom/HandcraftRoot.js";

let parents = new WeakMap();
let customElements = new Map();

export let utils = {
	wrap(node) {
		if (node.type === "element") {
			return new HandcraftElement(node);
		}

		if (node.type === "shadow") {
			return new HandcraftRoot(node);
		}

		return new HandcraftEventTarget(node);
	},
	define(options) {
		customElements.set(options.name, (element) => {
			this.element = $(element);

			options.connected(this.element);
		});
	},
	create(tag) {
		let element = {type: "element", tag};

		let customFn = customElements.get(tag);

		if (customFn) {
			customFn(element);
		}

		return element;
	},
	comment(content = "") {
		return {type: "comment", content};
	},
	fragment() {
		return {type: "fragment", children: []};
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
	append(element, ...children) {
		element.children ??= [];

		children = reduceChildren(element, children);

		element.children.push(...children);
	},
	root() {
		return {};
	},
	attr(element, key, value) {
		element.attrs ??= {};

		if (value == null) {
			delete element.attrs[key];
		} else {
			element.attrs[key] = value;
		}
	},
	class(element, key, value) {
		element.classes ??= {};

		element.classes[key] = value;
	},
	data(element, key, value) {
		element.attrs[`data-${key}`] = value;
	},
	on() {},
	shadow(element, options) {
		if (!element.shadow) {
			element.shadow = {...options, type: "shadow", children: []};
		}

		return element.shadow;
	},
	style(element, key, value) {
		element.styles ??= {};

		element.styles[key] = value;
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

		children = reduceChildren(element, children);

		if (parent) {
			let index = parent.children.findIndex((v) => v === element);

			parent.children.splice(index, 1, ...children, element);
		}
	},
	observer: {
		create() {
			return {observe() {}};
		},
		attr(element, key) {
			return element?.attrs?.[key];
		},
		query() {
			return [];
		},
	},
};

function reduceChildren(element, children) {
	return children
		.reduce((acc, child) => {
			if (child.type === "fragment") {
				acc.push(...child.children);
			} else {
				acc.push(child);
			}

			return acc;
		}, [])
		.map((child) => {
			if (typeof child !== "object") {
				child = {type: "text", content: child};
			}

			parents.set(child, element);

			return child;
		});
}
