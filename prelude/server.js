import {utils} from "../dom.js";
import {utils as serverUtils} from "../utils/server.js";

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

Object.assign(utils, serverUtils);
