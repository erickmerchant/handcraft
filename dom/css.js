import {HandcraftRoot} from "../dom.js";
import {mutate} from "../reactivity.js";

export function css(css, options = {}) {
	let stylesheet = new CSSStyleSheet(options);
	let el = this.element.deref();

	el.adoptedStyleSheets.splice(el.adoptedStyleSheets.length, 1, stylesheet);

	mutate.call(
		this,
		(_element, css) => {
			stylesheet.replaceSync(css);
		},
		css
	);

	return this;
}

HandcraftRoot.prototype.css = css;
