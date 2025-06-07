import {HandcraftElement, $, utils} from "../dom.js";

utils.shadow = (element, options) => {
	if (!element.shadowRoot) {
		element.attachShadow(options);
	}

	return element.shadowRoot;
};

export function shadow(options = {mode: "open"}) {
	let el = this.element.deref();

	if (el) {
		let shadowRoot = utils.shadow(el, options);

		return $(shadowRoot);
	}
}

HandcraftElement.prototype.shadow = shadow;
