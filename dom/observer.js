import {utils} from "../dom.js";

utils.observer = {
	create(cb) {
		return new MutationObserver(cb);
	},
	attr(element, key) {
		return element.getAttribute(key);
	},
	query(element, selector) {
		return element.querySelectorAll(selector);
	},
};
