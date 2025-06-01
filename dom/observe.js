import {HandcraftNode, $, utils} from "../dom.js";
import {watch} from "../reactivity.js";

export function observe() {
	let el = this.element.deref();
	let attributes = {};

	for (let attr of el?.getAttributeNames?.() ?? []) {
		attributes[attr] = utils.attr.get(el, attr);
	}

	attributes = watch(attributes);

	let queries = {};
	let observer = utils.observer.create((records) => {
		let el = this.element.deref();

		if (!el) {
			utils.observer.disconnect(observer);

			return;
		}

		for (let record of records) {
			if (record.type === "attributes" && record.target === el) {
				attributes[record.attributeName] = utils.attr.get(
					el,
					record.attributeName
				);
			}

			if (record.type === "childList") {
				for (let query of Object.keys(queries)) {
					for (let result of utils.find(el, query)) {
						if ([...record.addedNodes].includes(result)) {
							queries[query].push(result);
						}
					}
				}
			}
		}
	});

	utils.observer.observe(observer, el);

	return {
		attr: (key) => {
			let el = this.element.deref();

			if (!el) {
				return;
			}

			let val = attributes[key];

			if (val == null) {
				val = utils.attr.get(el, key);

				attributes[key] = val;
			}

			return val;
		},
		find: (query) => {
			let el = this.element.deref();

			if (!el) {
				return;
			}

			let results = [...utils.find(el, query)];
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
