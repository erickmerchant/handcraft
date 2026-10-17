import type { HandcraftNode } from "./support.ts";
import { mutate } from "./render.ts";

export default function (
  value: (...args: Array<any>) => void,
): HandcraftNode {
  const node: HandcraftNode = (
    target: Element,
    current?: ChildNode | null,
  ): ChildNode | null => {
    mutate(target, value);

    return current ?? null;
  };

  node.state = {
    type: "effect",
  };

  return node;
}
