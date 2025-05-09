import {HandcraftNode} from "../dom.js";
import {mutate} from "../reactivity.js";

export function prop(key, value) {
	mutate.call(
		this,
		(element, value) => {
			element[key] = value;
		},
		value
	);
}

HandcraftNode.prototype.prop = prop;
