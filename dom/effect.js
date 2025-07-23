import { HandcraftNode } from "./HandcraftNode.js";
import { mutate } from "../reactivity.js";

export function effect(cb) {
	mutate(this.element, cb);

	return this;
}

HandcraftNode.prototype.effect = effect;
