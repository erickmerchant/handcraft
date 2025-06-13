import {utils} from "../dom.js";
import {HandcraftElement} from "./HandcraftElement.js";
import {mutate} from "../reactivity.js";

utils.data = (element, key, value) => {
	element.dataset[key] = value;
};

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
