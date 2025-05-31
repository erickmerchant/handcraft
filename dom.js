import {mutate} from "./reactivity.js";

export let position = {
	start: Symbol("start"),
	end: Symbol("end"),
};

function deref(val) {
	return val instanceof HandcraftEventTarget ? val.deref() : val;
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

export class HandcraftNode extends HandcraftEventTarget {
	nodes(pos, ...children) {
		let el = this.element.deref();
		let nodeToCallback = new WeakMap();
		let fragment = new DocumentFragment();

		children = children.flat(Infinity);

		for (let child of children) {
			if (!child) continue;

			if (
				child != null &&
				typeof child === "object" &&
				child[Symbol.iterator] != null
			) {
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

							result = deref(result);

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
			} else if (child != null && typeof child === "function") {
				let prev = document.createComment("");
				let prevStr = false;

				fragment.append(prev);

				prev = new WeakRef(prev);

				mutate(
					this.element,
					(_, child) => {
						child = deref(child);

						let p = prev.deref();

						if (p) {
							if (!(child instanceof Element)) {
								if (prevStr) {
									p.textContent = child;

									return;
								}

								child = document.createTextNode(child);

								prevStr = true;
							}

							p.replaceWith(child);

							prev = new WeakRef(child);
						}
					},
					child
				);
			} else {
				child = deref(child);

				fragment.append(child);
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
}

export class HandcraftElement extends HandcraftNode {
	root() {
		let el = this.element.deref();

		if (!el) {
			return;
		}

		return $(el.getRootNode());
	}

	attr(key, value) {
		mutate(
			this.element,
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
	let element = new WeakRef(create(el));

	let p = new Proxy(function () {}, {
		apply(_, __, children) {
			let el = element.deref();

			if (!el) return;

			el.nodes(position.end, ...children);

			return p;
		},
		get(_, key) {
			let el = element.deref();

			if (!el) return;

			if (key in el) {
				return typeof el[key] === "function"
					? (...args) => el[key](...args) ?? p
					: el[key];
			}

			return (...args) => {
				let el = element.deref();

				if (!el) return;

				el.attr(key, ...args);

				return p;
			};
		},
		getPrototypeOf() {
			let el = element.deref();

			if (!el) return;

			return Object.getPrototypeOf(el);
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
						let el = $(document.createElementNS(namespace, tag));

						return el(...args);
					},
					get(_, key) {
						let el = $(document.createElementNS(namespace, tag));

						return el[key];
					},
				});
			},
		}
	);
}

export let h = {
	html: factory("http://www.w3.org/1999/xhtml"),
	svg: factory("http://www.w3.org/2000/svg"),
	math: factory("http://www.w3.org/1998/Math/MathML"),
};

export function unsafe(content) {
	let div = document.createElement("div");
	let shadow = div.attachShadow({mode: "open"});

	shadow.setHTMLUnsafe(content);

	return [...shadow.childNodes];
}
