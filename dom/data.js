import {HandcraftElement, utils} from "../dom.js";
import {mutate} from "../reactivity.js";

export function data(data) {
	for (let [key, value] of Object.entries(data)) {
		mutate(
			this.element,
			(element, value) => {
				utils.data(element, key, value);
			},
			value
		);
	}
}

HandcraftElement.prototype.data = data;
