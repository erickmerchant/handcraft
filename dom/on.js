import {HandcraftEventTarget} from "../dom.js";

export function on(events, handler, options = {}) {
	let el = this.element.deref();

	if (el) {
		for (let event of events.split(/\s+/)) {
			el.addEventListener(
				event,
				(e, ...args) => {
					let el = this.element.deref();

					if (el) {
						return handler.call(e.currentTarget, e, ...args);
					}
				},
				options
			);
		}
	}
}

HandcraftEventTarget.prototype.on = on;
