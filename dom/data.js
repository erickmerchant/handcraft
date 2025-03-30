import {HandcraftElement} from "../dom.js";
import {mutate} from "../reactivity.js";

export function data(data) {
	for (let [key, value] of Object.entries(data)) {
		mutate.call(
			this,
			(element, value) => {
				element.dataset[key] = value;
			},
			value
		);
	}

	return this;
}

HandcraftElement.prototype.data = data;
