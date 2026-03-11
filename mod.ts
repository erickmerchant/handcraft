export * from "./define.ts";
export * from "./each.ts";
export * from "./dom.ts";
export * from "./reactivity.ts";
export * from "./when.ts";

export const NODE = Symbol("ref");

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
  shadow: (
    options: ShadowRootInit,
    ...children: Array<HandcraftChildArg>
  ) => void;
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
    [NODE]: Node;
    name: (
      value: string | null | (() => string | null),
    ) => HandcraftElement;
  }
  & HandcraftChainableMethods<HandcraftElementMethods>
  & Record<
    string,
    ((
      arg: HandcraftValueArg | HandcraftValueRecordArg,
    ) => HandcraftElement)
  >;

export type HandcraftControlCallback = () =>
  | HandcraftNode
  | void
  | Promise<HandcraftNode | void>;

export type HandcraftElementFactoryNS = Record<string, HandcraftElement>;
