export * from "./define.ts";
export * from "./dollar.ts";
export * from "./each.ts";
export * from "./h.ts";
export * from "./observe.ts";
export * from "./reactivity.ts";
export * from "./render.ts";
export * from "./when.ts";

export const VNODE = Symbol("vnode");

export function isHandcraftElement(x: unknown): x is HandcraftElement {
  return x != null && typeof x === "function" && VNODE in x;
}

export type HandcraftValue =
  | string
  | number
  | boolean
  | null;

export type HandcraftValueArg<T = HandcraftValue> =
  | T
  | (() => T);

export type HandcraftValueRecordArg<T = HandcraftValue> = Record<
  string,
  HandcraftValueArg<T>
>;

export type HandcraftNode = HandcraftElement | string | null;

export type HandcraftNodeFactory = () => HandcraftNode;

export type HandcraftNodeOrNodeFactory = HandcraftNode | HandcraftNodeFactory;

export type HandcraftChildArg =
  | HandcraftNodeOrNodeFactory
  | Iterable<HandcraftControlCallback>;

export type HandcraftElementValue = {
  tag?: string;
  namespace?: string;
  options?: HandcraftValueRecordArg;
  props: Array<{
    method: string;
    args: Array<HandcraftValueArg | HandcraftValueRecordArg>;
  }>;
  children: Array<HandcraftChildArg>;
};

export type HandcraftEffectMethodCallback = (el: HTMLElement) => void;

export type HandcraftElementMethods = {
  on: (
    events: string,
    handler: EventListener,
    options?: AddEventListenerOptions | boolean,
  ) => void;

  effect: (cb: (...args: any[]) => void) => void;
  attr: (
    key: string,
    value: HandcraftValueArg<string | boolean>,
  ) => void;
  prop<T>(key: string, value: HandcraftValueArg<T>): void;
  aria: (
    attrs: HandcraftValueRecordArg,
  ) => void;
  class: (
    ...classes: Array<
      string | Record<string, boolean | (() => boolean)>
    >
  ) => void;
  style: (
    attrs: Record<
      string,
      HandcraftValueArg<string | number | null>
    >,
  ) => void;
  html: (html: string | (() => string)) => void;
};

type HandcraftChainableMethods<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? (...args: Parameters<T[K]>) => HandcraftElement
    : T[K];
};

export type HandcraftElement =
  & {
    (
      ...children: Array<HandcraftChildArg>
    ): HandcraftElement;
    [VNODE]: HandcraftElementValue;
    name: (
      value: string | null | (() => string | null),
    ) => HandcraftElement;
  }
  & HandcraftChainableMethods<HandcraftElementMethods>
  & Record<
    string,
    ((...args: Array<HandcraftValueArg>) => HandcraftElement)
  >;

export type HandcraftControlCallback = () =>
  | HandcraftElement
  | void
  | Promise<HandcraftElement | void>;

export type HandcraftElementFactoryNS = Record<string, HandcraftElement>;
