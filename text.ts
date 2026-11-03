import type { HandcraftNode, HandcraftValue } from "./types.ts";
import { HandcraftTextState } from "./types.ts";
import { resolveValue } from "./utils.ts";
import { insertOrReplace, mutate } from "./render.ts";

export default (
  text: HandcraftValue<string>,
): HandcraftNode<HandcraftTextState> => {
  const node: HandcraftNode<HandcraftTextState> = (
    target: Element,
    current?: ChildNode | null,
  ): ChildNode | null => {
    mutate(target, () => {
      const create = !current ||
        current?.nodeType !== Node.TEXT_NODE;
      const resolved = resolveValue(text);

      if (create) {
        const newChild = document.createTextNode(resolved);

        insertOrReplace(target, newChild, current);

        current = newChild;
      } else if (current && current.nodeValue !== resolved) {
        current.nodeValue = resolved;
      }
    });

    return current?.nextSibling ?? null;
  };

  node.state = new HandcraftTextState(text);

  return node;
};
