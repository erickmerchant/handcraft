import type {
  HandcraftFragmentState,
  HandcraftNode,
  HandcraftNodeState,
  HandcraftTextState,
} from "./mod.ts";
import { HandcraftShadowState } from "./mod.ts";

export default function (
  options: ShadowRootInit,
  ...nodes: Array<
    HandcraftNode<
      HandcraftNodeState | HandcraftFragmentState | HandcraftTextState
    > | null
  >
): HandcraftNode<HandcraftShadowState> {
  const node: HandcraftNode<HandcraftShadowState> = (
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

  node.state = new HandcraftShadowState(options, nodes);

  return node;
}
