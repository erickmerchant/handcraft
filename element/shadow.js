import {Element, $} from "../dom.js";

export function shadow(options = {mode: "open"}) {
	let el = this.element.deref();

	if (el) {
		if (!el.shadowRoot) {
			el.attachShadow(options);
		}

		return $(el.shadowRoot);
	}
}

Element.prototype.shadow = shadow;
