let current;
let queue = [];
let reads = new WeakMap();
let registered = new WeakSet();
let scheduled = false;

function getProperty(o, key, r) {
	if (current) {
		let callbacks = reads.get(o).get(key);

		if (!callbacks) {
			callbacks = new Set();
			reads.get(o).set(key, callbacks);
		}

		callbacks.add(current);
	}

	return Reflect.get(o, key, r);
}

function modifyProperty(o, key) {
	let callbacks = reads.get(o).get(key);

	if (callbacks) {
		for (let cb of callbacks) {
			effect(cb);
		}

		callbacks.clear();
	}
}

function setProperty(o, key, value, r) {
	modifyProperty(o, key);

	return Reflect.set(o, key, value, r);
}

function deleteProperty(o, key) {
	modifyProperty(o, key);

	return Reflect.deleteProperty(o, key);
}

export function effect(callback) {
	queue.push(callback);

	if (!scheduled) {
		scheduled = true;

		setTimeout(() => {
			scheduled = false;

			let callbacks = queue.splice(0, Infinity);
			let prev = current;

			for (let cb of callbacks) {
				current = cb;

				cb();
			}

			current = prev;
		}, 0);
	}
}

export function watch(object) {
	reads.set(object, new Map());

	return new Proxy(object, {
		set: setProperty,
		get: getProperty,
		deleteProperty,
	});
}

export function mutate(callback, value = () => {}) {
	let immediate = typeof value !== "function";
	let cb = () => {
		let el = this.element.deref();

		if (el && registered.has(el)) {
			callback(el, immediate ? value : value());
		}
	};
	let el = this.element.deref();

	if (el) {
		registered.add(el);
	}

	if (immediate) {
		cb();
	} else {
		effect(cb);
	}
}
