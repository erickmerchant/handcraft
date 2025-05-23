export class HandcraftEventTarget {
	constructor(element) {
		this.element = new WeakRef(element);
	}
}

export class HandcraftNode extends HandcraftEventTarget {}

export class HandcraftElement extends HandcraftNode {}

export class HandcraftRoot extends HandcraftNode {}

export function $(node) {
	if (node instanceof Element) {
		return new HandcraftElement(node);
	}

	if (node instanceof ShadowRoot || node instanceof Document) {
		return new HandcraftRoot(node);
	}

	return new HandcraftEventTarget(node);
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

export let html = h("html");
export let svg = h("svg", "http://www.w3.org/2000/svg");
export let math = h("math", "http://www.w3.org/1998/Math/MathML");

export function unsafe(content) {
	let div = document.createElement("div");
	let shadow = div.attachShadow({mode: "open"});

	shadow.setHTMLUnsafe(content);

	return [...shadow.children].map((child) => $(child));
}

function init() {
	HandcraftEventTarget.prototype.deref = function () {
		return this.element.deref();
	};

	HandcraftElement.prototype.root = function () {
		let el = this.element.deref();

		if (!el) {
			return;
		}

		return $(el.getRootNode());
	};
}

export function reset() {
	for (let proto of [
		HandcraftEventTarget.prototype,
		HandcraftNode.prototype,
		HandcraftElement.prototype,
		HandcraftRoot.prototype,
	]) {
		for (let key in proto) {
			delete proto[key];
		}
	}

	init();
}

init();
