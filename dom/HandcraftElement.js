import {$, env} from "../dom.js";
import {mutate} from "../reactivity.js";
import {HandcraftNode} from "./HandcraftNode.js";

export class HandcraftElement extends HandcraftNode {
	root() {
		let el = this.element.deref();

		if (!el) {
			return;
		}

		return $(env.root(el));
	}

	_attr(key, value) {
		mutate(
			this.element,
			(element, value) => {
				env.attr(element, key, value);
			},
			value
		);

		return this;
	}
}
