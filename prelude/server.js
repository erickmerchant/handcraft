import {
	utils,
	HandcraftElement,
	HandcraftEventTarget,
	HandcraftRoot,
	namespaces,
	$,
} from "../dom.js";

const VOID_ELEMENTS = [
	"area",
	"base",
	"br",
	"col",
	"embed",
	"hr",
	"img",
	"input",
	"link",
	"meta",
	"param",
	"source",
	"track",
	"wbr",
];

function escape(str) {
	return `${str}`.replace(/[&<>"']/g, (k) => {
		return {
			"&": "&amp;",
			"<": "&lt;",
			">": "&gt;",
			'"': "&quot;",
			"'": "&#39;",
		}[k];
	});
}

export function render(node) {
	if (node.type === "comment") {
		return "<!-- " + escape(node.content) + " -->";
	}

	if (node.type === "text") {
		return escape(node.content);
	}

	let result = "";

	if (node.type === "element") {
		result += "<" + node.tag;

		if (node.attrs) {
			for (let [key, value] of Object.entries(node.attrs)) {
				if (value === true) {
					result += " " + key;
				} else if (value !== false && value != null) {
					result += " " + escape(key) + "='" + escape(value) + "'";
				}
			}
		}

		if (node.classes) {
			result +=
				" class='" +
				Object.entries(node.classes)
					.map(([key, value]) => (value ? escape(key) : null))
					.filter((c) => c != null)
					.join(" ") +
				"'";
		}

		if (node.styles) {
			result +=
				" style='" +
				Object.entries(node.styles)
					.map(([key, value]) => `${escape(key)}: ${escape(value)}`)
					.join("; ") +
				"'";
		}

		result += ">";

		if (node.stylesheets) {
			for (let stylesheet of stylesheets) {
				result += "<style";

				if (stylesheet.media) {
					result += " media='" + stylesheet.media + "'";
				}

				result += ">" + escape(stylesheet.css) + "</style>";
			}
		}

		if (node.shadow) {
			result +=
				"<template shadowrootmode='" + (node.shadow.mode ?? "open") + "'>";

			for (let child of node.shadow.children) {
				result += render(child);
			}

			result += "</template>";
		}
	}

	if (node.children) {
		for (let child of node.children) {
			result += render(child);
		}
	}

	if (node.type === "element") {
		if (!VOID_ELEMENTS.includes(node.tag)) {
			result += "</" + node.tag + ">";
		}
	}

	return result;
}

let parents = new WeakMap();
let elements = new Set();
let customElements = new Map();

Object.assign(utils, {
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
	create(tag, namespace) {
		let element = {type: "element", tag};

		if (namespace !== namespaces.html) {
			element.namespace = namespace;
		}

		elements.add(element);

		let customFn = customElements.get(tag);

		if (customFn) {
			customFn(element);
		}

		return element;
	},
	comment(content = "") {
		let comment = {type: "comment", content};

		elements.add(comment);

		return comment;
	},
	text(content = "") {
		let text = {type: "text", content};

		elements.add(text);

		return text;
	},
	fragment() {
		let fragment = {type: "fragment", children: []};

		elements.add(fragment);

		return fragment;
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

		children = children
			.reduce((acc, child) => {
				if (child.type === "fragment") {
					acc.push(...child.children);

					elements.delete(child);
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

		element.children.push(...children);
	},
	root() {
		return {};
	},
	attr(element, key, value) {
		element.attrs ??= {};

		if (value == null) {
			delete element.attrs[key];
		} else if (value === true || value === false) {
			element.attrs[key] = !!value;
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

		elements.delete(element);
	},
	replace(current, next) {
		let parent = parents.get(current);

		if (parent) {
			let index = parent.children.findIndex((v) => v === current);

			parent.children.splice(index, 1, next);
		}

		elements.delete(current);

		return next;
	},
	before(element, ...children) {
		let parent = parents.get(element);

		children = children
			.reduce((acc, child) => {
				if (child.type === "fragment") {
					acc.push(...child.children);

					elements.delete(child);
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

		if (parent) {
			let index = parent.children.findIndex((v) => v === element);

			parent.children.splice(index, 1, ...children, element);
		}
	},
	content(element, content) {
		if (element.type === "text") {
			element.content = content;
		} else {
			element.children = [{type: "text", content}];
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
});
