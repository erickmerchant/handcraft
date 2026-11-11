import type { HandcraftNode, HandcraftValue } from "./types.ts";
import { HandcraftAttrState } from "./types.ts";
import { recordProxy, resolveValue } from "./utils.ts";
import { mutate } from "./render.ts";

export default recordProxy<
  (
    value: HandcraftValue<string | number | boolean | null>,
  ) => HandcraftNode<HandcraftAttrState>
>(
  (name: string) =>
  (
    value: HandcraftValue<string | number | boolean | null>,
  ) => {
    const node: HandcraftNode<HandcraftAttrState> = (
      target: Element,
      current?: ChildNode | null,
    ): ChildNode | null => {
      mutate<Element>(
        [target],
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

    node.state = new HandcraftAttrState(name, value);

    return node;
  },
) as Record<
  string,
  (
    value: HandcraftValue<string | number | boolean | null>,
  ) => HandcraftNode<HandcraftAttrState>
>;
