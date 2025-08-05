import { HandcraftElement } from "./dom/HandcraftElement.js";
import { HandcraftEventTarget } from "./dom/HandcraftEventTarget.js";
import { HandcraftRoot } from "./dom/HandcraftRoot.js";

export const namespaces = {
	html: "http://www.w3.org/1999/xhtml",
	svg: "http://www.w3.org/2000/svg",
	math: "http://www.w3.org/1998/Math/MathML",
};

export const browser = {
	wrap(node) {
		if (node instanceof Element) {
			return new HandcraftElement(node);
		}

		if (node instanceof ShadowRoot || node instanceof Document) {
			return new HandcraftRoot(node);
		}

		return new HandcraftEventTarget(node);
	},
	create(tag, namespace = namespaces.html) {
		return document.createElementNS(namespace, tag);
	},
	root(element) {
		return element.getRootNode();
	},
	attr(element, key, value) {
		if (value === true || value === false || value == null) {
			element.toggleAttribute(key, !!value);
		} else {
			element.setAttribute(key, value);
		}
	},
};

export let env = browser;

export function setEnv(current) {
	env = current;
}

export function $(el) {
	const element = env.wrap(el);

	const p = new Proxy(() => {}, {
		apply(_, __, children) {
			element.nodes?.(children);

			return p;
		},
		get(_, key) {
			if (key === "then") {
				return;
			}

			if (key in element) {
				return typeof element[key] === "function"
					? (...args) => {
						const result = element[key](...args);

						if (result === element) {
							return p;
						}

						return result;
					}
					: element[key];
			}

			if (typeof key !== "string") {
				return;
			}

			return (...args) => {
				element._attr(key, ...args);

				return p;
			};
		},
		getPrototypeOf() {
			return Object.getPrototypeOf(element);
		},
	});

	return p;
}

function factory(namespace) {
	return new Proxy(
		{},
		{
			get(_, tag) {
				return new Proxy(() => {}, {
					apply(_, __, args) {
						const el = $(env.create(tag, namespace));

						return el(...args);
					},
					get(_, key) {
						const el = $(env.create(tag, namespace));

						return el[key];
					},
				});
			},
		},
	);
}

export const h = {
	html: factory(namespaces.html),
	svg: factory(namespaces.svg),
	math: factory(namespaces.math),
};
