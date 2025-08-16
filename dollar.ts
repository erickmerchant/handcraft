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

function replace(parent: Element, current: Node, next: Node | string) {
  if (!(next instanceof Node)) {
    next = document.createTextNode(next);
  }

  parent.replaceChild(next, current);

  return next;
}

function deref(parent: Element, element: HandcraftElementChild) {
  if (
    element != null && typeof element === "function" && element.value != null
  ) {
    const result = element.value;

    if (result instanceof Node) return result;

    if (result.tag != null && result.namespace != null) {
      const el = document.createElementNS(
        namespaces[result.namespace],
        result.tag,
      );

      patch(el, result.props, result.children);

      return el;
    } else {
      const el = parent.shadowRoot ??
        parent.attachShadow(
          { mode: result.options?.mode ?? "open" } as ShadowRootInit,
        );

      patch(el, result.props, result.children);

      return el;
    }
  }

  return element;
}

function nodes(element, children, pos = position.end) {
  const nodeToCallback = new WeakMap();
  const fragment = new DocumentFragment();

  children = children.flat(Infinity);

  for (let child of children) {
    if (!child) continue;

    if (
      child != null &&
      typeof child === "object" &&
      child[Symbol.iterator] != null
    ) {
      let bounds = [document.createComment(""), document.createComment("")];

      fragment.append(...bounds);

      bounds = bounds.map((c) => new WeakRef(c));

      mutate(element, () => {
        const [start, end] = bounds.map((b) => b.deref());
        let currentChild = start && start?.nextSibling !== end
          ? start?.nextSibling
          : null;
        const fragment = new DocumentFragment();

        for (const item of child) {
          const mode = !currentChild
            ? 1
            : nodeToCallback.get(currentChild) !== item
            ? 2
            : 0;

          if (mode !== 0) {
            let result = item();

            result = deref(element, result);

            if (result != null) {
              if (mode === 1) {
                fragment.append(result);
              } else {
                currentChild = replace(element, currentChild, result);
              }

              nodeToCallback.set(result, item);
            } else if (mode === 2) {
              continue;
            }
          }

          currentChild = currentChild?.nextSibling !== end
            ? currentChild?.nextSibling
            : null;
        }

        end.before(fragment);

        while (currentChild && currentChild !== end) {
          const nextChild = currentChild?.nextSibling;

          currentChild.remove();

          currentChild = nextChild;
        }
      });
    } else if (child != null && typeof child === "function") {
      let prev = document.createComment("");

      fragment.append(prev);

      prev = new WeakRef(prev);

      mutate(
        element,
        (_, child) => {
          child = deref(element, child);

          if (child != null) {
            const p = prev.deref();

            if (p) {
              prev = new WeakRef(
                replace(element, p, child ?? document.createComment("")),
              );
            }
          }
        },
        child,
      );
    } else {
      child = deref(element, child);

      if (child != null) fragment.append(child);
    }
  }

  switch (pos) {
    case position.start:
      element.append(fragment);
      break;

    case position.end:
      element.append(fragment);
      break;
  }
}

function attr(element: Element, key: string, value: HandcraftMethodValue) {
  mutate(
    element,
    (element, value) => {
      if (value === true || value === false || value == null) {
        element.toggleAttribute(key, !!value);
      } else {
        element.setAttribute(key, value);
      }
    },
    value,
  );
}

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

    methods.on(element, events, handler, { ...options, once: true });
  },

  effect(element: Element, cb: () => void) {
    mutate(element, cb);
  },

  prop(element, key, value) {
    mutate(
      element,
      (element, value) => {
        element[key] = value;
      },
      value,
    );
  },

  css(element, css, options = {}) {
    const stylesheet = new CSSStyleSheet();

    for (const prop of ["media"]) {
      if (options[prop]) {
        mutate(
          element,
          (stylesheet, val) => {
            stylesheet[prop] = val;
          },
          options[prop],
        );
      }
    }

    element.adoptedStyleSheets.splice(
      element.adoptedStyleSheets.length,
      1,
      stylesheet,
    );

    mutate(
      element,
      (_element, css) => {
        stylesheet.replaceSync(css);
      },
      css,
    );
  },

  aria(element, attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      attr(element, `aria-${key}`, value);
    }
  },

  class(element, ...classes) {
    classes = classes.flat(Infinity);

    for (let c of classes) {
      if (typeof c !== "object") {
        c = { [c]: true };
      }

      for (const [key, value] of Object.entries(c)) {
        mutate(
          element,
          (element, value) => {
            for (const k of key.split(" ")) {
              element.classList.toggle(k, value);
            }
          },
          value,
        );
      }
    }
  },

  data(element, data) {
    for (const [key, value] of Object.entries(data)) {
      mutate(
        element,
        (element, value) => {
          element.dataset[key] = value;
        },
        value,
      );
    }
  },

  style(element, styles) {
    for (const [key, value] of Object.entries(styles)) {
      mutate(
        element,
        (element, value) => {
          element.style.setProperty(key, value);
        },
        value,
      );
    }

    return this;
  },
};

const observeMethods = {
  attr(element, key) {
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
              state[record.attributeName] = record.target.getAttribute(
                record.attributeName,
              );
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
  find(element, selector) {
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
      });

      results = watch({ [selector]: result });

      queries.set(element, results);

      treeObserver.observe(element, { childList: true, subtree: true });
    } else if (results[selector] == null) {
      results[selector] = result;
    }

    return results[selector].splice(0, Infinity).map((r) => $(r));
  },
};

function patch(element, props, children) {
  let i = 0;
  let j = 0;

  mutate(element, (element) => {
    for (const { method, args } of props.slice(i)) {
      if (methods[method]) {
        methods[method](element, ...args);
      } else {
        attr(element, method, ...args);
      }
    }

    nodes(element, children.slice(j), position.end);

    i = props.length;
    j = children.length;
  });
}

export function $(element: Element) {
  const el = {
    props: watch([]),
    children: watch([]),
  };

  const proxy = new Proxy(() => {}, {
    apply(_, __, args) {
      el.children.push(...args);

      return proxy;
    },
    get(_, key) {
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
        return observeMethods[key].bind(null, element);
      }

      return (...args) => {
        el.props.push({ method: key, args });

        return proxy;
      };
    },
  }) as HandcraftElement;

  queueMicrotask(() => {
    patch(element, el.props, el.children);
  });

  return proxy;
}

function mutate(
  element: Element,
  callback: (element: Element, value?: HandcraftMethodValue) => void,
  value?: HandcraftMethodValue,
) {
  if (typeof value !== "function") {
    callback(element, value);
  } else {
    const el = new WeakRef(element);

    effect(() => {
      const e = el.deref();

      if (e && e.isConnected) {
        callback(e, value());
      }
    });
  }
}
