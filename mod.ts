/**
 * ...
 */
export function resolveValue<T>(value: T | (() => T)): T {
  return typeof value === "function" ? (value as CallableFunction)() : value;
}

/**
 * ...
 */
export type HandcraftValue<T> = T | (() => T);

/**
 * ...
 */
export type HandcraftNode<T = HandcraftState> =
  & ((
    target: Element,
    current?: ChildNode | null,
    end?: ChildNode | null,
  ) => ChildNode | null)
  & {
    state: T;
  };

/**
 * ...
 */
export type HandcraftState =
  | HandcraftShadowState
  | HandcraftNodeState
  | HandcraftTextState
  | HandcraftFragmentState
  | HandcraftAttrState
  | HandcraftNoState;

/**
 * ...
 */
export class HandcraftShadowState {
  /**
   * ...
   */
  options: Record<string, any>;

  /**
   * ...
   */
  nodes: Array<HandcraftNode<HandcraftState> | null>;

  /**
   * ...
   */
  constructor(
    options: Record<string, any>,
    nodes: Array<HandcraftNode<HandcraftState> | null>,
  ) {
    this.options = options;
    this.nodes = nodes;
  }
}

/**
 * ...
 */
export class HandcraftNodeState {
  /**
   * ...
   */
  name: string;

  /**
   * ...
   */
  namespace: string;

  /**
   * ...
   */
  nodes: Array<HandcraftNode<HandcraftState> | null>;

  /**
   * ...
   */
  constructor(
    name: string,
    namespace: string,
    nodes: Array<HandcraftNode<HandcraftState> | null>,
  ) {
    this.name = name;
    this.namespace = namespace;
    this.nodes = nodes;
  }
}

/**
 * ...
 */
export class HandcraftTextState {
  /**
   * ...
   */
  text: HandcraftValue<string>;

  /**
   * ...
   */
  constructor(text: HandcraftValue<string>) {
    this.text = text;
  }
}

/**
 * ...
 */
export class HandcraftFragmentState {
  /**
   * ...
   */
  *[Symbol.iterator](): Generator<HandcraftControlCallback> {
    yield* this.iterator();
  }

  /**
   * ...
   */
  iterator: () => Generator<HandcraftControlCallback>;

  /**
   * ...
   */
  constructor(iterator: () => Generator<HandcraftControlCallback>) {
    this.iterator = iterator;
  }
}

/**
 * ...
 */
export class HandcraftAttrState {
  /**
   * ...
   */
  name: string;

  /**
   * ...
   */
  value: HandcraftValue<any>;

  /**
   * ...
   */
  constructor(name: string, value: HandcraftValue<any>) {
    this.name = name;
    this.value = value;
  }
}

/**
 * ...
 */
export class HandcraftNoState {
}

/**
 * ...
 */
export type HandcraftControlCallback = () =>
  | HandcraftNode<HandcraftNodeState>
  | null;

/**
 * ...
 */
export type HandcraftTagFactory = Record<
  string,
  HandcraftTag
>;

/**
 * ...
 */
export type HandcraftTag = (
  ...nodes: Array<HandcraftNode<HandcraftState> | null>
) => HandcraftNode<HandcraftNodeState>;
