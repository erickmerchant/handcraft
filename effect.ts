import type { HandcraftNode } from "./types.ts";
import { HandcraftNoState } from "./types.ts";
import { mutate } from "./render.ts";

export default (
  value: (...args: Array<any>) => void,
): HandcraftNode<HandcraftNoState> => {
  const node: HandcraftNode<HandcraftNoState> = (
    target: Element,
    current?: ChildNode | null,
  ): ChildNode | null => {
    mutate([target], value);

    return current ?? null;
  };

  node.state = new HandcraftNoState();

  return node;
};
