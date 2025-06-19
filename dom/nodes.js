import {utils, position} from "../dom.js";
import {mutate} from "../reactivity.js";
import {HandcraftNode} from "./HandcraftNode.js";

export function nodes(pos, ...children) {
	let el = this.element.deref();
	let nodeToCallback = new WeakMap();
	let fragment = utils.fragment();

	children = children.flat(Infinity);

	for (let child of children) {
		if (!child) continue;

		if (
			child != null &&
			typeof child === "object" &&
			child[Symbol.iterator] != null
		) {
			let bounds = [utils.comment(), utils.comment()];

			utils.append(fragment, ...bounds);

			bounds = bounds.map((c) => new WeakRef(c));

			mutate(this.element, () => {
				let [start, end] = bounds.map((b) => b.deref());
				let currentChild =
					start && utils.next(start) !== end ? utils.next(start) : null;
				let fragment = utils.fragment();

				for (let item of child) {
					let create = !currentChild;
					let replace = !create && nodeToCallback.get(currentChild) !== item;

					if (create || replace) {
						let result = item();

						result = deref(result);

						if (result != null) {
							if (create) {
								utils.append(fragment, result);
							} else {
								currentChild = utils.replace(currentChild, result);
							}

							nodeToCallback.set(result, item);
						} else if (replace) {
							continue;
						}
					}

					currentChild =
						utils.next(currentChild) !== end ? utils.next(currentChild) : null;
				}

				utils.before(end, fragment);

				truncate(currentChild, end);
			});
		} else if (child != null && typeof child === "function") {
			let prev = utils.comment();

			utils.append(fragment, prev);

			prev = new WeakRef(prev);

			mutate(
				this.element,
				(_, child) => {
					child = deref(child);

					let p = prev.deref();

					if (p) {
						prev = new WeakRef(utils.replace(p, child ?? utils.comment()));
					}
				},
				child
			);
		} else {
			child = deref(child);

			utils.append(fragment, child);
		}
	}

	switch (pos) {
		case position.start:
			utils.append(el, fragment);
			break;

		case position.end:
			utils.append(el, fragment);
			break;
	}
}

HandcraftNode.prototype.nodes = nodes;

function deref(val) {
	return val instanceof HandcraftNode ? val.deref() : val;
}

function truncate(currentChild, end) {
	while (currentChild && currentChild !== end) {
		let nextChild = utils.next(currentChild);

		utils.remove(currentChild);

		currentChild = nextChild;
	}
}
