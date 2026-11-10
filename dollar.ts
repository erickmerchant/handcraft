import type { HandcraftNode, HandcraftState } from "./types.ts";
import { HandcraftNodeState } from "./types.ts";
import { render } from "./render.ts";

export default (
  selector: string,
  target: Element | Document | DocumentFragment = document,
): (
  ...nodes: Array<HandcraftNode<HandcraftState> | null>
) => void =>
(
  ...nodes: Array<HandcraftNode<HandcraftState> | null>
) => {
  const state = new HandcraftNodeState("", "", nodes);

  queueMicrotask(() => {
    for (const element of target.querySelectorAll(selector)) {
      render({ state } as HandcraftNode<HandcraftNodeState>, element);
    }
  });
};
