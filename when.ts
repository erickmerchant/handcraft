import type { HandcraftControlCallback } from "./mod.ts";

export type WhenAPI<N> = {
  show(cb: HandcraftControlCallback<N>): WhenAPI<N>;
  fallback(cb: HandcraftControlCallback<N>): WhenAPI<N>;
} & Iterable<HandcraftControlCallback<N>>;

export function when<N = Node>(
  cb: (prev: boolean | void) => boolean,
): WhenAPI<N> {
  let show: HandcraftControlCallback<N>;
  let fallback: HandcraftControlCallback<N> = () => {};
  let previous: boolean | void;

  return {
    show(cb: HandcraftControlCallback<N>) {
      show = cb;

      return this;
    },

    fallback(cb: HandcraftControlCallback<N>) {
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
