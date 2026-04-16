export const NODE = Symbol("ref");

export function isHandcraftElement<T>(x: unknown): x is HandcraftElement<T> {
  return x != null && typeof x === "function" && NODE in x;
}

export type HandcraftPrimitive =
  | string
  | number
  | boolean
  | null;

export type HandcraftValue<T = HandcraftPrimitive> =
  | T
  | (() => T);

export type HandcraftValueRecord<T = HandcraftPrimitive> = Record<
  string,
  HandcraftValue<T>
>;

export type HandcraftNode<N> = HandcraftElement<N> | string | null;

export type HandcraftNodeFactory<N> = () => HandcraftNode<N>;

export type HandcraftNodeOrNodeFactory<N> =
  | HandcraftNode<N>
  | HandcraftNodeFactory<N>;

export type HandcraftChild<N> =
  | HandcraftNodeOrNodeFactory<N>
  | Iterable<HandcraftControlCallback<N>>;

export type HandcraftEffectMethodCallback = (el: HTMLElement) => void;

export type HandcraftElementMethods<N> = {
  effect: (cb: (...args: any[]) => void) => void;
  on: (
    events: string,
    handler: EventListener,
    options?: AddEventListenerOptions | boolean,
  ) => void;
  attr: (
    key: string,
    value: HandcraftValue<string | boolean>,
  ) => void;
  prop<T>(key: string, value: HandcraftValue<T>): void;
  class: (
    ...classes: Array<
      string | Record<string, boolean | (() => boolean)>
    >
  ) => void;
  style: (
    attrs: Record<
      string,
      HandcraftValue<string | number | null>
    >,
  ) => void;
  html: (html: string | (() => string)) => void;
};

type HandcraftChainableMethods<T, N> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? (...args: Parameters<T[K]>) => HandcraftElement<N>
    : T[K];
};

export type HandcraftElement<N> =
  & {
    (
      ...children: Array<HandcraftChild<N>>
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
      arg: HandcraftValue | HandcraftValueRecord,
    ) => HandcraftElement<N>)
  >;

export type HandcraftControlCallback<N> = () =>
  | HandcraftNode<N>
  | void;

export type HandcraftElementFactoryNS<N> = Record<string, HandcraftElement<N>>;
