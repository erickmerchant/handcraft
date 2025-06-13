import {namespaces} from "../dom.js";
import {HandcraftElement} from "../dom/HandcraftElement.js";
import {HandcraftEventTarget} from "../dom/HandcraftEventTarget.js";
import {HandcraftRoot} from "../dom/HandcraftRoot.js";
import {registered} from "../reactivity.js";

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
	attr(element, key, value) {
		if (value === true || value === false || value == null) {
			element.toggleAttribute(key, !!value);
		} else {
			element.setAttribute(key, value);
		}
	},
	next(element) {
		return element?.nextSibling;
	},
	remove(element) {
		element.remove();

		registered.delete(element);
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

		registered.delete(current);

		return next;
	},
	before(element, child) {
		element.before(child);
	},
	content(element, content) {
		element.textContent = content;
	},
	observer: {
		create(cb) {
			return new MutationObserver(cb);
		},
		attr(element, key) {
			return element.getAttribute(key);
		},
		query(element, selector) {
			return element.querySelectorAll(selector);
		},
	},
};
