import {HandcraftNode} from "../dom.js";
import {mutate} from "../reactivity.js";

export function effect(cb) {
	setTimeout(() => mutate.call(this, cb), 0);

	return this;
}

HandcraftNode.prototype.effect = effect;
