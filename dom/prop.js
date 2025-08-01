import { HandcraftNode } from "./HandcraftNode.js";
import { mutate } from "../reactivity.js";

export function prop(key, value) {
	mutate(
		this.element,
		(element, value) => {
			element[key] = value;
		},
		value,
	);

	return this;
}

HandcraftNode.prototype.prop = prop;
