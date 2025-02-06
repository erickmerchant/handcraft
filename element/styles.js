import {Element} from "../dom.js";
import {mutate} from "../reactivity.js";

export function styles(styles) {
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
}

Element.prototype.styles = styles;
