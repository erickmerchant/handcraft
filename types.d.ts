type HandcraftValue =
  | string
  | number
  | boolean
  | null;

type HandcraftMethodValue =
  | HandcraftValue
  | (() => HandcraftValue);

type HandcraftMethodRecordValue = Record<
  string,
  HandcraftMethodValue
>;

type HandcraftElementChild = HandcraftElement | string | null;

type HandcraftElementFactory = () => HandcraftElementChild;

type HandcraftMethodChild =
  | HandcraftElementChild
  | (
    | Iterable<HandcraftElementFactory>
    | HandcraftElementFactory
  );

type HandcraftElementValue = {
  tag?: string;
  namespace?: string;
  options?: Record<string, string>;
  props: Array<{
    method: string;
    args: Array<HandcraftMethodValue | HandcraftMethodRecordValue>;
  }>;
  children: Array<HandcraftMethodChild>;
};

type HandcraftElement = {
  (
    ...children: Array<HandcraftMethodChild>
  ): HandcraftElement;
  value: HandcraftElementValue;
  on: (
    events: string,
    handler: EventListener,
    options: EventListenerOptions,
  ) => HandcraftElement;
  command: (
    commands: string,
    handler: EventListener,
    options: EventListenerOptions,
  ) => HandcraftElement;
  once: (
    events: string,
    handler: EventListener,
    options: EventListenerOptions,
  ) => HandcraftElement;
  effect: (cb: () => void) => HandcraftElement;
  prop: (key: string, value: HandcraftMethodValue) => HandcraftElement;
  css: (
    css: string | (() => string),
    options: { media?: string },
  ) => HandcraftElement;
  aria: (attrs: HandcraftMethodRecordValue) => HandcraftElement;
  class: (
    ...classes: Array<
      string | Record<string, boolean | null | (() => boolean | null)>
    >
  ) => HandcraftElement;
  data: (data: HandcraftMethodRecordValue) => HandcraftElement;
  style: (
    attrs: Record<string, string | (() => string)>,
  ) => HandcraftElement;
};

type HandcraftDefineLifeCycleCallback = (el: HandcraftElement) => void;
type HandcraftDefineFactory = {
  setup: (cb: HandcraftDefineLifeCycleCallback) => HandcraftDefineAPI;
  teardown: (cb: HandcraftDefineLifeCycleCallback) => HandcraftDefineAPI;
};
type HandcraftDefineAPI = HandcraftElement & HandcraftDefineFactory;

type HandcraftControlCallback = () => HandcraftElement | void

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
  current: () => T,
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
	show(cb: HandcraftControlCallback): HandcraftWhenAPI,
  fallback(cb: HandcraftControlCallback) : HandcraftWhenAPI,
} & Iterable<HandcraftControlCallback>
