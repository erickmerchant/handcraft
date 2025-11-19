import type {
  HandcraftChildArg,
  HandcraftElement,
  HandcraftElementMethods,
  HandcraftNode,
  HandcraftObservedElement,
  HandcraftObservedElementMethods,
  HandcraftValueArg,
  HandcraftValueRecordArg,
} from "./mod.ts";
import { effect, inEffect, watch } from "./reactivity.ts";
import { create, namespaces } from "./h.ts";
import { isHandcraftElement, VNODE } from "./mod.ts";

function fnValue<T>(value: T | (() => T)) {
  return typeof value === "function" ? (value as CallableFunction)() : value;
}

const methods: HandcraftElementMethods = {
  on(
    this: EventTarget,
    events: string,
    handler: EventListener,
    options?: AddEventListenerOptions | boolean,
  ) {
    for (const event of events.split(/\s+/)) {
      this.addEventListener(event, handler, options);
    }
  },

  command(
    this: EventTarget,
    commands: string,
    handler: EventListener,
    options?: AddEventListenerOptions | boolean,
  ) {
    const splitCommands = commands.split(/\s+/);

    methods.on.call(this, "command", (e, ...args) => {
      // @ts-ignore type is wrong
      if (splitCommands.includes(e.command)) {
        handler.call(e.currentTarget, e, ...args);
      }
    }, options);
  },

  once(
    this: EventTarget,
    events: string,
    handler: EventListener,
    options?: AddEventListenerOptions | boolean,
  ) {
    if (options === true || options === false) {
      options = { capture: options };
    }

    methods.on.call(
      this,
      events,
      handler,
      { ...options, once: true } as EventListenerOptions,
    );
  },

  effect<T extends Node = Element>(this: T, cb: (...args: any[]) => void) {
    mutate<T>(this, cb);
  },

  attr(
    this: Element,
    key: string,
    value: HandcraftValueArg<string | boolean>,
  ) {
    attr(this, key, value);
  },

  prop<V, T extends Node = Element>(
    this: T,
    key: string,
    value: HandcraftValueArg<V>,
  ) {
    mutate<T>(
      this,
      (element) => {
        if (key in element) {
          // @ts-ignore don't care if it's writable
          element[key as keyof T] = fnValue(value);
        }
      },
    );
  },

  css(
    this: DocumentOrShadowRoot,
    css: string | (() => string),
    options: { media?: string | (() => string) } = {},
  ) {
    const stylesheet = new CSSStyleSheet();

    if ("media" in options) {
      mutate<CSSStyleSheet>(
        stylesheet,
        (stylesheet) => {
          stylesheet.media = fnValue(options.media) ?? "all";
        },
      );
    }

    this.adoptedStyleSheets.splice(
      this.adoptedStyleSheets.length,
      1,
      stylesheet,
    );

    mutate<CSSStyleSheet>(
      stylesheet,
      (stylesheet) => {
        stylesheet.replaceSync(fnValue(css));
      },
    );
  },

  aria(this: Element, attrs: HandcraftValueRecordArg) {
    for (const [key, value] of Object.entries(attrs)) {
      attr(this, `aria-${key}`, value);
    }
  },

  class(
    this: Element,
    ...classes: Array<
      string | Record<string, boolean | (() => boolean)>
    >
  ) {
    classes = classes.flat(Infinity);

    for (let c of classes) {
      if (typeof c !== "object") {
        c = { [c]: true };
      }

      for (const [key, value] of Object.entries(c)) {
        mutate<Element>(
          this,
          (element) => {
            for (const k of key.split(" ")) {
              element.classList.toggle(
                k,
                fnValue(value),
              );
            }
          },
        );
      }
    }
  },

  data(this: HTMLElement, data: HandcraftValueRecordArg) {
    for (const [key, value] of Object.entries(data)) {
      mutate<HTMLElement>(
        this,
        (element) => {
          const v = fnValue(value);

          if (v == null || v === false) {
            delete element.dataset[key];
          } else {
            element.dataset[key] = v === true ? "" : `${v}`;
          }
        },
      );
    }
  },

  style(
    this: HTMLElement,
    styles: HandcraftValueRecordArg<string | number | null>,
  ) {
    for (const [key, value] of Object.entries(styles)) {
      mutate<HTMLElement>(
        this,
        (element) => {
          const v = fnValue(value);

          if (v == null) {
            element.style.removeProperty(key);
          } else {
            element.style.setProperty(key, `${v}`);
          }
        },
      );
    }
  },

  html(
    this: Element,
    html: string | (() => string),
  ) {
    mutate<Element>(
      this,
      (element) => {
        element.setHTMLUnsafe(fnValue(html));
      },
    );
  },
};

