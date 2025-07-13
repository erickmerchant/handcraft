import { watch } from "./reactivity.js";

export function each(list) {
	let mapper;
	let filterer = () => true;
	let fallback = () => {};
	let entries = [];
	let current;
	let show = () => {
		return mapper(current.value, current.index);
	};

	return {
		map(cb) {
			mapper = cb;

			return this;
		},

		filter(cb) {
			filterer = cb;

			return this;
		},

		fallback(cb) {
			fallback = cb;

			return this;
		},

		*[Symbol.iterator]() {
			let i = 0;

			if (!list.length) {
				yield fallback;
			}

			for (let [index, value] of list.entries()) {
				if (
					!filterer(
						new Proxy(() => value, {
							get(_, p) {
								return typeof value === "object"
									? Reflect.get(value, p)
									: undefined;
							},
						}),
						() => index,
					)
				) {
					continue;
				}

				current = entries[i];

				if (!current) {
					let store = watch({
						value: null,
						index,
					});

					current = {
						store,
						value: new Proxy(() => store.value, {
							get(_, p) {
								return typeof store.value === "object"
									? Reflect.get(store.value, p)
									: undefined;
							},
							set(_, p, newValue) {
								if (typeof store.value !== "object") {
									return false;
								}

								return Reflect.set(store.value, p, newValue);
							},
							deleteProperty(_, p) {
								if (typeof store.value !== "object") {
									return false;
								}

								return Reflect.deleteProperty(store.value, p);
							},
						}),
						index() {
							return store.index;
						},
					};

					entries.push(current);
				}

				if (value !== current.store.value) {
					current.store.value = value;
				}

				current.store.index = index;

				yield show;

				i++;
			}

			entries.splice(i, Infinity);
		},
	};
}
