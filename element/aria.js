import {Element} from "../dom.js";
import {mutate} from "../reactivity.js";

export function aria(attrs) {
	for (let [key, value] of Object.entries(attrs)) {
		mutate(
			this.element,
			(element, value) => {
				element.setAttribute(`aria-${key}`, value);
			},
			value
		);
	}

	return this;
}

Element.prototype.aria = aria;
