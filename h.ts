import type {
  HandcraftNode,
  HandcraftState,
  HandcraftTag,
  HandcraftTagFactory,
} from "./types.ts";
import { recordProxy } from "./utils.ts";
import { HandcraftNodeState } from "./types.ts";
import { insertOrReplace, render } from "./render.ts";

export default (namespace: string): HandcraftTagFactory =>
  recordProxy<HandcraftTag>((name: string) =>
  (
    ...nodes: Array<HandcraftNode<HandcraftState> | null>
  ) => {
    const node: HandcraftNode<HandcraftNodeState> = (
      target: Element,
      current?: ChildNode | null,
      end?: ChildNode | null,
    ): ChildNode | null => {
      const create = !current ||
        current?.nodeType !== Node.ELEMENT_NODE ||
        current?.nodeName?.toLowerCase?.() !== node.state.name ||
        (current as Element)?.namespaceURI !== node.state.namespace;

      if (create) {
        const newChild = document.createElementNS(namespace, name);

        insertOrReplace(target, newChild, current, end);

        current = newChild;
      }

      render(node, current as Element);

      return current?.nextSibling ?? null;
    };

    node.state = new HandcraftNodeState(name, namespace, nodes);

    return node;
  }) as HandcraftTagFactory;
