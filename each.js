import {watch} from "./reactivity.js";

export function each(list) {
	let mapper;
	let filterer = () => true;
	let views = [];

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

			for (let [index, item] of list.entries()) {
				if (!filterer({item, index})) {
					continue;
				}

				let view = views[i];

				if (!view) {
					view = watch({});

					views.push(view);
				}

				if (item !== view.item) {
					view.item = item;
				}

				view.index = index;

				yield () => {
					return mapper(view);
				};

				i++;
			}

			views.splice(i, Infinity);
		},
	};
}
