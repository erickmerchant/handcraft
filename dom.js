import {mutate} from "./reactivity.js";

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
		if (
			child != null &&
			typeof child === "object" &&
			child[Symbol.iterator] != null
		) {
			let bounds = [document.createComment(""), document.createComment("")];

			fragment.append(...bounds);

			bounds = bounds.map((c) => new WeakRef(c));

			mutate.call(this, () => {
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
			let result = derefIfElement(child) ?? "";

			if (result) {
				fragment.append(result);
			}
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
	return (typeof val === "object" || typeof val === "function") && val.deref
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

export class HandcraftEventTarget {
	constructor(element) {
		this.element = new WeakRef(element);
	}

	deref() {
		return this.element.deref();
	}
}

export class HandcraftNode extends HandcraftEventTarget {}

export class HandcraftElement extends HandcraftNode {
	root() {
		let el = this.element.deref();

		if (!el) {
			return;
		}

		return $(el.getRootNode());
	}

	attr(key, value) {
		if (value === undefined) {
			return this.element?.deref?.()?.getAttribute?.(key);
		}

		mutate.call(
			this,
			(element, value) => {
				if (value === true || value === false || value == null) {
					element.toggleAttribute(key, !!value);
				} else {
					element.setAttribute(key, value);
				}
			},
			value
		);

		return this;
	}
}

export class HandcraftRoot extends HandcraftNode {}

function create(node) {
	if (node instanceof Element) {
		return new HandcraftElement(node);
	}

	if (node instanceof ShadowRoot || node instanceof Document) {
		return new HandcraftRoot(node);
	}

	return new HandcraftEventTarget(node);
}

export function $(el) {
	const element = create(el);

	const p = new Proxy(function () {}, {
		apply(_, __, children) {
			nodes.call(element, position.end, ...children);

			return p;
		},
		get(_, key) {
			if (key in element) {
				return typeof element[key] === "function"
					? (...args) => {
							let result = element[key](...args);

							if (result === element) return p;

							return result;
					  }
					: element[key];
			}

			return (...args) => {
				element.attr(key, ...args);

				return p;
			};
		},
	});

	return p;
}

function factory(namespace) {
	return new Proxy(
		{},
		{
			get(_, tag) {
				return new Proxy(function () {}, {
					apply(_, __, args) {
						const el = $(document.createElementNS(namespace, tag));

						return el(...args);
					},
					get(_, key) {
						const el = $(document.createElementNS(namespace, tag));

						return el[key];
					},
				});
			},
		}
	);
}

export const h = {
	html: factory("http://www.w3.org/1999/xhtml"),
	svg: factory("http://www.w3.org/2000/svg"),
	math: factory("http://www.w3.org/1998/Math/MathML"),
};

export function unsafe(content) {
	const div = document.createElement("div");
	const shadow = div.attachShadow({mode: "open"});

	shadow.setHTMLUnsafe(content);

	return [...shadow.children].map((child) => $(child));
}
