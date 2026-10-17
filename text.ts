import type { HandcraftNode, HandcraftValue } from "./support.ts";
import { resolveValue } from "./support.ts";
import { mutate } from "./render.ts";

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

        if (current) {
          current.replaceWith(newChild);
        } else {
          target.appendChild(newChild);
        }

        current = newChild;
      } else if (current && current.nodeValue !== resolved) {
        current.nodeValue = resolved;
      }
    });

    return current ?? null;
  };

  node.state = {
    type: "text",
    text,
  };

  return node;
}
