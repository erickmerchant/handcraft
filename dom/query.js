import {HandcraftNode, $} from "../dom.js";

export function query() {
	let el = this.element.deref();

	if (!el) return;

	return {
		attr: (key) => {
			let el = this.element.deref();

			if (!el) return;

			let val = el.getAttribute(key);

			return val;
		},
		find: (query) => {
			let el = this.element.deref();

			if (!el) return;

			let results = [...el.querySelectorAll(query)];
			let index = 0;

			return new Proxy(
				{
					*[Symbol.iterator]() {
						for (let el of results.slice(index)) {
							yield $(el);

							index++;
						}
					},
				},
				{
					get(target, key) {
						return target[key] ?? (results[key] ? $(results[key]) : undefined);
					},
				}
			);
		},
	};
}

HandcraftNode.prototype.query = query;
