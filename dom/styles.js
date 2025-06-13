import {utils} from "../dom.js";
import {HandcraftElement} from "./HandcraftElement.js";
import {mutate} from "../reactivity.js";

utils.style = (element, key, value) => {
	element.style.setProperty(key, value);
};

export function styles(styles) {
	for (let [key, value] of Object.entries(styles)) {
		mutate(
			this.element,
			(element, value) => {
				utils.style(element, key, value);
			},
			value
		);
	}
}

HandcraftElement.prototype.styles = styles;
