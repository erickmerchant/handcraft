import {HandcraftEventTarget} from "../dom.js";
import {on} from "./on.js";

export function once(events, handler, options = {}) {
	if (options === true || options === false) {
		options = {capture: options};
	}

	return on.call(this, events, handler, {...options, once: true});
}

HandcraftEventTarget.prototype.once = once;
