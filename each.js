import {watch} from "./reactivity.js";

export function each(list) {
	let mapper;
	let filterer = () => true;
	let fallback = () => {};
	let entries = [];
	let current;
	let show = () => {
		return mapper(current);
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
				if (!filterer({value, index})) {
					continue;
				}

				current = entries[i];

				if (!current) {
					current = watch({});

					entries.push(current);
				}

				if (value !== current.value) {
					current.value = value;
				}

				current.index = index;

				yield show;

				i++;
			}

			entries.splice(i, Infinity);
		},
	};
}
