import type { HandcraftNode, HandcraftTagFactory } from "./mod.ts";
import { insertOrReplace, render } from "./render.ts";

export function h(namespace: string): HandcraftTagFactory {
  return new Proxy(
    {},
    {
      get(_, name: string) {
        return (
          ...nodes: Array<HandcraftNode | null>
        ) => {
          const node: HandcraftNode = (
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

          node.state = {
            type: "node",
            name,
            namespace,
            nodes,
          };

          return node;
        };
      },
    },
  ) as HandcraftTagFactory;
}

export const namespace_html = "http://www.w3.org/1999/xhtml";
export const namespace_svg = "http://www.w3.org/2000/svg";
export const namespace_math = "http://www.w3.org/1998/Math/MathML";

export const html: HandcraftTagFactory = h(namespace_html);
