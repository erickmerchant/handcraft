import type { HandcraftNode } from "./types.ts";
import { HandcraftNoState } from "./types.ts";
import { recordProxy } from "./utils.ts";

export default recordProxy<
  (
    handler: EventListener,
    options?: AddEventListenerOptions | boolean,
  ) => HandcraftNode<HandcraftNoState>
>((name: string) =>
(
  handler: EventListener,
  options?: AddEventListenerOptions | boolean,
) => {
  const node: HandcraftNode<HandcraftNoState> = (
    target: Element,
    current?: ChildNode | null,
  ): ChildNode | null => {
    target.addEventListener(name, (e: Event) => {
      handler(e);
    }, options);

    return current ?? null;
  };

  node.state = new HandcraftNoState();

  return node;
}) as Record<
  string,
  (
    handler: EventListener,
    options?: AddEventListenerOptions | boolean,
  ) => HandcraftNode<HandcraftNoState>
>;
