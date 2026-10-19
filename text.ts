import type { HandcraftNode, HandcraftValue } from "./mod.ts";
import { resolveValue } from "./mod.ts";
import { insertOrReplace, mutate } from "./render.ts";

export default function (
  text: HandcraftValue<string>,
): HandcraftNode {
  const node: HandcraftNode = (
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

  node.state = {
    type: "text",
    text,
  };

  return node;
}
