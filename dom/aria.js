import { HandcraftElement } from "./HandcraftElement.js";

export function aria(attrs) {
	for (let [key, value] of Object.entries(attrs)) {
		this._attr(`aria-${key}`, value);
	}

	return this;
}

HandcraftElement.prototype.aria = aria;
