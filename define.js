import {html, $} from "./dom.js";

export function define(name) {
	let connected = () => {};
	let disconnected = () => {};

	setTimeout(() => {
		class CustomElement extends HTMLElement {
			element = $(this);

			connectedCallback() {
				connected(this.element);
			}

			disconnectedCallback() {
				disconnected(this.element);
			}
		}

		customElements.define(name, CustomElement);
	}, 0);

	let factory = html[name];

	factory.connected = (cb) => {
		connected = cb;

		return factory;
	};

	factory.disconnected = (cb) => {
		disconnected = cb;

		return factory;
	};

	return factory;
}
