import {HandcraftNode, $} from "../dom.js";
import {watch} from "../reactivity.js";

export function observe() {
	let el = this.element.deref();

	if (!el) return;

	let attributes = {};

	for (let attr of el?.getAttributeNames?.() ?? []) {
		attributes[attr] = el.getAttribute(attr);
	}

	attributes = watch(attributes);

	let queries = {};
	let observer = new MutationObserver((records) => {
		let el = this.element.deref();

		if (el == null) {
			observer.disconnect();

			return;
		}

		for (let record of records) {
			if (record.type === "attributes" && record.target === el) {
				attributes[record.attributeName] = el.getAttribute(
					record.attributeName
				);
			}

			if (record.type === "childList") {
				for (let query of Object.keys(queries)) {
					for (let result of el.querySelectorAll(query)) {
						if ([...record.addedNodes].includes(result)) {
							queries[query].push(result);
						}
					}
				}
			}
		}
	});

	observer.observe(el, {attributes: true, childList: true, subtree: true});

	return {
		attr: (key) => {
			let el = this.element.deref();

			if (!el) return;

			let val = attributes[key];

			if (val == null) {
				val = el.getAttribute(key);

				attributes[key] = val;
			}

			return val;
		},
		find: (query) => {
			let el = this.element.deref();

			if (!el) return;

			let results = [...el.querySelectorAll(query)];
			let index = 0;

			queries[query] = watch(results);

			return new Proxy(
				{
					*[Symbol.iterator]() {
						for (let el of queries[query].slice(index)) {
							yield $(el);

							index++;
						}
					},
				},
				{
					get(target, key) {
						return (
							target[key] ??
							(queries[query][key] ? $(queries[query][key]) : undefined)
						);
					},
				}
			);
		},
	};
}

HandcraftNode.prototype.observe = observe;
