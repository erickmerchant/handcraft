import type { HandcraftNode, HandcraftState } from "./mod.ts";
import { render } from "./render.ts";
import { html } from "./h.ts";

export function $(
  selector: string,
  target: Element | Document | DocumentFragment = document,
): (
  ...nodes: Array<HandcraftNode<HandcraftState> | null>
) => void {
  return (
    ...nodes: Array<HandcraftNode<HandcraftState> | null>
  ) => {
    const node = html.div(...nodes);

    queueMicrotask(() => {
      for (const element of target.querySelectorAll(selector)) {
        render(node, element);
      }
    });
  };
}
