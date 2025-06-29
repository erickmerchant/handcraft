import {env, browser} from "../dom.js";
import {mutate} from "../reactivity.js";
import {HandcraftNode} from "./HandcraftNode.js";
import {registered} from "../reactivity.js";

export let position = {
	start: Symbol("start"),
	end: Symbol("end"),
};

browser.comment = (content = "") => {
	return document.createComment(content);
};

browser.fragment = () => {
	return new DocumentFragment();
};

browser.append = (element, ...children) => {
	element.append(...children);
};

browser.next = (element) => {
	return element?.nextSibling;
};

browser.remove = (element) => {
	element.remove();

	registered.delete(element);
};

browser.replace = (current, next) => {
	if (!(next instanceof Element)) {
		if (current.nodeType === 3) {
			current.textContent = next;

			return current;
		}

		next = document.createTextNode(next);
	}

	current.replaceWith(next);

	registered.delete(current);

	return next;
};

browser.before = (element, child) => {
	element.before(child);
};

export function nodes(children, pos = position.end) {
	let el = this.element.deref();
	let nodeToCallback = new WeakMap();
	let fragment = env.fragment();

	children = children.flat(Infinity);

	for (let child of children) {
		if (!child) continue;

		if (
			child != null &&
			typeof child === "object" &&
			child[Symbol.iterator] != null
		) {
			let bounds = [env.comment(), env.comment()];

			env.append(fragment, ...bounds);

			bounds = bounds.map((c) => new WeakRef(c));

			mutate(this.element, () => {
				let [start, end] = bounds.map((b) => b.deref());
				let currentChild =
					start && env.next(start) !== end ? env.next(start) : null;
				let fragment = env.fragment();

				for (let item of child) {
					let create = !currentChild;
					let replace = !create && nodeToCallback.get(currentChild) !== item;

					if (create || replace) {
						let result = item();

						result = deref(result);

						if (result != null) {
							if (create) {
								env.append(fragment, result);
							} else {
								currentChild = env.replace(currentChild, result);
							}

							nodeToCallback.set(result, item);
						} else if (replace) {
							continue;
						}
					}

					currentChild =
						env.next(currentChild) !== end ? env.next(currentChild) : null;
				}

				env.before(end, fragment);

				truncate(currentChild, end);
			});
		} else if (child != null && typeof child === "function") {
			let prev = env.comment();

			env.append(fragment, prev);

			prev = new WeakRef(prev);

			mutate(
				this.element,
				(_, child) => {
					child = deref(child);

					let p = prev.deref();

					if (p) {
						prev = new WeakRef(env.replace(p, child ?? env.comment()));
					}
				},
				child
			);
		} else {
			child = deref(child);

			env.append(fragment, child);
		}
	}

	switch (pos) {
		case position.start:
			env.append(el, fragment);
			break;

		case position.end:
			env.append(el, fragment);
			break;
	}
}

HandcraftNode.prototype.nodes = nodes;

function deref(val) {
	return val instanceof HandcraftNode ? val.deref() : val;
}

function truncate(currentChild, end) {
	while (currentChild && currentChild !== end) {
		let nextChild = env.next(currentChild);

		env.remove(currentChild);

		currentChild = nextChild;
	}
}
