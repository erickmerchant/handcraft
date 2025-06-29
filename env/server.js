export * from "../prelude/all.js";
export * from "../dom/HandcraftNode.js";
export * from "../dom/HandcraftElement.js";
export * from "../dom/HandcraftRoot.js";
export * from "../define.js";
export * from "../dom.js";
export * from "../each.js";
export * from "../reactivity.js";
export * from "../when.js";

import {$, setEnv} from "../dom.js";
import {HandcraftElement} from "../dom/HandcraftElement.js";
import {HandcraftEventTarget} from "../dom/HandcraftEventTarget.js";
import {HandcraftRoot} from "../dom/HandcraftRoot.js";

let parents = new WeakMap();
let customElements = new Map();
let server = {};

setEnv(server);

server.wrap = (node) => {
	if (node.type === "element") {
		return new HandcraftElement(node);
	}

	if (node.type === "shadow") {
		return new HandcraftRoot(node);
	}

	return new HandcraftEventTarget(node);
};

server.define = (options) => {
	customElements.set(options.name, (element) => {
		this.element = $(element);

		options.connected(this.element);
	});
};

server.create = (tag) => {
	let element = {type: "element", tag};

	let customFn = customElements.get(tag);

	if (customFn) {
		customFn(element);
	}

	return element;
};

server.comment = (content = "") => {
	return {type: "comment", content};
};

server.fragment = () => {
	return {type: "fragment", children: []};
};

server.stylesheet = {
	create() {
		return {stylesheet: true, css: ""};
	},
	adopt(element, stylesheet) {
		element.stylesheets.push(stylesheet);
	},
	css(stylesheet, css) {
		stylesheet.css = css;
	},
};

server.append = (element, ...children) => {
	element.children ??= [];

	children = reduceChildren(element, children);

	element.children.push(...children);
};

server.root = () => {
	return {};
};

server.attr = (element, key, value) => {
	element.attrs ??= {};

	if (value == null) {
		delete element.attrs[key];
	} else {
		element.attrs[key] = value;
	}
};

server.class = (element, key, value) => {
	element.classes ??= {};

	element.classes[key] = value;
};

server.data = (element, key, value) => {
	element.attrs[`data-${key}`] = value;
};

server.on = () => {};

server.shadow = (element, options) => {
	if (!element.shadow) {
		element.shadow = {...options, type: "shadow", children: []};
	}

	return element.shadow;
};

server.style = (element, key, value) => {
	element.styles ??= {};

	element.styles[key] = value;
};

server.next = (element) => {
	let parent = parents.get(element);

	if (parent) {
		let index = parent.children.findIndex((v) => v === element);

		return parent.children[index + 1];
	}
};

server.remove = (element) => {
	let parent = parents.get(element);

	if (parent) {
		let index = parent.children.findIndex((v) => v === element);

		parent.children.splice(index, 1);
	}
};

server.replace = (current, next) => {
	let parent = parents.get(current);

	if (parent) {
		let index = parent.children.findIndex((v) => v === current);

		parent.children.splice(index, 1, next);
	}

	return next;
};

server.before = (element, ...children) => {
	let parent = parents.get(element);

	children = reduceChildren(element, children);

	if (parent) {
		let index = parent.children.findIndex((v) => v === element);

		parent.children.splice(index, 1, ...children, element);
	}
};

server.observer = {
	create() {
		return {observe() {}};
	},
	attr(element, key) {
		return element?.attrs?.[key];
	},
	query() {
		return [];
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
					result += " " + escape(key);
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
