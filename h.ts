import type { HandcraftNode, HandcraftTagFactory } from "./support.ts";
import { render } from "./render.ts";

export function h(namespace: string): HandcraftTagFactory {
  return new Proxy(
    {},
    {
      get(_, name: string) {
        return (
          ...nodes: Array<HandcraftNode>
        ) => {
          const node: HandcraftNode = (
            target: Element,
            current?: ChildNode | null,
          ): ChildNode | null => {
            const create = !current ||
              current?.nodeType !== Node.ELEMENT_NODE ||
              current?.nodeName?.toLowerCase?.() !== node.name;

            if (create) {
              const newChild = document.createElementNS(namespace, name);

              if (current) {
                current.replaceWith(newChild);
              } else {
                target.appendChild(newChild);
              }

              current = newChild;
            }

            render(node, current as Element);

            return current ?? null;
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
