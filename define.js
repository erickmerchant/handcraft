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

	let factory = {};

	factory.connected = (cb) => {
		connected = cb;

		return factory;
	};

	factory.disconnected = (cb) => {
		disconnected = cb;

		return factory;
	};

	factory.extends = (tag) => {
		baseClass = document.createElement(tag).constructor;
		baseTag = tag;

		return factory;
	};

	return factory;
}
