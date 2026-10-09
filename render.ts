import { effect } from "./reactivity.ts";
import type {
  HandcraftChild,
  HandcraftNode,
  HandcraftNodeMethods,
  HandcraftValue,
} from "./types.ts";
import { isHandcraftNode, NODE_STATE, resolveValue } from "./types.ts";

export function render(
  node: HandcraftNode,
  target: Element | DocumentFragment,
) {
  const state = node[NODE_STATE];

  const methods: HandcraftNodeMethods & {
    _list(
      key: string,
      ...tokens: Array<
        string | Record<string, HandcraftValue<boolean>>
      >
    ): void;
    _attr(
      key: string,
      value: HandcraftValue<string | number | boolean | null>,
      adapter?: (
        v: string | number | boolean | null,
      ) => string | number | boolean | null,
    ): void;
  } = {
    effect(cb: (...args: Array<any>) => void): void {
      mutate(target, cb);
    },
    on(
      events: string,
      handler: EventListener,
      options?: AddEventListenerOptions | boolean,
    ): void {
      for (const event of events.split(/\s+/)) {
        target.addEventListener(event, (e: Event) => {
          handler(e);
        }, options);
      }
    },
    _attr(
      key: string,
      value: HandcraftValue<string | number | boolean | null>,
      adapter: (
        v: string | number | boolean | null,
      ) => string | number | boolean | null = (
        v: string | number | boolean | null,
      ) => v,
    ): void {
      if (value != null && target instanceof Element) {
        mutate<Element>(
          target,
          (element) => {
            const v = adapter(resolveValue(value));

            if (v === true || v === false || v == null) {
              element.toggleAttribute(key, !!v);
            } else {
              element.setAttribute(key, `${v}`);
            }
          },
        );
      }
    },
    attr(
      key: string,
      value: HandcraftValue<string | number | boolean | null>,
    ): void {
      this._attr(key, value);
    },
    aria(
      key: string,
      value: HandcraftValue<string | number | boolean | null>,
    ): void {
      this._attr(
        `aria-${key}`,
        value,
        (v) => (v === true ? "true" : v === false ? "false" : v),
      );
    },
    data(
      key: string,
      value: HandcraftValue<string | number | null>,
    ): void {
      this._attr(`data-${key}`, value);
    },
    prop<T>(
      key: string,
      value: HandcraftValue<T>,
    ): void {
      mutate(
        target,
        (element) => {
          if (key in element) {
            // @ts-ignore{7053}
            element[key] = resolveValue(value);
          }
        },
      );
    },
    _list(
      key: "classList" | "part",
      ...tokens: Array<
        string | Record<string, HandcraftValue<boolean>>
      >
    ): void {
      if (target instanceof Element) {
        for (let c of tokens) {
          if (typeof c !== "object") {
            c = { [c]: true };
          }

          for (const [k, value] of Object.entries(c)) {
            mutate<Element>(
              target,
              (element) => {
                const v = resolveValue(value);

                for (const kk of k.split(" ")) {
                  element[key].toggle(kk, v);
                }
              },
            );
          }
        }
      }
    },
    class(
      ...classes: Array<
        string | Record<string, HandcraftValue<boolean>>
      >
    ): void {
      this._list("classList", ...classes);
    },
    part(
      ...parts: Array<
        string | Record<string, HandcraftValue<boolean>>
      >
    ): void {
      this._list("part", ...parts);
    },
    style(
      attrs: Record<
        string,
        HandcraftValue<string | number | null>
      >,
    ): void {
      for (const [key, value] of Object.entries(attrs)) {
        mutate<HTMLElement>(
          target as HTMLElement,
          (element) => {
            const v = resolveValue(value);

            if (v == null) {
              element.style.removeProperty(key);
            } else {
              element.style.setProperty(key, `${v}`);
            }
          },
        );
      }
    },
    shadow(
      options: ShadowRootInit,
      children: Array<HandcraftChild>,
    ): void {
      if (target instanceof Element) {
        const shadow = target.shadowRoot ?? target.attachShadow(options);

        nodes(shadow, children);
      }
    },
  };

  if (target instanceof Element) {
    for (const [key, value] of state.attributes ?? []) {
      if (key in methods) {
        // @ts-ignore{2556}
        methods[key as keyof typeof methods](...value);
      } else {
        // @ts-ignore{2556}
        methods.attr(key, ...value);
      }
    }
  }

  if (state.children) {
    nodes(target, state.children);
  }
}

const START_COMMENT = " <> ";
const END_COMMENT = " </> ";

