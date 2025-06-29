import {env, browser} from "../dom.js";
import {HandcraftElement} from "./HandcraftElement.js";
import {mutate} from "../reactivity.js";

browser.class = (element, key, value) => {
	element.classList.toggle(key, value);
};

export function classes(...classes) {
	classes = classes.flat(Infinity);

	for (let c of classes) {
		if (typeof c !== "object") {
			c = {[c]: true};
		}

		for (let [key, value] of Object.entries(c)) {
			mutate(
				this.element,
				(element, value) => {
					for (let k of key.split(" ")) {
						env.class(element, k, value);
					}
				},
				value
			);
		}
	}
}

HandcraftElement.prototype.classes = classes;
