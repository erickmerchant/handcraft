import type {
  EachAPI,
  HandcraftChild,
  HandcraftElement,
  HandcraftElementFactoryNS,
  HandcraftElementMethods,
  HandcraftPrimitive,
  HandcraftValue,
  HandcraftValueRecord,
  WhenAPI,
} from "./mod.ts";
import {
  each as origEach,
  isHandcraftElement,
  NODE,
  when as origWhen,
} from "./mod.ts";
import { escape } from "@std/html/entities";

export type HandcraftTemplatingChild = HandcraftChild<VNode>;
export type HandcraftTemplatingElement = HandcraftElement<VNode>;

export function each<T>(list: Array<T>): EachAPI<T, VNode> {
  return origEach<T, VNode>(list);
}

export function when(
  cb: (prev: boolean | void) => boolean,
): WhenAPI<VNode> {
  return origWhen<VNode>(cb);
}

export * from "./reactivity.ts";

export type VNode = {
  tag?: string;
  namespace?: string;
  attributes?: Record<
    string,
    string
  >;
  children: Array<VNode | symbol | string>;
  toString(): string;
};

function esc(strs: ReadonlyArray<string>, ...values: Array<string>): string {
  let result = "";

  for (const str of strs) {
    result += str;

    const value = values.shift();

    if (value) {
      result += escape(value);
    }
  }

  return result;
}

const raw: Map<symbol, string> = new Map();

const namespaces = {
  html: "http://www.w3.org/1999/xhtml",
  svg: "http://www.w3.org/2000/svg",
  math: "http://www.w3.org/1998/Math/MathML",
};

const voids = [
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
];

function fnValue<T>(value: T | (() => T)) {
  return typeof value === "function" ? (value as CallableFunction)() : value;
}

const methods: HandcraftElementMethods<VNode> = {
  on(
    this: VNode,
  ) {
  },

  effect<T extends VNode>(this: VNode) {
  },

  attr(
    this: VNode,
    method: string,
    value:
      | HandcraftValue<HandcraftPrimitive>
      | HandcraftValueRecord<HandcraftPrimitive>,
  ) {
    if (value != null && typeof value === "object") {
      for (const [key, val] of Object.entries(value)) {
        attr(this, `${method}-${key}`, val);
      }
    } else {
      attr(this, method, value);
    }
  },

  prop<V, VNode>(
    this: VNode,
  ) {
  },

  class(
    this: VNode,
    ...classes: Array<
      string | Record<string, boolean | (() => boolean)>
    >
  ) {
    this.attributes ??= {};
    this.attributes.class ??= "";

    const list = new Set(
      ...(this.attributes.class as string).split(" "),
    );

    for (let c of classes) {
      if (typeof c !== "object") {
        c = { [c]: true };
      }

      for (const [key, value] of Object.entries(c)) {
        for (const k of key.split(" ")) {
          if (fnValue(value)) list.add(k);
          else {
            list.delete(k);
          }
        }
      }
    }

    this.attributes.class = [...list.values()].join(" ");
  },

  style(
    this: VNode,
    styles: HandcraftValueRecord<string | number | null>,
  ) {
    this.attributes ??= {};
    this.attributes.style ??= "";

    for (const [key, value] of Object.entries(styles)) {
      const v = fnValue(value);

      if (v == null) {
        this.attributes.style += `${key}: `;
      } else {
        this.attributes.style += `${key}: ${v}`;
      }
    }
  },

  html(
    this: VNode,
    html: string | (() => string),
  ) {
    const symbol = Symbol("raw");

    raw.set(symbol, fnValue(html));

    this.children.push(symbol);
  },

  shadow(
    this: VNode,
    options: ShadowRootInit,
    ...children: Array<HandcraftChild<VNode>>
  ) {
    options.serializable ??= true;

    const shadow: VNode = {
      tag: "template",
      namespace: namespaces.html,
      attributes: {},
      children: [],
    };

    for (const [key, value] of Object.entries(options)) {
      attr(shadow, `shadowroot${key}`, value);
    }

    append(shadow, ...children);

    this.children.push(shadow);
  },
};

