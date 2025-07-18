import { $, browser, env, h } from "./dom.js";

browser.define = (options) => {
	customElements.define(
		options.name,
		class
			extends (options.extends
				? env.create(options.extends).constructor
				: HTMLElement) {
			connectedCallback() {
				options.setup($(this));
			}

			disconnectedCallback() {
				options.teardown($(this));
			}
		},
		options.extends ? { extends: options.extends } : null,
	);
};

export function define(name) {
	let options = {
		name,
		setup: () => {},
		teardown: () => {},
	};

	queueMicrotask(() => {
		env.define(options);
	});

	let tag = h.html[name];
	let factory = {
		setup: (cb) => {
			options.setup = cb;

			return proxy;
		},
		teardown: (cb) => {
			options.teardown = cb;

			return proxy;
		},
		extends: (name) => {
			options.extends = name;

			return proxy;
		},
	};
	let proxy = new Proxy(() => {}, {
		apply(_, __, children) {
			return tag(children);
		},
		get(_, key) {
			if (key in factory) {
				return factory[key];
			}

			return tag[key];
		},
	});

	return proxy;
}
