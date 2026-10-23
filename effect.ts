import type { HandcraftNode } from "./mod.ts";
import { HandcraftNoState } from "./mod.ts";
import { mutate } from "./render.ts";

export default function (
  value: (...args: Array<any>) => void,
): HandcraftNode<HandcraftNoState> {
  const node: HandcraftNode<HandcraftNoState> = (
    target: Element,
    current?: ChildNode | null,
  ): ChildNode | null => {
    mutate(target, value);

    return current ?? null;
  };

  node.state = new HandcraftNoState();

  return node;
}