function attr(element: VNode, key: string, value: HandcraftValue) {
  const v = fnValue(value);

  element.attributes ??= {};

  if (v === true || v === false || v == null) {
    if (v) {
      element.attributes[key] = "";
    } else {
      delete element.attributes[key];
    }
  } else {
    element.attributes[key] = `${v}`;
  }
}

function append(
  element: VNode,
  ...children: Array<HandcraftChild<VNode>>
) {
  const nodeToCallback = new WeakMap<VNode, () => void>();
  const fragment = [];

  for (const child of children) {
    if (child == null) continue;

    if (typeof child === "string") {
      fragment.push(child);
    } else {
      if (
        typeof child === "function" ||
        (typeof child === "object" &&
          child[Symbol.iterator] != null)
      ) {
        if (child == null) return;

        for (const item of typeof child === "function" ? [child] : child) {
          const result = item();

          if (!result) continue;

          let deref: VNode | string | undefined;

          if (isHandcraftElement<VNode>(result)) {
            deref = result[NODE];
          } else {
            deref = result;
          }

          if (deref != null) {
            if (typeof deref !== "string") {
              nodeToCallback.set(deref, item);
            }

            fragment.push(deref);
          } else {
            continue;
          }
        }
      }
    }
  }

  element.children.push(...fragment);
}

function stringify(el: VNode): string {
  let result = "";

  if (el.tag) {
    result += esc`<${el.tag}`;

    if (el.namespace && el.namespace !== namespaces.html) {
      result += ` xmlns="${el.namespace}"`;
    }

    for (const [key, value] of Object.entries(el.attributes ?? {})) {
      result += esc` ${key}` + (value ? esc`="${value}"` : "");
    }

    result += ">";

    if (voids.includes(el.tag)) {
      return result;
    }
  }

  for (const child of el.children) {
    if (typeof child === "object") {
      result += stringify(child);
    } else if (typeof child === "symbol") {
      const html = raw.get(child) ?? "";

      result += html;
    } else if (typeof child === "string") {
      result += esc`${child}`;
    }
  }

  if (el.tag) {
    result += esc`</${el.tag}>`;
  }

  return result;
}

export function $(
  el: VNode,
): HandcraftElement<VNode> {
  const proxy = new Proxy(() => {}, {
    apply(_, __, args: Array<HandcraftChild<VNode>>) {
      append(el, ...args);

      return proxy;
    },
    has(_target, key) {
      return key === "toString" || key === NODE;
    },
    get(_, key: string | symbol) {
      if (key === "then") {
        return undefined;
      }

      if (key === NODE) {
        return el;
      }

      if (key === "toString") {
        return () => stringify(el);
      }

      return (
        ...args: Array<HandcraftValue | HandcraftValueRecord>
      ) => {
        if (typeof key === "string") {
          if (methods[key as keyof HandcraftElementMethods<VNode>]) {
            /// @ts-ignore{2556}
            methods[key as keyof HandcraftElementMethods].call(el, ...args);
          } else {
            /// @ts-ignore{2556}
            methods.attr.call(el, key, ...args);
          }
        }

        return proxy;
      };
    },
  }) as HandcraftElement<VNode>;

  return proxy;
}

function factory(fn: () => VNode) {
  return new Proxy(() => {}, {
    apply(_, __, args) {
      const el = $(fn());

      return el(...args);
    },
    get(_, key: string) {
      const el = $(fn());

      return el[key as keyof HandcraftElement<VNode>];
    },
  }) as HandcraftElement<VNode>;
}

function factoryNS(
  namespace: string,
): HandcraftElementFactoryNS<VNode> {
  return new Proxy(
    {},
    {
      get(_, tag: string) {
        return factory(() => {
          return {
            namespace,
            tag,
            attributes: {},
            children: [],
          };
        });
      },
    },
  ) as HandcraftElementFactoryNS<VNode>;
}

export const h: {
  html: HandcraftElementFactoryNS<VNode>;
  svg: HandcraftElementFactoryNS<VNode>;
  math: HandcraftElementFactoryNS<VNode>;
} = {
  html: factoryNS(namespaces.html),
  svg: factoryNS(namespaces.svg),
  math: factoryNS(namespaces.math),
};

export const fragment = factory(() => {
  return {
    children: [],
  };
}) as HandcraftElement<VNode>;
