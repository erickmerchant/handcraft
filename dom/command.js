import { HandcraftEventTarget } from "./HandcraftEventTarget.js";

export function command(commands, handler, options = {}) {
	commands = commands.split(/\s+/);

	this.on(
		"command",
		(e) => {
			if (commands.includes(e.command)) {
				return handler.call(this, e);
			}
		},
		options,
	);
}

HandcraftEventTarget.prototype.command = command;
