import type { HandcraftNode, HandcraftValue } from "./mod.ts";
import { HandcraftNoState } from "./mod.ts";
import { resolveValue } from "./mod.ts";
import { mutate } from "./render.ts";

export default new Proxy(
  {},
  {
    get<T>(
      _: Record<
        string,
        (value: HandcraftValue<T>) => HandcraftNode<HandcraftNoState>
      >,
      name: string,
    ) {
      return (value: HandcraftValue<T>) => {
        const node: HandcraftNode<HandcraftNoState> = (
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

        node.state = new HandcraftNoState();

        return node;
      };
    },
  },
) as Record<
  string,
  (value: HandcraftValue<any>) => HandcraftNode<HandcraftNoState>
>;
