export const NODE_STATE = Symbol();

export function isHandcraftNode(x: unknown): x is HandcraftNode {
  return x != null && typeof x === "function" && NODE_STATE in x;
}

export function resolveValue<T>(value: T | (() => T)): T {
  return typeof value === "function" ? (value as CallableFunction)() : value;
}

export type HandcraftValue<T> = T | (() => T);

export type HandcraftChild =
  | HandcraftValue<
    | HandcraftNode
    | string
    | null
  >
  | Iterable<HandcraftControlCallback>;

export type HandcraftNodeState = {
  name: string;
  namespace: string;
  attributes: Array<[
    string,
    Array<any>,
  ]>;
  children?: Array<HandcraftChild>;
};

export type HandcraftNodeMethods = {
  effect(cb: (...args: Array<any>) => void): void;
  on(
    events: string,
    handler: EventListener,
    options?: AddEventListenerOptions | boolean,
  ): void;
  attr(
    key: string,
    value: HandcraftValue<string | number | boolean | null>,
  ): void;
  aria(
    key: string,
    value: HandcraftValue<string | number | boolean | null>,
  ): void;
  data(
    key: string,
    value: HandcraftValue<string | number | null>,
  ): void;
  prop<T>(
    key: string,
    value: HandcraftValue<T>,
  ): void;
  class(
    ...classes: Array<
      string | Record<string, HandcraftValue<boolean>>
    >
  ): void;
  part(
    ...parts: Array<
      string | Record<string, HandcraftValue<boolean>>
    >
  ): void;
  style(
    attrs: Record<
      string,
      HandcraftValue<string | number | null>
    >,
  ): void;
  shadow(
    options: ShadowRootInit,
    children: Array<HandcraftChild>,
  ): void;
};

export type HandcraftNode =
  & {
    (
      ...children: Array<HandcraftChild>
    ): HandcraftNode;
    [NODE_STATE]: HandcraftNodeState;
    name(
      this: HandcraftNode,
      value: string | null | (() => string | null),
    ): HandcraftNode;
  }
  & HandcraftChainableMethods<HandcraftNodeMethods>
  & Record<
    string,
    ((
      this: HandcraftNode,
      arg: HandcraftValue<string | number | boolean | null>,
    ) => HandcraftNode)
  >;

export type HandcraftControlCallback = () =>
  | HandcraftNode
  | string
  | null;

export type HandcraftNodeFactoryNS = Record<string, HandcraftNode>;

type HandcraftChainableMethods<T> = {
  [K in keyof T]: T[K] extends (...args: Array<any>) => any
    ? (this: HandcraftNode, ...args: Parameters<T[K]>) => HandcraftNode
    : T[K];
};
