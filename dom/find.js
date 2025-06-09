import {HandcraftNode, $, utils} from "../dom.js";
import {inEffect, watch} from "../reactivity.js";

let queries = new WeakMap();
let observer;

export function find(selector) {
	observer ??= utils.observer.create((records) => {
		for (let record of records) {
			if (record.type === "childList") {
				let results = queries.get(record.target);

				if (results) {
					for (let selector of Object.keys(results)) {
						for (let result of record.target.querySelectorAll(selector)) {
							if ([...record.addedNodes].includes(result)) {
								results[selector] = [...results[selector], result];
							}
						}
					}
				}
			}
		}
	});

	selector = `:scope ${selector}`;

	let el = this.element.deref();

	if (!inEffect()) {
		return [...utils.observer.query(el, selector)].map((r) => $(r));
	}

	let results = queries.get(el);

	if (!results) {
		results = watch({[selector]: [...utils.observer.query(el, selector)]});

		queries.set(el, results);

		observer.observe(el, {childList: true, subtree: true});
	} else if (results[selector] == null) {
		results[selector] = [...utils.observer.query(el, selector)];
	}

	return results[selector].splice(0, Infinity).map((r) => $(r));
}

HandcraftNode.prototype.find = find;
