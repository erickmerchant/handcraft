import type { HandcraftNode } from "./types.ts";
import { render } from "./render.ts";
import { h } from "./h.ts";

export function $(
  selector: string,
  target: Element | Document | DocumentFragment = document,
): HandcraftNode {
  const node = h.html.div();

  queueMicrotask(() => {
    for (const element of target.querySelectorAll(selector)) {
      render(node, element, true);
    }
  });

  return node;
}
