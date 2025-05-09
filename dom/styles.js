import {HandcraftElement} from "../dom.js";
import {mutate} from "../reactivity.js";

export function styles(styles) {
	for (let [key, value] of Object.entries(styles)) {
		mutate.call(
			this,
			(element, value) => {
				element.style.setProperty(key, value);
			},
			value
		);
	}
}

HandcraftElement.prototype.styles = styles;
