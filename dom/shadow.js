import { $, browser, env } from "../dom.js";
import { HandcraftElement } from "./HandcraftElement.js";

browser.shadow = (element, options) => {
	if (!element.shadowRoot) {
		element.attachShadow(options);
	}

	return element.shadowRoot;
};

export function shadow(options = { mode: "open" }) {
	const el = this.element.deref();

	if (el) {
		const shadowRoot = env.shadow(el, options);

		return $(shadowRoot);
	}
}

HandcraftElement.prototype.shadow = shadow;
