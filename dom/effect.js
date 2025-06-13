import {HandcraftNode} from "./HandcraftNode.js";
import {mutate} from "../reactivity.js";

export function effect(cb) {
	setTimeout(() => mutate(this.element, cb), 0);
}

HandcraftNode.prototype.effect = effect;
