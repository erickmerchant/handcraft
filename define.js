import {h, $} from "./dom.js";

export function define(name) {
	let connected = () => {};
	let disconnected = () => {};
	let baseClass = HTMLElement;
	let baseTag = null;

	setTimeout(() => {
		class CustomElement extends baseClass {
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
	let factory = {};
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

	factory.connected = (cb) => {
		connected = cb;

		return proxy;
	};

	factory.disconnected = (cb) => {
		disconnected = cb;

		return proxy;
	};

	factory.extends = (tag) => {
		baseClass = document.createElement(tag).constructor;
		baseTag = tag;

		return proxy;
	};

	return proxy;
}
