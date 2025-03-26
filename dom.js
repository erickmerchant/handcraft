export class HandcraftNode {
	constructor(element) {
		this.element = new WeakRef(element);
	}

	deref() {
		return this.element.deref();
	}
}

export class HandcraftElement extends HandcraftNode {}

export class HandcraftRoot extends HandcraftNode {}

export function $(node) {
	if (node instanceof Element) return new HandcraftElement(node);

	if (node instanceof ShadowRoot || node instanceof Document)
		return new HandcraftRoot(node);

	return new HandcraftNode(node);
}

function h(default_tag, namespace = "http://www.w3.org/1999/xhtml") {
	let create = (tag) => () => {
		let element = document.createElementNS(namespace, tag);

		return $(element);
	};

	return new Proxy(default_tag ? create(default_tag) : {}, {
		get(_, tag) {
			return create(tag);
		},
	});
}

export let html = h();
export let svg = h("svg", "http://www.w3.org/2000/svg");
export let math = h("math", "http://www.w3.org/1998/Math/MathML");

HandcraftNode.prototype.root = function () {
	let el = this.element.deref();

	if (!el) return;

	return $(el.getRootNode());
};
