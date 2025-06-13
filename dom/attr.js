import {utils} from "../dom.js";
import {HandcraftNode} from "./HandcraftNode.js";
import {inEffect, watch} from "../reactivity.js";

let states = new WeakMap();
let observer;

export function attr(key) {
	let el = this.element.deref();
	let value = utils.observer.attr(el, key);

	if (!inEffect()) {
		return value;
	}

	let state = states.get(el);

	if (!state) {
		observer ??= utils.observer.create((records) => {
			for (let record of records) {
				if (record.type === "attributes") {
					let state = states.get(record.target);

					if (state) {
						state[record.attributeName] = utils.observer.attr(
							record.target,
							record.attributeName
						);
					}
				}
			}
		});

		state = watch({[key]: value});

		states.set(el, state);

		observer.observe(el, {attributes: true});
	} else if (state[key] == null) {
		state[key] = value;
	}

	return state[key];
}

HandcraftNode.prototype.attr = attr;
