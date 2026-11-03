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
  const node = (_target: Element, current?: ChildNode | null) => current;

  node.state = new HandcraftNodeState("div", "", nodes);

  queueMicrotask(() => {
    for (const element of target.querySelectorAll(selector)) {
      render(node as HandcraftNode<HandcraftNodeState>, element);
    }
  });
};
