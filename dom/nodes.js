import {HandcraftNode, HandcraftElement} from "../dom.js";
import {mutate} from "../reactivity.js";

export function nodes(...children) {
	let el = this.element.deref();

	children = children.flat(Infinity);

	for (let child of children) {
		if (typeof child === "function") {
			child = [child];
		}

		if (typeof child === "object" && child[Symbol.iterator] != null) {
			let bounds = comments(this.element);

			mutate(this.element, () => {
				let [start, end] = bounds();
				let currentChild =
					start && start.nextSibling !== end ? start.nextSibling : null;
				let fragment = new DocumentFragment();

				for (let item of child) {
					if (!currentChild) {
						let result = item();
						result = derefIfElement(result);

						if (result != null) {
							fragment.append(result);
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

			el.append(result);
		}
	}

	return this;
}

HandcraftNode.prototype.nodes = nodes;

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

function comments(element) {
	element = element.deref();

	let bounds = [document.createComment(""), document.createComment("")];

	element.append(...bounds);

	bounds = bounds.map((c) => new WeakRef(c));

	return () => bounds.map((b) => b.deref());
}
