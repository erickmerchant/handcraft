export function when<T>(
  cb: (prev: boolean | void) => boolean,
): HandcraftWhenAPI {
  let show: HandcraftControlCallback;
  let fallback: HandcraftControlCallback = () => {};
  let previous: boolean | void;

  return {
    show(cb: HandcraftControlCallback) {
      show = cb;

      return this;
    },

    fallback(cb: HandcraftControlCallback) {
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
