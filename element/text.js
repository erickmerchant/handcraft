import {Element} from "../dom.js";
import {mutate} from "../reactivity.js";

Element.prototype.text = function (txt) {
	mutate(
		this.element,
		(element, txt) => {
			element.textContent = txt;
		},
		txt
	);

	return this;
};
