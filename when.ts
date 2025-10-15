import type { HandcraftControlCallback } from "./mod.ts";

type WhenAPI = {
  show(cb: HandcraftControlCallback): WhenAPI;
  fallback(cb: HandcraftControlCallback): WhenAPI;
} & Iterable<HandcraftControlCallback>;

export function when(
  cb: (prev: boolean | void) => boolean,
): WhenAPI {
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
