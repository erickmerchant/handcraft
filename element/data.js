import {Element} from "../dom.js";
import {mutate} from "../reactivity.js";

Element.prototype.data = function (data) {
	for (let [key, value] of Object.entries(data)) {
		mutate(
			this.element,
			(element, value) => {
				element.dataset[key] = value;
			},
			value
		);
	}

	return this;
};
