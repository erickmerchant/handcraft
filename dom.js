export class Element {
	constructor(element) {
		this.element = new WeakRef(element);
	}

	deref() {
		return this.element.deref();
	}
}

export function $(node) {
	return new Element(node);
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
