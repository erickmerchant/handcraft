import {Element} from "../dom.js";
import {mutate} from "../reactivity.js";

export function text(txt) {
	mutate(
		this.element,
		(element, txt) => {
			element.textContent = txt;
		},
		txt
	);

	return this;
}

Element.prototype.text = text;