const observerCache: WeakMap<
  Node,
  Record<string, any>
> = new WeakMap();

let observer: MutationObserver;

function observe<T>(el: Node, key: string, value: () => T) {
  observer ??= new MutationObserver((records) => {
    for (const record of records) {
      const results = observerCache.get(record.target);

      if (results && record.target instanceof Element) {
        if (record.type === "attributes") {
          results[`[${record.attributeName as string}]`] = record.target
            .getAttribute(
              record.attributeName as string,
            );
        }

        for (const selector of Object.keys(results)) {
          if (!selector.startsWith(":scope")) continue;

          for (
            const result of record.target.querySelectorAll(
              selector,
            )
          ) {
            if ([...record.addedNodes].includes(result)) {
              results[selector] = [
                ...results[selector],
                result,
              ];
            }
          }
        }
      }
    }
  });

  if (!inEffect()) {
    return value();
  }

  let cache = observerCache.get(el);

  if (!cache) {
    cache = watch({});

    observerCache.set(el, cache);

    observer.observe(el, { attributes: true, subtree: true, childList: true });
  }

  if (!cache[key]) {
    cache[key] = value();
  }

  return cache[key] as T;
}

const observeMethods: HandcraftObservedElementMethods = {
  get(this: Element, key: string) {
    const value = () => this.getAttribute(key);

    return observe(this, `[${key}]`, value);
  },
  query(this: Element, selector: string) {
    selector = `:scope ${selector}`;

    const value = () => [...this.querySelectorAll(selector)];
    const observed = observe<Array<Element>>(this, selector, value);

    return observed.splice(0, Infinity).map((r: Element) => $(r));
  },
};

export function $(element: Element): HandcraftObservedElement {
  const el: {
    props: Array<{
      method: string;
      args: Array<HandcraftValueArg | HandcraftValueRecordArg>;
    }>;
    children: Array<HandcraftChildArg>;
  } = {
    props: watch([]),
    children: watch([]),
  };

  const proxy = new Proxy(() => {}, {
    apply(_, __, args: Array<HandcraftChildArg>) {
      el.children.push(...args);

      return proxy;
    },
    has(_target, key) {
      return key === VNODE;
    },
    get(_, key: string | symbol) {
      if (key === "then") {
        return undefined;
      }

      if (key === "toJSON") {
        return () => element;
      }

      if (key === VNODE) {
        return element;
      }

      if (key in observeMethods) {
        return observeMethods[key as keyof HandcraftObservedElementMethods]
          .bind(
            element,
          );
      }

      return (
        ...args: Array<HandcraftValueArg | HandcraftValueRecordArg>
      ) => {
        if (typeof key === "string") {
          el.props.push({ method: key, args });
        }

        return proxy;
      };
    },
  }) as HandcraftObservedElement;

  queueMicrotask(() => {
    patch(element, el.props, el.children);
  });

  return proxy;
}

function patch<T extends Node = Element>(
  element: T,
  props: Array<{
    method: string;
    args: Array<HandcraftValueArg | HandcraftValueRecordArg>;
  }>,
  children: Array<HandcraftChildArg>,
) {
  let i = 0;
  let j = 0;

  mutate<T>(element, (element) => {
    for (const { method, args } of props.slice(i)) {
      if (method in methods) {
        // @ts-ignore ignore silly error
        methods[method as keyof HandcraftElementMethods].call(element, ...args);
      } else {
        // @ts-ignore ignore silly error
        attr(element, method, ...args);
      }
    }

    nodes<T>(element, children.slice(j));

    i = props.length;
    j = children.length;
  });
}

