import type {
  HandcraftChild,
  HandcraftElement,
  HandcraftElementFactoryNS,
  HandcraftElementMethods,
  HandcraftPrimitive,
  HandcraftValue,
  HandcraftValueRecord,
} from "./types.ts";
import { isHandcraftElement, NODE } from "./types.ts";
import { effect } from "./reactivity.ts";

function fnValue<T>(value: T | (() => T)) {
  return typeof value === "function" ? (value as CallableFunction)() : value;
}

const methods: HandcraftElementMethods<Node> = {
  effect<T extends Node = Element>(this: T, cb: (...args: any[]) => void) {
    mutate<T>(this, cb);
  },

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

  attr(
    this: Element,
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

  prop<V, T extends Node = Element>(
    this: T,
    key: string,
    value: HandcraftValue<V>,
  ) {
    mutate<T>(
      this,
      (element) => {
        if (key in element) {
          element[key as keyof T] = fnValue(value);
        }
      },
    );
  },

  class(
    this: Element,
    ...classes: Array<
      string | Record<string, boolean | (() => boolean)>
    >
  ) {
    for (let c of classes) {
      if (typeof c !== "object") {
        c = { [c]: true };
      }

      for (const [key, value] of Object.entries(c)) {
        mutate<Element>(
          this,
          (element) => {
            const v = fnValue(value);

            for (const k of key.split(" ")) {
              element.classList.toggle(
                k,
                v,
              );
            }
          },
        );
      }
    }
  },

  style(
    this: HTMLElement,
    styles: HandcraftValueRecord<string | number | null>,
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
        if (element.setHTMLUnsafe) {
          element.setHTMLUnsafe(fnValue(html));
        } else {
          const div = document.createElement("div");

          div.innerHTML = fnValue(html);

          element.append(...div.childNodes);
        }
      },
    );
  },
};

function append<T extends Node = Element>(
  element: T,
  ...children: Array<HandcraftChild<Node>>
) {
  const nodeToCallback = new WeakMap<Node, () => void>();
  const fragment = document.createDocumentFragment();

  for (const child of children) {
    if (child == null) continue;

    if (
      isHandcraftElement<Element>(child) &&
      child[NODE]?.nodeName === "TEMPLATE"
    ) {
      const deref = child[NODE];

      queueMicrotask(() => {
        const options: ShadowRootInit = { mode: "open" };

        for (const attribute of deref.getAttributeNames()) {
          if (attribute.startsWith("shadowroot")) {
            const value = deref.getAttribute(attribute);
            const key = attribute.substring(10);

            // @ts-ignore{7053}
            options[key] = !value ? true : value;
          }
        }

        if (options.mode && element instanceof Element) {
          const root = element.shadowRoot ??
            element.attachShadow(options);

          root.append(...deref.children);
        }
      });
    } else if (typeof child === "string") {
      fragment.append(child);
    } else {
      const lastChild = fragment.lastChild;
      const bounds = [
        lastChild != null && lastChild.nodeType === 8
          ? lastChild
          : document.createComment(""),
        document.createComment(""),
      ];

      fragment.append(...bounds);

      const weakBounds = bounds.map((c) => new WeakRef(c));

      mutate(element, () => {
        const [start, end] = weakBounds.map((b) => b.deref());
        let currentChild: Node | null = start && start?.nextSibling !== end
          ? start?.nextSibling
          : null;

        for (const item of typeof child === "function" ? [child] : child) {
          if (
            currentChild == null ||
            nodeToCallback.get(currentChild) !== item
          ) {
            const result = isHandcraftElement<Node>(item) ? item : item();

            if (!result) continue;

            let deref: Node | string | undefined;

            if (isHandcraftElement<Node>(result)) {
              deref = result[NODE];
            } else {
              deref = result;
            }

            if (deref != null) {
              if (typeof deref !== "string") {
                nodeToCallback.set(deref, item);
              } else {
                deref = document.createTextNode(deref);
              }

              if (currentChild == null) {
                end?.before?.(deref);
              } else {
                element.replaceChild(deref, currentChild);

                currentChild = deref;
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
    }
  }

  element.appendChild(fragment);
}

function attr(element: Element, key: string, value: HandcraftValue) {
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

    if (e) {
      callback(e);
    }
  });
}

export function $<T extends Node = Element>(
  el: T,
): HandcraftElement<Node> {
  const ref = new WeakRef(el);

  const proxy = new Proxy(() => {}, {
    apply(_, __, args: Array<HandcraftChild<Node>>) {
      append(el, ...args);

      return proxy;
    },
    has(_target, key) {
      return key === NODE;
    },
    get(_, key: string | symbol) {
      if (key === "then") {
        return undefined;
      }

      if (key === NODE) {
        return ref.deref();
      }

      return (
        ...args: Array<HandcraftValue | HandcraftValueRecord>
      ) => {
        if (typeof key === "string") {
          if (!methods[key as keyof HandcraftElementMethods<Node>]) {
            args.unshift(key);

            key = "attr";
          }

          /// @ts-ignore{2556}
          methods[key as keyof HandcraftElementMethods].call(el, ...args);
        }

        return proxy;
      };
    },
  }) as HandcraftElement<Node>;

  return proxy;
}

function factory<T extends Node = Element>(fn: () => T) {
  return new Proxy(() => {}, {
    apply(_, __, args) {
      const el = $(fn());

      return el(...args);
    },
    get(_, key: string) {
      const el = $(fn());

      return el[key as keyof HandcraftElement<Node>];
    },
  }) as HandcraftElement<Node>;
}

function factoryNS(
  namespace: string,
): HandcraftElementFactoryNS<Node> {
  return new Proxy(
    {},
    {
      get(_, tag: string) {
        return factory(() =>
          document.createElementNS(
            `http://www.w3.org/${namespace}`,
            tag,
          )
        );
      },
    },
  ) as HandcraftElementFactoryNS<Node>;
}

export const h: {
  html: HandcraftElementFactoryNS<Node>;
  svg: HandcraftElementFactoryNS<Node>;
  math: HandcraftElementFactoryNS<Node>;
} = {
  html: factoryNS("1999/xhtml"),
  svg: factoryNS("2000/svg"),
  math: factoryNS("1998/Math/MathML"),
};

export const fragment = factory(() =>
  document.createDocumentFragment()
) as HandcraftElement<Node>;
