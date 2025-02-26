import {watch} from "./reactivity.js";

export function each(list) {
	let mapper;
	let filterer = () => true;
	let entries = [];

	return {
		map(cb) {
			mapper = cb;

			return this;
		},

		filter(cb) {
			filterer = cb;

			return this;
		},

		*[Symbol.iterator]() {
			let i = 0;

			for (let [index, value] of list.entries()) {
				if (!filterer({value, index})) {
					continue;
				}

				let entry = entries[i];

				if (!entry) {
					entry = watch({});

					entries.push(entry);
				}

				if (value !== entry.value) {
					entry.value = value;
				}

				entry.index = index;

				yield () => {
					return mapper(entry);
				};

				i++;
			}

			entries.splice(i, Infinity);
		},
	};
}
