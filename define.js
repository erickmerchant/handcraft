import {h, $, env, browser} from "./dom.js";

browser.define = (options) => {
	customElements.define(
		options.name,
		class extends (options.extends
			? env.create(options.extends).constructor
			: HTMLElement) {
			connectedCallback() {
				options.connected($(this));
			}

			disconnectedCallback() {
				options.disconnected($(this));
			}
		},
		options.extends ? {extends: options.extends} : null
	);
};

export function define(name) {
	let options = {
		name,
		connected: () => {},
		disconnected: () => {},
	};

	queueMicrotask(() => {
		env.define(options);
	});

	let tag = h.html[name];
	let factory = {
		connected: (cb) => {
			options.connected = cb;

			return proxy;
		},
		disconnected: (cb) => {
			options.disconnected = cb;

			return proxy;
		},
		extends: (name) => {
			options.extends = name;

			return proxy;
		},
	};
	let proxy = new Proxy(function () {}, {
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
