import {
  type HandcraftNode,
  HandcraftNodeState,
  type HandcraftState,
} from "./mod.ts";
import { render } from "./render.ts";

export function $(
  selector: string,
  target: Element | Document | DocumentFragment = document,
): (
  ...nodes: Array<HandcraftNode<HandcraftState> | null>
) => void {
  return (
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
}
