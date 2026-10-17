import type { HandcraftNode } from "./support.ts";

export default function (
  options: ShadowRootInit,
  ...nodes: Array<HandcraftNode>
): HandcraftNode {
  const node: HandcraftNode = (
    target: Element,
    current?: ChildNode | null,
  ): ChildNode | null => {
    const shadow = target.shadowRoot ?? target.attachShadow(options);
    let c = shadow.firstChild;

    for (const node of nodes) {
      c = node(shadow as unknown as Element, c);

      c = c?.nextSibling ?? null;
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
