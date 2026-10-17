import type { HandcraftNode } from "./support.ts";
import { render } from "./render.ts";
import { h, namespace_html } from "./h.ts";

export function $(
  selector: string,
  target: Element | Document | DocumentFragment = document,
): (
  ...nodes: Array<HandcraftNode>
) => void {
  return (
    ...nodes: Array<HandcraftNode>
  ) => {
    const node = h(namespace_html).div(...nodes);

    queueMicrotask(() => {
      for (const element of target.querySelectorAll(selector)) {
        render(node, element);
      }
    });
  };
}
