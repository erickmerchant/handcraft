import {HandcraftRoot, utils} from "../dom.js";
import {mutate} from "../reactivity.js";

export function css(css, options = {}) {
	let stylesheet = utils.stylesheet.create();

	for (let prop of ["media"]) {
		if (options[prop]) {
			mutate(
				this.element,
				(stylesheet, val) => {
					stylesheet[prop] = val;
				},
				options[prop]
			);
		}
	}

	let el = this.element.deref();

	utils.stylesheet.adopt(el, stylesheet);

	mutate(
		this.element,
		(_element, css) => {
			utils.stylesheet.css(stylesheet, css);
		},
		css
	);
}

HandcraftRoot.prototype.css = css;
