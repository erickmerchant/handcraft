import { effect, inEffect, watch } from "./reactivity.ts";
import { namespaces } from "./mod.ts";

const position = {
  start: Symbol("start"),
  end: Symbol("end"),
};

const queries = new WeakMap();
let treeObserver;

const states = new WeakMap();
let attrObserver;

const methods = {
  on(
    element: Element,
    events: string,
    handler: EventListener,
    options: EventListenerOptions | boolean = {},
  ) {
    for (const event of events.split(/\s+/)) {
      element.addEventListener(event, handler, options);
    }
  },

  command(
    element: Element,
    commands: string,
    handler: EventListener,
    options: EventListenerOptions | boolean = {},
  ) {
    const splitCommands = commands.split(/\s+/);

    methods.on(
      element,
      "command",
      (e, ...args) => {
        // @ts-ignore type is wrong
        if (splitCommands.includes(e.command)) {
          handler.call(e.currentTarget, e, ...args);
        }
      },
      options,
    );
  },

  once(
    element: Element,
    events: string,
    handler: EventListener,
    options: EventListenerOptions | boolean = {},
  ) {
    if (options === true || options === false) {
      options = { capture: options };
    }

    methods.on(
      element,
      events,
      handler,
      { ...options, once: true } as EventListenerOptions,
    );
  },

  effect(element: Element, cb: () => void) {
    mutate(element, cb);
  },

  prop(element: Element, key: string, value: HandcraftValueArg) {
    mutateWithCallback<HandcraftValueArg>(
      element,
      (element, value) => {
        if (key in element) {
          // @ts-ignore don't care if it's writable
          element[key as keyof typeof element] = value;
        }
      },
      typeof value === "function" ? value : () => value,
    );
  },

  css(
    element: Document,
    css: string | (() => string),
    options: { media?: string | (() => string) } = {},
  ) {
    const stylesheet = new CSSStyleSheet();

    if ("media" in options) {
      mutateWithCallback<string, Document>(
        element,
        (_element, val) => {
          stylesheet.media = val;
        },
        options.media != null && typeof options?.media === "function"
          ? options.media
          : (() => options.media ?? "all") as () => string,
      );
    }

    element.adoptedStyleSheets.splice(
      element.adoptedStyleSheets.length,
      1,
      stylesheet,
    );

    mutateWithCallback<string, Document>(
      element,
      (_element, css) => {
        stylesheet.replaceSync(css);
      },
      typeof css === "function" ? css : () => css,
    );
  },

  aria(element: Element, attrs: HandcraftValueRecordArg) {
    for (const [key, value] of Object.entries(attrs)) {
      attr(element, `aria-${key}`, value);
    }
  },

  class(
    element: Element,
    ...classes: Array<string | Record<string, boolean | (() => boolean)>>
  ) {
    classes = classes.flat(Infinity);

    for (let c of classes) {
      if (typeof c !== "object") {
        c = { [c]: true };
      }

      for (const [key, value] of Object.entries(c)) {
        mutateWithCallback<boolean>(
          element,
          (element, value) => {
            for (const k of key.split(" ")) {
              element.classList.toggle(k, value);
            }
          },
          typeof value === "function" ? value : () => value,
        );
      }
    }
  },

  data(element: HTMLElement, data: HandcraftValueRecordArg) {
    for (const [key, value] of Object.entries(data)) {
      mutateWithCallback<HandcraftValue>(
        element,
        (element, value) => {
          (element as HTMLElement).dataset[key] = value as (string | undefined); // fix
        },
        typeof value === "function" ? value : () => value,
      );
    }
  },

  style(element: HTMLElement, styles: HandcraftValueRecordArg) {
    for (const [key, value] of Object.entries(styles)) {
      mutateWithCallback<HandcraftValue>(
        element,
        (element, value) => {
          (element as HTMLElement).style.setProperty(
            key,
            value as (string | null),
          ); // fix
        },
        typeof value === "function" ? value : () => value,
      );
    }

    return this;
  },

  html(
    element: Element,
    html: string | (() => string),
  ) {
    mutateWithCallback<string, Element>(
      element,
      (element, html) => {
        element.setHTMLUnsafe(html);
      },
      typeof html === "function" ? html : () => html,
    );
  },
};

