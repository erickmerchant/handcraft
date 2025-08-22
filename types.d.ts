type HandcraftValue =
  | string
  | number
  | boolean
  | null;

type HandcraftValueArg =
  | HandcraftValue
  | (() => HandcraftValue);

type HandcraftValueRecordArg = Record<
  string,
  HandcraftValueArg
>;

type HandcraftNode = HandcraftElement | string | null;

type HandcraftNodeFactory = () => HandcraftNode;

type HandcraftChildArg =
  | HandcraftNode
  | Iterable<HandcraftControlCallback>
  | HandcraftNodeFactory;

type HandcraftElementValue = {
  tag?: string;
  namespace?: string;
  options?: Record<string, string>;
  props: Array<{
    method: string;
    args: Array<HandcraftValueArg | HandcraftValueRecordArg>;
  }>;
  children: Array<HandcraftChildArg>;
};

type HandcraftElement =
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

type HandcraftObservedElement = {
  attr(key: string): string | null;
  find(selector: string): Array<HandcraftObservedElement>;
} & HandcraftElement;

type HandcraftDefineLifeCycleCallback = (el: HandcraftObservedElement) => void;

type HandcraftDefineFactory = {
  setup: (cb: HandcraftDefineLifeCycleCallback) => HandcraftDefineAPI;
  teardown: (cb: HandcraftDefineLifeCycleCallback) => HandcraftDefineAPI;
};

type HandcraftDefineAPI = HandcraftElement & HandcraftDefineFactory;

type HandcraftControlCallback = () => HandcraftElement | void;

type HandcraftEachIndex = () => number;

type HandcraftEachStore<T> = {
  value: T | null;
  index: number;
};

type HandcraftEachCurrent<T> = {
  store: HandcraftEachStore<T>;
  value: (() => T) & T;
  index: HandcraftEachIndex;
};

type HandcraftEachFilterCurrent<T> = {
  (): T;
} & T;

type HandcraftEachMapper<T> = (
  current: (() => T) & T,
  index: HandcraftEachIndex,
) => HandcraftElement | void;

type HandcraftEachFilterer<T> = (
  current: HandcraftEachFilterCurrent<T>,
  index: HandcraftEachIndex,
) => boolean;

type HandcraftEachAPI<T> = {
  map(cb: HandcraftEachMapper<T>): HandcraftEachAPI<T>;
  filter(cb: HandcraftEachFilterer<T>): HandcraftEachAPI<T>;
  fallback(cb: HandcraftControlCallback): HandcraftEachAPI<T>;
} & Iterable<HandcraftControlCallback>;

type HandcraftWhenAPI = {
  show(cb: HandcraftControlCallback): HandcraftWhenAPI;
  fallback(cb: HandcraftControlCallback): HandcraftWhenAPI;
} & Iterable<HandcraftControlCallback>;
