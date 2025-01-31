import {Element} from "../dom.js";
import {mutate} from "../reactivity.js";

Element.prototype.prop = function (key, value) {
	mutate(
		this.element,
		(element, value) => {
			element[key] = value;
		},
		value
	);

	return this;
};
