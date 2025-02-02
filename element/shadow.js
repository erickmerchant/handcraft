import {Element, $} from "../dom.js";

Element.prototype.shadow = function (options = {mode: "open"}) {
	let el = this.element.deref();

	if (el) {
		if (el.shadowRoot) {
			return $(el.shadowRoot);
		}

		el.attachShadow(options);

		return $(el.shadowRoot);
	}
};
