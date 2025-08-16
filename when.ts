export function when<T>(cb: (prev: boolean | void) => boolean) {
  let show: () => HandcraftElement | void;
  let fallback: () => HandcraftElement | void = () => {};
  let previous: boolean | void;

  return {
    show(cb: () => HandcraftElement | void) {
      show = cb;

      return this;
    },

    fallback(cb: () => HandcraftElement | void) {
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