function replace(parent: Node, current: Node, next: Node | string) {
  if (!(next instanceof Node)) {
    next = document.createTextNode(next);
  }

  parent.replaceChild(next, current);

  return next;
}

function nodes<T extends Node = Element>(
  element: T,
  children: Array<HandcraftChildArg>,
) {
  const nodeToCallback = new WeakMap<Node, () => void>();
  const fragment = document.createDocumentFragment();

  children = children.flat(Infinity);

  for (const child of children) {
    if (!child) continue;

    if (
      child != null &&
      typeof child === "object" &&
      child[Symbol.iterator] != null
    ) {
      const bounds = [document.createComment(""), document.createComment("")];

      fragment.append(...bounds);

      const weakBounds = bounds.map((c) => new WeakRef(c));

      mutate(element, async () => {
        const [start, end] = weakBounds.map((b) => b.deref());
        let currentChild: Node | null = start && start?.nextSibling !== end
          ? start?.nextSibling
          : null;

        if (child == null) return;

        for (const item of child) {
          if (
            currentChild == null || nodeToCallback.get(currentChild) !== item
          ) {
            const result = await item(); // @todo take out of loop

            const derefed = result ? node(element, result) : result;

            if (derefed != null) {
              if (currentChild == null) {
                end?.before?.(derefed);
              } else {
                currentChild = replace(element, currentChild, derefed);
              }

              if (typeof derefed !== "string") {
                nodeToCallback.set(derefed, item);
              }
            } else {
              continue;
            }
          }

          currentChild = currentChild?.nextSibling !== end
            ? (currentChild?.nextSibling ?? null)
            : null;
        }

        while (currentChild && currentChild !== end) {
          const nextChild = currentChild?.nextSibling;

          element.removeChild(currentChild);

          currentChild = nextChild;
        }
      });
    } else if (child != null && typeof child === "function") {
      const prev = document.createComment("");

      fragment.append(prev);

      let weakPrev = new WeakRef<Comment | Node>(prev);

      mutate<Node>(
        element,
        (element) => {
          const c = node(element, child);

          if (c != null) {
            const p = weakPrev.deref();

            if (p) {
              weakPrev = new WeakRef(
                replace(element, p, c ?? document.createComment("")),
              );
            }
          }
        },
      );
    } else if (typeof child === "string") {
      const result = node(element, child);

      if (result != null) fragment.append(result);
    }
  }

  element.appendChild(fragment);
}

function node(
  parent: Node,
  element:
    | HandcraftNode
    | (() => HandcraftNode | string | null),
): Element | DocumentFragment | string | null | void {
  if (
    element != null && typeof element === "function"
  ) {
    if (!isHandcraftElement(element)) {
      element = element();
    }

    if (isHandcraftElement(element)) {
      const result = element[VNODE];

      if (result instanceof Element) return result;

      if (result.tag != null && result.namespace != null) {
        const el = document.createElementNS(
          namespaces[result.namespace],
          result.tag,
        );

        patch(el, result.props, result.children);

        return el;
      }

      if (result.tag === "shadow") {
        if (parent instanceof Element) {
          const el = parent.shadowRoot ??
            parent.attachShadow(
              { mode: result?.options?.mode ?? "open" } as ShadowRootInit,
            );

          patch<DocumentFragment>(el, result.props, result.children);
        }

        return;
      }

      if (result.tag === "fragment") {
        const el = document.createDocumentFragment();

        patch<DocumentFragment>(el, result.props, result.children);

        return el;
      }
    }

    return element as (string | null);
  }

  return element;
}

function attr(element: Element, key: string, value: HandcraftValueArg) {
  mutate<Element>(
    element,
    (element) => {
      const v = fnValue(value);

      if (v === true || v === false || v == null) {
        element.toggleAttribute(key, !!v);
      } else {
        element.setAttribute(key, `${v}`);
      }
    },
  );
}

function mutate<T extends object>(
  element: T,
  callback: (
    element: T,
  ) => void,
) {
  const el = new WeakRef(element);

  effect(() => {
    const e = el.deref();

    if (e && (!("isConnected" in e) || e.isConnected)) {
      callback(e);
    }
  });
}
