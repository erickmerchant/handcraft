import {HandcraftEventTarget, utils} from "../dom.js";

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
			utils.on(el, event, h, options);
		}
	}
}

HandcraftEventTarget.prototype.on = on;
