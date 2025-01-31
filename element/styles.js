import {Element} from "../dom.js";
import {mutate} from "../reactivity.js";

Element.prototype.styles = function (styles) {
	for (let [key, value] of Object.entries(styles)) {
		mutate(
			this.element,
			(element, value) => {
				element.style.setProperty(key, value);
			},
			value
		);
	}

	return this;
};
