import {Element} from "../dom.js";

export function on(events, handler, options = {}) {
	let el = this.element.deref();

	if (el) {
		for (let event of [].concat(events)) {
			el.addEventListener(event, handler, options);
		}
	}

	return this;
}

Element.prototype.on = on;
