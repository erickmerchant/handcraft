import type { HandcraftNode, HandcraftValue } from "./types.ts";
import { HandcraftNoState } from "./types.ts";
import { recordProxy, resolveValue } from "./utils.ts";
import { mutate } from "./render.ts";

export default recordProxy<
  (value: HandcraftValue<any>) => HandcraftNode<HandcraftNoState>
>(<T>(
  name: string,
) =>
(value: HandcraftValue<T>) => {
  const node: HandcraftNode<HandcraftNoState> = (
    target: Element,
    current?: ChildNode | null,
  ): ChildNode | null => {
    mutate<Element>(
      [target],
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
}) as Record<
  string,
  (value: HandcraftValue<any>) => HandcraftNode<HandcraftNoState>
>;
