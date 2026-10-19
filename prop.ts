import type { HandcraftNode, HandcraftValue } from "./mod.ts";
import { resolveValue } from "./mod.ts";
import { mutate } from "./render.ts";

export default new Proxy(
  {},
  {
    get<T>(
      _: Record<string, (value: HandcraftValue<T>) => HandcraftNode>,
      name: string,
    ) {
      return (value: HandcraftValue<T>) => {
        const node: HandcraftNode = (
          target: Element,
          current?: ChildNode | null,
        ): ChildNode | null => {
          mutate<Element>(
            target,
            (element) => {
              const v = resolveValue(value);

              if (name in element) {
                // @ts-ignore{7053}
                element[name] = v;
              }
            },
          );

          return current ?? null;
        };

        node.state = {
          type: "prop",
        };

        return node;
      };
    },
  },
) as Record<
  string,
  (value: HandcraftValue<any>) => HandcraftNode
>;
