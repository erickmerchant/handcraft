import {HandcraftNode} from "../dom.js";
import {mutate} from "../reactivity.js";

export function text(txt) {
	if (txt === undefined) {
		return this.element?.deref?.()?.textContent;
	}

	mutate(
		this.element,
		(element, txt) => {
			element.textContent = txt;
		},
		txt
	);

	return this;
}

HandcraftNode.prototype.text = text;
