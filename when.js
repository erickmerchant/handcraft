export function when(cb) {
	let show;
	let fallback = () => {};
	let previous;

	return {
		show(cb) {
			show = cb;

			return this;
		},

		fallback(cb) {
			fallback = cb;

			return this;
		},

		*[Symbol.iterator]() {
			const current = cb(previous);

			yield current ? show : fallback;

			previous = current;
		},
	};
}
