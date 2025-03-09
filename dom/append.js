import {HandcraftNode, HandcraftElement} from "../dom.js";
import {mutate} from "../reactivity.js";

export let position = {
	start: Symbol("start"),
	end: Symbol("end"),
};

export function nodes(pos, ...children) {
	let el = this.element.deref();
	let nodeToCallback = new WeakMap();
	let fragment = new DocumentFragment();

	children = children.flat(Infinity);

	for (let child of children) {
		if (typeof child === "object" && child[Symbol.iterator] != null) {
			let bounds = [document.createComment(""), document.createComment("")];

			fragment.append(...bounds);

			bounds = bounds.map((c) => new WeakRef(c));

			mutate(this.element, () => {
				let [start, end] = bounds.map((b) => b.deref());
				let currentChild =
					start && start.nextSibling !== end ? start.nextSibling : null;
				let fragment = new DocumentFragment();

				for (let item of child) {
					let create = !currentChild;
					let replace = !create && nodeToCallback.get(currentChild) !== item;

					if (create || replace) {
						let result = item();

						result = derefIfElement(result);

						if (result != null) {
							if (create) {
								fragment.append(result);
							} else {
								currentChild.replaceWith(result);

								currentChild = result;
							}

							nodeToCallback.set(result, item);
						} else if (replace) {
							continue;
						}
					}

					currentChild =
						currentChild?.nextSibling !== end
							? currentChild?.nextSibling
							: null;
				}

				end.before(fragment);

				truncate(currentChild, end);
			});
		} else {
			let result = derefIfElement(child);

			fragment.append(result);
		}
	}

	switch (pos) {
		case position.start:
			el.prepend(fragment);
			break;

		case position.end:
			el.append(fragment);
			break;
	}

	return this;
}

function derefIfElement(val) {
	return typeof val === "object" && val instanceof HandcraftElement
		? val.deref()
		: val;
}

function truncate(currentChild, end) {
	while (currentChild && currentChild !== end) {
		let nextChild = currentChild.nextSibling;

		currentChild.remove();

		currentChild = nextChild;
	}
}

export function append(...children) {
	return nodes.call(this, position.end, ...children);
}

HandcraftNode.prototype.append = append;
