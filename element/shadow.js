import {Element, $} from "../dom.js";

Element.prototype.shadow = function (mode = "open") {
	let el = this.element.deref();

	if (el) {
		if (el.shadowRoot) {
			return $(el.shadowRoot);
		}

		el.attachShadow({mode});

		return $(el.shadowRoot);
	}
};
