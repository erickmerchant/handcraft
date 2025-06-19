import {namespaces} from "../dom.js";
import {HandcraftElement} from "../dom/HandcraftElement.js";
import {HandcraftEventTarget} from "../dom/HandcraftEventTarget.js";
import {HandcraftRoot} from "../dom/HandcraftRoot.js";

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
};
