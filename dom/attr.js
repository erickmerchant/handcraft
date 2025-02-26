import {HandcraftElement} from "../dom.js";
import {mutate} from "../reactivity.js";

export function attr(key, value) {
	mutate(
		this.element,
		(element, value) => {
			if (value === true || value === false || value == null) {
				element.toggleAttribute(key, !!value);
			} else {
				element.setAttribute(key, value);
			}
		},
		value
	);

	return this;
}

HandcraftElement.prototype.attr = attr;
