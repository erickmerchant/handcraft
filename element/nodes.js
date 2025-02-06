import {Element} from "../dom.js";
import {mutate} from "../reactivity.js";

export function nodes(...children) {
	let el = this.element.deref();

	clear(el.firstChild);

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
						result = Element.derefIfElement(result);

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

				clear(currentChild, end);
			});
		} else {
			let result = Element.derefIfElement(child);

			el.append(result);
		}
	}

	return this;
}

Element.prototype.nodes = nodes;

function clear(currentChild, end) {
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
