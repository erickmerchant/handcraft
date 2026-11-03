import type {
  HandcraftAttrState,
  HandcraftNode,
  HandcraftValue,
} from "./types.ts";
import { recordProxy } from "./utils.ts";
import attr from "./attr.ts";

export default recordProxy<
  (
    value: HandcraftValue<string | number | boolean | null>,
  ) => HandcraftNode<HandcraftAttrState>
>((name: string) => {
  return attr[`data-${name}`];
}) as Record<
  string,
  (
    value: HandcraftValue<string | number | boolean | null>,
  ) => HandcraftNode<HandcraftAttrState>
>;
