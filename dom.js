import {utils as browserUtils} from "./utils/browser.js";

export let namespaces = {
	html: "http://www.w3.org/1999/xhtml",
	svg: "http://www.w3.org/2000/svg",
	math: "http://www.w3.org/1998/Math/MathML",
};

export let utils = {};

Object.assign(utils, browserUtils);

export let position = {
	start: Symbol("start"),
	end: Symbol("end"),
};

export function $(el) {
	let element = utils.wrap(el);

	let p = new Proxy(function () {}, {
		apply(_, __, children) {
			element._nodes(position.end, ...children);

			return p;
		},
		get(_, key) {
			if (key === "then") {
				return;
			}

			if (key in element) {
				return typeof element[key] === "function"
					? (...args) => element[key](...args) ?? p
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
				return new Proxy(function () {}, {
					apply(_, __, args) {
						let el = $(utils.create(tag, namespace));

						return el(...args);
					},
					get(_, key) {
						let el = $(utils.create(tag, namespace));

						return el[key];
					},
				});
			},
		}
	);
}

export let h = {
	html: factory(namespaces.html),
	svg: factory(namespaces.svg),
	math: factory(namespaces.math),
};
