export type HandcraftValue =
  | string
  | number
  | boolean
  | null;

export type HandcraftValueArg =
  | HandcraftValue
  | (() => HandcraftValue);

export type HandcraftValueRecordArg = Record<
  string,
  HandcraftValueArg
>;

export type HandcraftNode = HandcraftElement | string | null;

export type HandcraftNodeFactory = () => HandcraftNode;

export type HandcraftChildArg =
  | HandcraftNode
  | Iterable<HandcraftControlCallback>
  | HandcraftNodeFactory;

export type HandcraftElementValue = {
  tag?: string;
  namespace?: string;
  options?: Record<string, string>;
  props: Array<{
    method: string;
    args: Array<HandcraftValueArg | HandcraftValueRecordArg>;
  }>;
  children: Array<HandcraftChildArg>;
};

export type HandcraftElement =
  & {
    (
      ...children: Array<HandcraftChildArg>
    ): HandcraftElement;
    value: HandcraftElementValue;
    on: (
      events: string,
      handler: EventListener,
      options?: EventListenerOptions,
    ) => HandcraftElement;
    command: (
      commands: string,
      handler: EventListener,
      options?: EventListenerOptions,
    ) => HandcraftElement;
    once: (
      events: string,
      handler: EventListener,
      options?: EventListenerOptions,
    ) => HandcraftElement;
    effect: (cb: (el: HTMLElement) => void) => HandcraftElement;
    prop: (key: string, value: HandcraftValueArg) => HandcraftElement;
    css: (
      css: string | (() => string),
      options?: { media?: string },
    ) => HandcraftElement;
    aria: (attrs: HandcraftValueRecordArg) => HandcraftElement;
    class: (
      ...classes: Array<
        string | Record<string, boolean | null | (() => boolean | null)>
      >
    ) => HandcraftElement;
    data: (data: HandcraftValueRecordArg) => HandcraftElement;
    style: (
      attrs: Record<
        string,
        string | number | null | (() => string | number | null)
      >,
    ) => HandcraftElement;
    html: (
      html: string | (() => string | null),
    ) => HandcraftElement;
    name: (value: string | null | (() => string | null)) => HandcraftElement;
  }
  & Record<
    string,
    ((
      ...args: Array<HandcraftValueArg>
    ) => HandcraftElement)
  >;

export type HandcraftObservedElement = {
  attr(key: string): string | null;
  find(selector: string): Array<HandcraftObservedElement>;
} & HandcraftElement;

export type HandcraftDefineLifeCycleCallback = (
  el: HandcraftObservedElement,
) => void;

export type HandcraftDefineFactory = {
  setup: (cb: HandcraftDefineLifeCycleCallback) => HandcraftDefineAPI;
  teardown: (cb: HandcraftDefineLifeCycleCallback) => HandcraftDefineAPI;
};

export type HandcraftDefineAPI = HandcraftElement & HandcraftDefineFactory;

export type HandcraftControlCallback = () => HandcraftElement | void;

export type HandcraftEachIndex = () => number;

export type HandcraftEachStore<T> = {
  value: T | null;
  index: number;
};

export type HandcraftEachCurrent<T> = {
  store: HandcraftEachStore<T>;
  value: (() => T) & T;
  index: HandcraftEachIndex;
};

export type HandcraftEachFilterCurrent<T> = {
  (): T;
} & T;

export type HandcraftEachMapper<T> = (
  current: (() => T) & T,
  index: HandcraftEachIndex,
) => HandcraftElement | void;

export type HandcraftEachFilterer<T> = (
  current: HandcraftEachFilterCurrent<T>,
  index: HandcraftEachIndex,
) => boolean;

export type HandcraftEachAPI<T> = {
  map(cb: HandcraftEachMapper<T>): HandcraftEachAPI<T>;
  filter(cb: HandcraftEachFilterer<T>): HandcraftEachAPI<T>;
  fallback(cb: HandcraftControlCallback): HandcraftEachAPI<T>;
} & Iterable<HandcraftControlCallback>;

export type HandcraftWhenAPI = {
  show(cb: HandcraftControlCallback): HandcraftWhenAPI;
  fallback(cb: HandcraftControlCallback): HandcraftWhenAPI;
} & Iterable<HandcraftControlCallback>;
