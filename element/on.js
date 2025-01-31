import {Element} from "../dom.js";

Element.prototype.on = function (events, handler, options = {}) {
	let el = this.element.deref();

	if (el) {
		for (let event of [].concat(events)) {
			el.addEventListener(event, handler, options);
		}
	}

	return this;
};
