import {HandcraftElement, $, utils} from "../dom.js";

export function shadow(options = {mode: "open"}) {
	let el = this.element.deref();

	if (el) {
		let shadowRoot = utils.shadow(el, options);

		return $(shadowRoot);
	}
}

HandcraftElement.prototype.shadow = shadow;
