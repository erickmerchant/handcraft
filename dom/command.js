import {HandcraftEventTarget} from "./HandcraftEventTarget.js";

export function command(events, handler, options = {}) {
	events = events.split(/\s+/);

	this.on(
		"command",
		(e) => {
			if (events.includes(e.command)) {
				return handler.call(this, e);
			}
		},
		options
	);
}

HandcraftEventTarget.prototype.command = command;
