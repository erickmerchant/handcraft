import type {
  HandcraftAttrState,
  HandcraftNode,
  HandcraftValue,
} from "./mod.ts";
import { recordProxy } from "./mod.ts";
import attr from "./attr.ts";

export default recordProxy<
  (
    value: HandcraftValue<string | number | boolean | null>,
  ) => HandcraftNode<HandcraftAttrState>
>((name: string) => {
  return attr[`aria-${name}`];
}) as Record<
  string,
  (
    value: HandcraftValue<string | number | boolean | null>,
  ) => HandcraftNode<HandcraftAttrState>
>;