function isCommentWithSpecificValue(
  currentChild: ChildNode,
  value: string,
): boolean {
  return currentChild?.nodeType === Node.COMMENT_NODE &&
    currentChild.nodeValue === value;
}

function nodes(
  target: Element | DocumentFragment,
  children: Array<HandcraftChild>,
) {
  let currentChild: ChildNode | null | undefined = target.firstChild;

  for (const child of children) {
    let nextChild: ChildNode | null | undefined = currentChild?.nextSibling;

    if (child == null) continue;

    if (
      !node(
        child,
        currentChild,
        target as ChildNode,
        appendOrReplace,
      ) &&
      child != null
    ) {
      const [start, end] = getBounds(target, currentChild, nextChild);
      const weakBounds = [start, end].map((c) => new WeakRef(c));

      nextChild = end.nextSibling;

      mutate(target, () => {
        const [start, end] = weakBounds.map((b) => b.deref());

        if (!start || !end) return;

        let currentChild: ChildNode | null = start && start?.nextSibling !== end
          ? start?.nextSibling
          : null;

        for (const item of typeof child === "function" ? [child] : child) {
          const child = typeof item === "string" ? item : item();

          node(child, currentChild, end, beforeOrReplace);

          currentChild = currentChild?.nextSibling !== end
            ? (currentChild?.nextSibling ?? null)
            : null;
        }

        trim(currentChild, end);
      });
    }

    currentChild = nextChild;
  }

  trim(currentChild);
}

function node(
  child: string | HandcraftChild | null,
  currentChild: ChildNode | undefined | null,
  target: ChildNode,
  replacer: (
    target: ChildNode,
    newChild: ChildNode,
    currentChild?: ChildNode | null,
  ) => void,
): boolean {
  let result = false;

  if (isHandcraftNode(child)) {
    const node = child[NODE_STATE];

    const create = !currentChild ||
      currentChild?.nodeType !== Node.ELEMENT_NODE ||
      currentChild?.nodeName?.toLowerCase?.() !== node.name;

    if (create) {
      const newChild = document.createElementNS(
        `http://www.w3.org/${node.namespace}`,
        node.name,
      );

      replacer(target, newChild, currentChild);

      currentChild = newChild;
    }

    render(child, currentChild as Element);

    result = true;
  } else if (typeof child === "string") {
    const create = !currentChild ||
      currentChild?.nodeType !== Node.TEXT_NODE;

    if (create) {
      const newChild = document.createTextNode(child);

      replacer(target, newChild, currentChild);

      currentChild = newChild;
    } else if (currentChild && currentChild.nodeValue !== child) {
      currentChild.nodeValue = child;
    }

    result = true;
  }

  return result;
}

function getBounds(
  target: Element | DocumentFragment,
  currentChild?: ChildNode | null,
  nextChild?: ChildNode | null,
): [Comment, Comment] {
  if (
    currentChild && isCommentWithSpecificValue(currentChild, START_COMMENT)
  ) {
    const start = currentChild;

    let nesting = 1;
    let next = start.nextSibling;

    while (next) {
      if (isCommentWithSpecificValue(next, START_COMMENT)) {
        nesting += 1;
      }

      if (isCommentWithSpecificValue(next, END_COMMENT)) {
        nesting -= 1;

        if (nesting === 0) {
          return [start, next] as [Comment, Comment];
        }
      }

      next = next.nextSibling;
    }
  }

  return [
    appendOrReplaceComment(target, START_COMMENT, currentChild),
    appendOrReplaceComment(target, END_COMMENT, nextChild),
  ];
}

function appendOrReplaceComment(
  target: Element | DocumentFragment,
  text: string,
  currentChild?: ChildNode | null,
): Comment {
  const comment = document.createComment(text);

  appendOrReplace(target as ChildNode, comment, currentChild);

  return comment;
}

function appendOrReplace(
  target: ChildNode,
  newChild: ChildNode,
  currentChild?: ChildNode | null,
) {
  if (currentChild) {
    currentChild.replaceWith(newChild);
  } else {
    target.appendChild(newChild);
  }
}

function beforeOrReplace(
  target: ChildNode,
  newChild: ChildNode,
  currentChild?: ChildNode | null,
) {
  if (currentChild) {
    currentChild.replaceWith(newChild);
  } else {
    target.before(newChild);
  }
}

function trim(currentChild?: ChildNode | null, end?: ChildNode | null) {
  while (currentChild && currentChild !== end) {
    const nextChild = currentChild?.nextSibling;

    currentChild.remove();

    currentChild = nextChild;
  }
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
