import { browser, env } from "../dom.js";
import { HandcraftEventTarget } from "./HandcraftEventTarget.js";

browser.on = (element, event, handler, options) => {
	element.addEventListener(event, handler, options);
};

export function on(events, handler, options = {}) {
	let el = this.element.deref();

	if (el) {
		let h = (e, ...args) => {
			let el = this.element.deref();

			if (el) {
				return handler.call(e.currentTarget, e, ...args);
			}
		};

		for (let event of events.split(/\s+/)) {
			env.on(el, event, h, options);
		}
	}
}

HandcraftEventTarget.prototype.on = on;
