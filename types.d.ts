type HandcraftMethodValue =
  | string
  | number
  | boolean
  | null
  | (() => HandcraftMethodValue);

type HandcraftMethodRecordValue = Record<
  string,
  string | number | boolean | null | (() => HandcraftMethodValue)
>;

type HandcraftMethodChild =
  | HandcraftAbstractNode
  | string
  | null
  | (() => HandcraftAbstractNode | string | null);

type HandcraftAbstractNode = {
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
  deref: () => HandcraftAbstractNode;
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
