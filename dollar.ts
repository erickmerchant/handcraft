import type {
  HandcraftChildArg,
  HandcraftElement,
  HandcraftElementMethods,
  HandcraftNodeOrNodeFactory,
  HandcraftValueArg,
  HandcraftValueRecordArg,
} from "./mod.ts";
import { effect } from "./reactivity.ts";
import { create } from "./mod.ts";
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
};

const elementRefs: WeakMap<HandcraftElement, Element> = new WeakMap();

export function deref(el: HandcraftElement): Element | undefined {
  return elementRefs.get(el);
}

export function $(element: Element): HandcraftElement {
  const el = create("fragment");
  const ref = new WeakRef(element);

  elementRefs.set(el, element);

  queueMicrotask(() => {
    const vnode = el[VNODE];
    const element = ref.deref();

    if (element) patch(element, vnode.props, vnode.children);
  });

  return el;
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

    const nodeToCallback = new WeakMap<Node, () => void>();
    const fragment = document.createDocumentFragment();

    for (const child of children.slice(j)) {
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

function node(
  parent: Node,
  element: HandcraftNodeOrNodeFactory,
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
          `http://www.w3.org/${result.namespace}`,
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
