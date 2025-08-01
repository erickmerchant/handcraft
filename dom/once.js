import { HandcraftEventTarget } from "./HandcraftEventTarget.js";
import { on } from "./on.js";

export function once(events, handler, options = {}) {
	if (options === true || options === false) {
		options = { capture: options };
	}

	on.call(this, events, handler, { ...options, once: true });

	return this;
}

HandcraftEventTarget.prototype.once = once;
