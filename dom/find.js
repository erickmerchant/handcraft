import {HandcraftNode, $, utils} from "../dom.js";
import {inEffect, watch} from "../reactivity.js";

let queries = new WeakMap();
let observer;

export function find(selector) {
	selector = `:scope ${selector}`;

	let el = this.element.deref();
	let result = [...utils.observer.query(el, selector)];

	if (!inEffect()) {
		return result.map((r) => $(r));
	}

	let results = queries.get(el);

	if (!results) {
		observer ??= utils.observer.create((records) => {
			for (let record of records) {
				if (record.type === "childList") {
					let results = queries.get(record.target);

					if (results) {
						for (let selector of Object.keys(results)) {
							for (let result of utils.observer.query(
								record.target,
								selector
							)) {
								if ([...record.addedNodes].includes(result)) {
									results[selector] = [...results[selector], result];
								}
							}
						}
					}
				}
			}
		});

		results = watch({[selector]: result});

		queries.set(el, results);

		observer.observe(el, {childList: true, subtree: true});
	} else if (results[selector] == null) {
		results[selector] = result;
	}

	return results[selector].splice(0, Infinity).map((r) => $(r));
}

HandcraftNode.prototype.find = find;
