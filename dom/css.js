import {HandcraftRoot} from "../dom.js";
import {mutate} from "../reactivity.js";

export function css(css, options = {}) {
	let stylesheet = new CSSStyleSheet();

	for (let prop of ["media", "disabled"]) {
		if (options[prop]) {
			mutate.call(
				this,
				(stylesheet, val) => {
					stylesheet[prop] = val;
				},
				options[prop]
			);
		}
	}

	let el = this.element.deref();

	el.adoptedStyleSheets.splice(el.adoptedStyleSheets.length, 1, stylesheet);

	mutate.call(
		this,
		(_element, css) => {
			stylesheet.replaceSync(css);
		},
		css
	);
}

HandcraftRoot.prototype.css = css;
