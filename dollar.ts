import type {
  HandcraftChildArg,
  HandcraftElement,
  HandcraftElementMethods,
  HandcraftElementValue,
  HandcraftValueArg,
  HandcraftValueRecordArg,
} from "./mod.ts";
import { effect } from "./reactivity.ts";
import { create } from "./h.ts";
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

  shadow(
    this: Element,
    options: ShadowRootInit,
    ...children: Array<HandcraftChildArg>
  ) {
    const el = this.shadowRoot ??
      this.attachShadow(
        options,
      );

    patch<ShadowRoot>(el, { children, props: [] });
  },
};

export function $(element: Element): HandcraftElement {
  const el = create("fragment");
  const ref = new WeakRef(element);

  queueMicrotask(() => {
    const vnode = el[VNODE];
    const element = ref.deref();

    if (element) patch(element, vnode);
  });

  return el;
}

function patch<T extends Node = Element>(
  element: T,
  { children, props }: HandcraftElementValue,
) {
  for (const { method, args } of props) {
    if (method in methods) {
      // @ts-ignore ignore silly error
      methods[method as keyof HandcraftElementMethods].call(element, ...args);
    } else {
      // @ts-ignore ignore silly error
      attr(element, method, ...args);
    }
  }

  const nodeToCallback = new WeakMap<Node, () => void>();
  const fragment = document.createDocumentFragment();

  for (const child of children) {
    if (child == null) continue;

    if (typeof child === "string") {
      fragment.append(child);
    } else {
      if (
        typeof child === "function" ||
        (typeof child === "object" &&
          child[Symbol.iterator] != null)
      ) {
        const lastChild = fragment.lastChild;
        const bounds = [
          lastChild != null && lastChild.nodeType === 8
            ? lastChild
            : document.createComment(""),
          document.createComment(""),
        ];

        fragment.append(...bounds);

        const weakBounds = bounds.map((c) => new WeakRef(c));

        mutate(element, async () => {
          const [start, end] = weakBounds.map((b) => b.deref());
          let currentChild: Node | null = start && start?.nextSibling !== end
            ? start?.nextSibling
            : null;

          if (child == null) return;

          for (const item of typeof child === "function" ? [child] : child) {
            if (
              currentChild == null ||
              nodeToCallback.get(currentChild) !== item
            ) {
              const result = await item(); // @todo take out of loop

              if (!result) continue;

              let derefed: Element | DocumentFragment | string | Text;

              if (isHandcraftElement(result)) {
                const res = result[VNODE];

                if (res instanceof Element) return res;

                if (res.tag != null && res.namespace != null) {
                  const el = document.createElementNS(
                    `http://www.w3.org/${res.namespace}`,
                    res.tag,
                  );

                  patch(el, res);

                  derefed = el;
                } else {
                  const el = document.createDocumentFragment();

                  patch(el, res);

                  derefed = el;
                }
              } else {
                derefed = result;
              }

              if (derefed != null) {
                if (typeof derefed !== "string") {
                  nodeToCallback.set(derefed, item);
                }

                if (!(derefed instanceof Node)) {
                  derefed = document.createTextNode(derefed);
                }

                if (currentChild == null) {
                  end?.before?.(derefed);
                } else {
                  element.replaceChild(derefed, currentChild);

                  currentChild = derefed;
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
  }

  element.appendChild(fragment);
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
