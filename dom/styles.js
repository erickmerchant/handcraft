import {env, browser} from "../dom.js";
import {HandcraftElement} from "./HandcraftElement.js";
import {mutate} from "../reactivity.js";

browser.style = (element, key, value) => {
	element.style.setProperty(key, value);
};

export function styles(styles) {
	for (let [key, value] of Object.entries(styles)) {
		mutate(
			this.element,
			(element, value) => {
				env.style(element, key, value);
			},
			value
		);
	}
}

HandcraftElement.prototype.styles = styles;
