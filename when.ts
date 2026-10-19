import type { HandcraftControlCallback, HandcraftNode } from "./mod.ts";
import { controlCallback } from "./render.ts";

export type WhenAPI =
  & HandcraftNode
  & ({
    show(cb: HandcraftControlCallback): WhenAPI;
    fallback(cb: HandcraftControlCallback): WhenAPI;
  })
  & Iterable<HandcraftControlCallback>;

export default function (cb: (prev: boolean | void) => boolean): WhenAPI {
  let show: HandcraftControlCallback;
  let fallback: HandcraftControlCallback = () => null;
  let previous: boolean | void;

  const iterable = {
    [Symbol.iterator]: function* () {
      const current = cb(previous);

      yield current ? show : fallback;

      previous = current;
    },
  };

  const node = controlCallback(iterable) as WhenAPI;

  node.state = {
    type: "fragment",
  };

  node.show = (cb: HandcraftControlCallback) => {
    show = cb;

    return node;
  };

  node.fallback = (cb: HandcraftControlCallback) => {
    fallback = cb;

    return node;
  };

  node[Symbol.iterator] = iterable[Symbol.iterator];

  return node;
}
