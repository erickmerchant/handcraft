import type { HandcraftNode } from "./mod.ts";

export default function (
  options: ShadowRootInit,
  ...nodes: Array<HandcraftNode | null>
): HandcraftNode {
  const node: HandcraftNode = (
    target: Element,
    current?: ChildNode | null,
  ): ChildNode | null => {
    const shadow = target.shadowRoot ?? target.attachShadow(options);
    let c = shadow.firstChild;

    for (const node of nodes) {
      if (!node) continue;

      c = node(shadow as unknown as Element, c);
    }

    return current ?? null;
  };

  node.state = {
    type: "shadow",
    options,
    nodes,
  };

  return node;
}
