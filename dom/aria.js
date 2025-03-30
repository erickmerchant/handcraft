import {HandcraftElement} from "../dom.js";
import {mutate} from "../reactivity.js";

export function aria(attrs) {
	for (let [key, value] of Object.entries(attrs)) {
		mutate.call(
			this,
			(element, value) => {
				element.setAttribute(`aria-${key}`, value);
			},
			value
		);
	}

	return this;
}

HandcraftElement.prototype.aria = aria;
