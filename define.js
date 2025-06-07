import {h, $, utils} from "./dom.js";

utils.define = (name, CustomElement, options) => {
	customElements.define(name, CustomElement, options);
};

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

		utils.define(name, CustomElement, options);
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
			BaseClass = utils.create(tag).constructor;
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
