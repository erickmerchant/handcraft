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
    const create = !current ||
      current?.nodeType !== Node.TEXT_NODE;

    if (create) {
      const newChild = document.createTextNode("");

      insertOrReplace(target, newChild, current);

      current = newChild;
    }

    mutate([current!], (el) => {
      const resolved = resolveValue(text);

      if (el.nodeValue !== resolved) {
        el.nodeValue = resolved;
      }
    });

    return current?.nextSibling ?? null;
  };

  node.state = new HandcraftTextState(text);

  return node;
};
