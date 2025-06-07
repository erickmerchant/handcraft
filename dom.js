import {mutate} from "./reactivity.js";

export let namespaces = {
	html: "http://www.w3.org/1999/xhtml",
	svg: "http://www.w3.org/2000/svg",
	math: "http://www.w3.org/1998/Math/MathML",
};

export let utils = {
	wrap(node) {
		if (node instanceof Element) {
			return new HandcraftElement(node);
		}

		if (node instanceof ShadowRoot || node instanceof Document) {
			return new HandcraftRoot(node);
		}

		return new HandcraftEventTarget(node);
	},
	create(tag, namespace = namespaces.html) {
		return document.createElementNS(namespace, tag);
	},
	comment(content = "") {
		return document.createComment(content);
	},
	text(content = "") {
		return document.createTextNode(content);
	},
	fragment() {
		return new DocumentFragment();
	},
	append(element, ...children) {
		element.append(...children);
	},
	root(element) {
		return element.getRootNode();
	},
	attr: {
		set(element, key, value) {
			if (value === true || value === false || value == null) {
				element.toggleAttribute(key, !!value);
			} else {
				element.setAttribute(key, value);
			}
		},
		get(element, key) {
			return element.getAttribute(key);
		},
	},
	next(element) {
		return element?.nextSibling;
	},
	remove(element) {
		element.remove();
	},
	replace(current, next) {
		if (!(next instanceof Element)) {
			if (current.nodeType === 3) {
				utils.content(current, next);

				return current;
			}

			next = utils.text(next);
		}

		current.replaceWith(next);

		return next;
	},
	before(element, child) {
		element.before(child);
	},
	content(element, content) {
		element.textContent = content;
	},
};

export let position = {
	start: Symbol("start"),
	end: Symbol("end"),
};

function deref(val) {
	return val instanceof HandcraftEventTarget ? val.deref() : val;
}

function truncate(currentChild, end) {
	while (currentChild && currentChild !== end) {
		let nextChild = utils.next(currentChild);

		utils.remove(currentChild);

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
							utils.next(currentChild) !== end
								? utils.next(currentChild)
								: null;
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

		return this;
	}
}

export class HandcraftElement extends HandcraftNode {
	root() {
		let el = this.element.deref();

		if (!el) {
			return;
		}

		return $(utils.root(el));
	}

	attr(key, value) {
		mutate(
			this.element,
			(element, value) => {
				utils.attr.set(element, key, value);
			},
			value
		);

		return this;
	}
}

export class HandcraftRoot extends HandcraftNode {}

export function $(el) {
	let element = new WeakRef(utils.wrap(el));

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

			if (key === "then") {
				return;
			}

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
			let el = element?.deref?.();

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
						let el = $(utils.create(tag, namespace));

						return el(...args);
					},
					get(_, key) {
						let el = $(utils.create(tag, namespace));

						return el[key];
					},
				});
			},
		}
	);
}

export let h = {
	html: factory(namespaces.html),
	svg: factory(namespaces.svg),
	math: factory(namespaces.math),
};
