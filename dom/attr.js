import {HandcraftNode, utils} from "../dom.js";
import {inEffect, watch} from "../reactivity.js";

let states = new WeakMap();
let observer = utils.observer.create((records) => {
	for (let record of records) {
		if (record.type === "attributes") {
			let state = states.get(record.target);

			if (state) {
				state[record.attributeName] = record.target.getAttribute(
					record.attributeName
				);
			}
		}
	}
});

export function attr(key) {
	let el = this.element.deref();

	if (!inEffect()) {
		return utils.observer.attr(el, key);
	}

	let state = states.get(el);

	if (!state) {
		state = watch({[key]: utils.observer.attr(el, key)});

		states.set(el, state);

		observer.observe(el, {attributes: true});
	} else if (state[key] == null) {
		state[key] = utils.observer.attr(el, key);
	}

	return state[key];
}

HandcraftNode.prototype.attr = attr;
