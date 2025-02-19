import {watch} from "./reactivity.js";

export function each(list) {
	let mapper;
	let filterer = () => true;
	let entries = [];
	let zipped = [];

	return {
		zip(collection) {
			zipped.push(collection);

			return this;
		},

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
					return mapper(
						entry,
						...zipped.map((collection) => collection[index])
					);
				};

				i++;
			}

			entries.splice(i, Infinity);
		},
	};
}