const observeMethods = {
  attr(element: Element, key: string) {
    const value = element.getAttribute(key);

    if (!inEffect()) {
      return value;
    }

    let state = states.get(element);

    if (!state) {
      attrObserver ??= new MutationObserver((records) => {
        for (const record of records) {
          if (record.type === "attributes") {
            const state = states.get(record.target);

            if (state) {
              if (record.target instanceof Element) {
                state[record.attributeName as string] = record.target
                  .getAttribute(
                    record.attributeName as string,
                  );
              }
            }
          }
        }
      });

      state = watch({ [key]: value });

      states.set(element, state);

      attrObserver.observe(element, { attributes: true });
    } else if (state[key] == null) {
      state[key] = value;
    }

    return state[key];
  },
  find(element: Element, selector: string) {
    selector = `:scope ${selector}`;

    const result = [...element.querySelectorAll(selector)];

    if (!inEffect()) {
      return result.map((r) => $(r));
    }

    let results = queries.get(element);

    if (!results) {
      treeObserver ??= new MutationObserver((records) => {
        for (const record of records) {
          if (record.type === "childList") {
            const results = queries.get(record.target);

            if (results) {
              for (const selector of Object.keys(results)) {
                if (record.target instanceof Element) {
                  for (
                    const result of record.target.querySelectorAll(
                      selector,
                    )
                  ) {
                    if ([...record.addedNodes].includes(result)) {
                      results[selector] = [...results[selector], result];
                    }
                  }
                }
              }
            }
          }
        }
      });

      results = watch({ [selector]: result });

      queries.set(element, results);

      treeObserver.observe(element, { childList: true, subtree: true });
    } else if (results[selector] == null) {
      results[selector] = result;
    }

    return results[selector].splice(0, Infinity).map((r: Element) => $(r));
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
    get(_, key: string) {
      if (key === "then") {
        return undefined;
      }

      if (key === "toJSON") {
        return () => element;
      }

      if (key === "value") {
        return element;
      }

      if (key in observeMethods) {
        return observeMethods[key as keyof typeof observeMethods].bind(
          null,
          element,
        );
      }

      return (
        ...args: Array<HandcraftValueArg | HandcraftValueRecordArg>
      ) => {
        el.props.push({ method: key, args });

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
        methods[method as keyof typeof methods](element, ...args);
      } else {
        // @ts-ignore ignore silly error
        attr(element, method, ...args);
      }
    }

    nodes<T>(element, children.slice(j), position.end);

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
  pos = position.end,
) {
  const nodeToCallback = new WeakMap<Node, () => void>();
  const fragment = new DocumentFragment();

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

      mutate(element, () => {
        const [start, end] = weakBounds.map((b) => b.deref());
        let currentChild: Node | null = start && start?.nextSibling !== end
          ? start?.nextSibling
          : null;
        const fragment = new DocumentFragment();

        if (child == null) return;

        for (const item of child) {
          if (
            currentChild == null || nodeToCallback.get(currentChild) !== item
          ) {
            const result = item();

            const derefed = result ? node(element, result) : result;

            if (derefed != null) {
              if (currentChild == null) {
                fragment.append(derefed);
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

        end?.before?.(fragment);

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

      mutateWithCallback<HandcraftNode | HandcraftNodeFactory, Node>(
        element,
        (_, child) => {
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
        () => child,
      );
    } else if (typeof child === "string") {
      const result = node(element, child);

      if (result != null) fragment.append(result);
    }
  }

  switch (pos) {
    case position.start:
      element.appendChild(fragment);
      break;

    case position.end:
      element.appendChild(fragment);
      break;
  }
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
    if ((element as HandcraftElement).value == null) { // fix
      element = element();
    }

    if ((element as HandcraftElement).value != null) { // fix
      const result = (element as HandcraftElement).value; // fix

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
              { mode: result.options?.mode ?? "open" } as ShadowRootInit,
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
  mutateWithCallback<HandcraftValue>(
    element,
    (element, value) => {
      if (value === true || value === false || value == null) {
        element.toggleAttribute(key, !!value);
      } else {
        element.setAttribute(key, value as string);
      }
    },
    typeof value === "function" ? value : () => value,
  );
}

function mutateWithCallback<Result, T extends Node = Element>(
  element: T,
  callback: (
    element: T,
    value: Result,
  ) => void,
  value: () => Result,
) {
  const el = new WeakRef(element);

  effect(() => {
    const e = el.deref();

    if (e && "isConnected" in e && e.isConnected) {
      callback(e, value());
    }
  });
}

function mutate<T extends Node = Element>(
  element: T,
  callback: (
    element: T,
  ) => void,
) {
  const el = new WeakRef(element);

  effect(() => {
    const e = el.deref();

    if (e && "isConnected" in e && e.isConnected) {
      callback(e);
    }
  });
}
