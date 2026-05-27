export const NODE_STATE = Symbol("ref");

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

export type HandcraftEffectMethodCallback = (el: HTMLElement) => void;

export type HandcraftNodeState = {
  name: string;
  namespace: string;
  attributes: Array<[
    string,
    | Array<any>
    | Record<
      string,
      any
    >,
  ]>;
  children?: Array<HandcraftChild>;
};

export type HandcraftNode =
  & {
    (
      ...children: Array<HandcraftChild>
    ): HandcraftNode;
    [NODE_STATE]: HandcraftNodeState;
    name(
      value: string | null | (() => string | null),
    ): HandcraftNode;
    effect(cb: (...args: any[]) => void): HandcraftNode;
    on(
      events: string,
      handler: EventListener,
      options?: AddEventListenerOptions | boolean,
    ): HandcraftNode;
    attr(
      key: string,
      value: HandcraftValue<string | number | null>,
    ): HandcraftNode;
    aria(
      key: string,
      value: HandcraftValue<string | number | null>,
    ): HandcraftNode;
    prop<T>(key: string, value: HandcraftValue<T>): HandcraftNode;
    class(
      ...classes: Array<
        string | Record<string, HandcraftValue<boolean>>
      >
    ): HandcraftNode;
    part(
      ...parts: Array<
        string | Record<string, HandcraftValue<boolean>>
      >
    ): HandcraftNode;
    style(
      attrs: Record<
        string,
        HandcraftValue<string | number | null>
      >,
    ): HandcraftNode;
    shadow(
      options: ShadowRootInit,
      children: Array<HandcraftChild>,
    ): HandcraftNode;
  }
  & Record<
    string,
    ((
      arg: any,
    ) => HandcraftNode)
  >;

export type HandcraftControlCallback = () =>
  | HandcraftNode
  | string
  | null;

export type HandcraftNodeFactoryNS = Record<string, HandcraftNode>;
