import {HandcraftElement, utils} from "../dom.js";
import {mutate} from "../reactivity.js";

export function aria(attrs) {
	for (let [key, value] of Object.entries(attrs)) {
		mutate(
			this.element,
			(element, value) => {
				utils.attr.set(element, `aria-${key}`, value);
			},
			value
		);
	}
}

HandcraftElement.prototype.aria = aria;
