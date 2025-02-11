import {Element} from "../dom.js";
import {mutate} from "../reactivity.js";

export function effect(cb) {
	mutate(this.element, cb);

	return this;
}

Element.prototype.effect = effect;
