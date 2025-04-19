import {HandcraftNode} from "../dom.js";

export function on(events, handler, options = {}) {
	let el = this.element.deref();

	if (el) {
		for (let event of events.split(/\s+/)) {
			el.addEventListener(event, handler, options);
		}
	}

	return this;
}

HandcraftNode.prototype.on = on;
