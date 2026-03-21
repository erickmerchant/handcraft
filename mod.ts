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

export type HandcraftNode<N> = HandcraftElement<N> | string | null;

export type HandcraftNodeFactory<N> = () => HandcraftNode<N>;

export type HandcraftNodeOrNodeFactory<N> =
  | HandcraftNode<N>
  | HandcraftNodeFactory<N>;

export type HandcraftChildArg<N> =
  | HandcraftNodeOrNodeFactory<N>
  | Iterable<HandcraftControlCallback<N>>;

export type HandcraftEffectMethodCallback = (el: HTMLElement) => void;

export type HandcraftElementMethods<N> = {
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
    ...children: Array<HandcraftChildArg<N>>
  ) => void;
};

type HandcraftChainableMethods<T, N> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? (...args: Parameters<T[K]>) => HandcraftElement<N>
    : T[K];
};

export type HandcraftElement<N> =
  & {
    (
      ...children: Array<HandcraftChildArg<N>>
    ): HandcraftElement<N>;
    [NODE]: N;
    name: (
      value: string | null | (() => string | null),
    ) => HandcraftElement<N>;
  }
  & HandcraftChainableMethods<HandcraftElementMethods<N>, N>
  & Record<
    string,
    ((
      arg: HandcraftValueArg | HandcraftValueRecordArg,
    ) => HandcraftElement<N>)
  >;

export type HandcraftControlCallback<N> = () =>
  | HandcraftNode<N>
  | void;

export type HandcraftElementFactoryNS<N> = Record<string, HandcraftElement<N>>;
