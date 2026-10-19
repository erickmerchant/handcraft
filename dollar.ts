import type { HandcraftNode } from "./mod.ts";
import { render } from "./render.ts";
import { h, namespace_html } from "./h.ts";

export function $(
  selector: string,
  target: Element | Document | DocumentFragment = document,
): (
  ...nodes: Array<HandcraftNode | null>
) => void {
  return (
    ...nodes: Array<HandcraftNode | null>
  ) => {
    const node = h(namespace_html).div(...nodes);

    queueMicrotask(() => {
      for (const element of target.querySelectorAll(selector)) {
        render(node, element);
      }
    });
  };
}
