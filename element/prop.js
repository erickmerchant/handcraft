import {Element} from "../dom.js";
import {mutate} from "../reactivity.js";

export function prop(key, value) {
	mutate(
		this.element,
		(element, value) => {
			element[key] = value;
		},
		value
	);

	return this;
}

Element.prototype.prop = prop;
