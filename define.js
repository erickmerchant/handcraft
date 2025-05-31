import {h, $} from "./dom.js";

export function define(name) {
	let connected = () => {};
	let disconnected = () => {};
	let BaseClass = HTMLElement;
	let baseTag = null;

	setTimeout(() => {
		class CustomElement extends BaseClass {
			constructor() {
				super();

				this.element = $(this);
			}

			connectedCallback() {
				connected(this.element);
			}

			disconnectedCallback() {
				disconnected(this.element);
			}
		}

		let options;

		if (baseTag) {
			options = {extends: baseTag};
		}

		customElements.define(name, CustomElement, options);
	}, 0);

	let tag = h.html[name];
	let factory = {
		connected: (cb) => {
			connected = cb;

			return proxy;
		},
		disconnected: (cb) => {
			disconnected = cb;

			return proxy;
		},
		extends: (tag) => {
			BaseClass = document.createElement(tag).constructor;
			baseTag = tag;

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
