import type { HandcraftNode, HandcraftValue } from "./mod.ts";
import { resolveValue } from "./mod.ts";
import { mutate } from "./render.ts";

export default new Proxy(
  {},
  {
    get(_, name: string) {
      return (value: HandcraftValue<string | number | boolean | null>) => {
        const node: HandcraftNode = (
          target: Element,
          current?: ChildNode | null,
        ): ChildNode | null => {
          mutate<Element>(
            target,
            (element) => {
              const v = resolveValue(value);

              if (v === true || v === false || v == null) {
                element.toggleAttribute(name, !!v);
              } else {
                element.setAttribute(name, `${v}`);
              }
            },
          );

          return current ?? null;
        };

        node.state = {
          type: "attr",
          name,
          value,
        };

        return node;
      };
    },
  },
) as Record<
  string,
  (
    value: HandcraftValue<string | number | boolean | null>,
  ) => HandcraftNode
>;
