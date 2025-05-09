import {HandcraftNode} from "../dom.js";
import {mutate} from "../reactivity.js";

export function text(txt) {
	mutate.call(
		this,
		(element, txt) => {
			element.textContent = txt;
		},
		txt
	);
}

HandcraftNode.prototype.text = text;
