export function resolveValue<T>(value: T | (() => T)): T {
  return typeof value === "function" ? (value as CallableFunction)() : value;
}

export type HandcraftValue<T> = T | (() => T);

export type HandcraftNode =
  & ((
    target: Element,
    current?: ChildNode | null,
  ) => ChildNode | null)
  & {
    state: HandcraftState;
  };

export type HandcraftState = {
  type:
    | "shadow"
    | "node"
    | "text"
    | "fragment"
    | "attr"
    | "prop"
    | "on"
    | "effect";
  name?: string;
  namespace?: string;
  options?: Record<string, any>;
  nodes?: Array<HandcraftNode>;
  text?: HandcraftValue<string>;
  value?: HandcraftValue<any>;
};

export type HandcraftControlCallback = () =>
  | HandcraftNode
  | null;

export type HandcraftTagFactory = Record<
  string,
  HandcraftTag
>;

export type HandcraftTag = (
  ...nodes: Array<HandcraftNode>
) => HandcraftNode;
