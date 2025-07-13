import { HandcraftNode } from "./HandcraftNode.js";
import { mutate } from "../reactivity.js";

export function effect(cb) {
	mutate(this.element, cb);
}

HandcraftNode.prototype.effect = effect;
