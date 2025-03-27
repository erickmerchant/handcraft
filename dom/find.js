import {HandcraftNode} from "../dom.js";
import {$} from "../dom.js";

export function find(selector) {
	let results = [
		...(this.element?.deref?.()?.querySelectorAll?.(selector) ?? []),
	];

	return new Proxy(
		{
			*[Symbol.iterator]() {
				for (let el of results) {
					yield $(el);
				}
			},
		},
		{
			get(target, key) {
				return target[key] ?? (results[key] ? $(results[key]) : undefined);
			},
		}
	);
}

HandcraftNode.prototype.find = find;
