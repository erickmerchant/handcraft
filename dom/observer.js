import {browser} from "../dom.js";

browser.observer = {
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
