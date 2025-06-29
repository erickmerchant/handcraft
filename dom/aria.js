import {env} from "../dom.js";
import {HandcraftElement} from "./HandcraftElement.js";
import {mutate} from "../reactivity.js";

export function aria(attrs) {
	for (let [key, value] of Object.entries(attrs)) {
		mutate(
			this.element,
			(element, value) => {
				env.attr(element, `aria-${key}`, value);
			},
			value
		);
	}
}

HandcraftElement.prototype.aria = aria;
