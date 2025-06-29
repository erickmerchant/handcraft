import {env, browser} from "../dom.js";
import {HandcraftRoot} from "./HandcraftRoot.js";
import {mutate} from "../reactivity.js";

browser.stylesheet = {
	create() {
		return new CSSStyleSheet();
	},
	adopt(element, stylesheet) {
		element.adoptedStyleSheets.splice(
			element.adoptedStyleSheets.length,
			1,
			stylesheet
		);
	},
	css(stylesheet, css) {
		stylesheet.replaceSync(css);
	},
};

export function css(css, options = {}) {
	let stylesheet = env.stylesheet.create();

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

	env.stylesheet.adopt(el, stylesheet);

	mutate(
		this.element,
		(_element, css) => {
			env.stylesheet.css(stylesheet, css);
		},
		css
	);
}

HandcraftRoot.prototype.css = css;
