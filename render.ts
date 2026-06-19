import { effect } from "./reactivity.ts";
import type { HandcraftChild, HandcraftNode, HandcraftValue } from "./types.ts";
import { isHandcraftNode, NODE_STATE, resolveValue } from "./types.ts";

export function render(
  node: HandcraftNode,
  target: Element | DocumentFragment,
  hydrating: boolean = false,
) {
  const state = node[NODE_STATE];

  if (target instanceof Element) {
    for (const [key, value] of state.attributes ?? []) {
      if (key === "effect") {
        const [cb] = value as [(...args: any[]) => void];

        mutate(target, cb);
      }

      if (key === "on") {
        const [events, handler, options] = value as [
          string,
          EventListener,
          AddEventListenerOptions | boolean | undefined,
        ];

        for (const event of events.split(/\s+/)) {
          target.addEventListener(event, (e: Event) => {
            handler(e);
          }, options);
        }
      }

      if (key === "prop") {
        const [key, val] = value as [string, any];

        mutate<Element>(
          target,
          (element) => {
            if (key in element) {
              // @ts-ignore{7053}
              element[key] = resolveValue(val);
            }
          },
        );
      }

      if (key === "style") {
        const [styles] = value as [
          Record<
            string,
            HandcraftValue<string | number | null>
          >,
        ];

        for (const [key, value] of Object.entries(styles)) {
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
      }

      if (key === "class" || key === "part") {
        const tokens = value as Array<
          string | Record<string, boolean | (() => boolean)>
        >;

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
                  element[key === "class" ? "classList" : "part"].toggle(kk, v);
                }
              },
            );
          }
        }
      }

      if (key === "attr") {
        const [method, val] = value as [
          string,
          HandcraftValue<string | number | boolean | null>,
        ];

        if (val != null) {
          attr(target, method, val);
        }
      }

      if (key === "aria") {
        const [key, val] = value as [
          string,
          HandcraftValue<string | number | boolean | null>,
        ];

        if (val != null) {
          mutate<Element>(
            target,
            (element) => {
              const v = resolveValue(val);
              const k = `aria-${key}`;

              if (v == null) {
                element.removeAttribute(k);
              } else if (v === true || v === false) {
                element.setAttribute(k, v ? "true" : "false");
              } else {
                element.setAttribute(k, `${v}`);
              }
            },
          );
        }
      }

      if (key === "shadow") {
        const [options, children] = value as [
          ShadowRootInit,
          Array<HandcraftChild>,
        ];

        const shadow = target.shadowRoot ?? target.attachShadow(options);

        nodes(shadow, children, hydrating);
      }
    }
  }

  if (state.children) {
    nodes(target, state.children, hydrating);
  }
}

const nodeToCallback = new WeakMap<Node, () => void>();
const START_COMMENT = " <> ";
const END_COMMENT = " </> ";

function isStartComment(currentChild: ChildNode): boolean {
  return currentChild?.nodeType === Node.COMMENT_NODE &&
    currentChild.nodeValue === START_COMMENT;
}

function isEndComment(currentChild: ChildNode): boolean {
  return currentChild?.nodeType === Node.COMMENT_NODE &&
    currentChild.nodeValue === END_COMMENT;
}

function nodes(
  target: Element | DocumentFragment,
  children: Array<HandcraftChild>,
  hydrating: boolean,
) {
  let currentChild: ChildNode | null | undefined = target.firstChild;

  for (const child of children) {
    let nextChild: ChildNode | null | undefined = currentChild?.nextSibling;

    if (child == null) continue;

    if (typeof child === "string") {
      const create = !hydrating || !currentChild ||
        currentChild?.nodeType !== Node.TEXT_NODE;

      if (create) {
        const newChild = document.createTextNode(child);

        appendOrReplace(target, newChild, currentChild);

        currentChild = newChild;
      } else if (currentChild && currentChild.nodeValue !== child) {
        currentChild.nodeValue = child;
      }
    } else if (isHandcraftNode(child)) {
      const node = child[NODE_STATE];

      const create = !hydrating || !currentChild ||
        currentChild?.nodeType !== Node.ELEMENT_NODE ||
        currentChild?.nodeName?.toLowerCase?.() !== node.name;

      if (create) {
        const newChild = document.createElementNS(
          `http://www.w3.org/${node.namespace}`,
          node.name,
        );

        appendOrReplace(target, newChild, currentChild);

        currentChild = newChild;
      }

      render(child, currentChild as Element, hydrating);
    } else if (child != null) {
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
          if (
            currentChild == null || nodeToCallback.get(currentChild) !== item
          ) {
            const child = item();

            if (isHandcraftNode(child)) {
              const node = child[NODE_STATE];

              const create = !hydrating || !currentChild ||
                currentChild?.nodeType !== Node.ELEMENT_NODE ||
                currentChild?.nodeName?.toLowerCase?.() !== node.name;

              if (create) {
                const newChild = document.createElementNS(
                  `http://www.w3.org/${node.namespace}`,
                  node.name,
                );

                beforeOrReplace(end, newChild, currentChild);

                currentChild = newChild;
              }

              render(child, currentChild as Element, hydrating);
            } else if (typeof child === "string") {
              const create = !hydrating || !currentChild ||
                currentChild?.nodeType !== Node.TEXT_NODE;

              if (create) {
                const newChild = document.createTextNode(child);

                beforeOrReplace(end, newChild, currentChild);

                currentChild = newChild;
              } else if (currentChild && currentChild.nodeValue !== child) {
                currentChild.nodeValue = child;
              }
            }
          }

          currentChild = currentChild?.nextSibling !== end
            ? (currentChild?.nextSibling ?? null)
            : null;
        }

        trim(currentChild, end);
      });
    }

    currentChild = nextChild;
  }

  if (hydrating) {
    trim(currentChild);
  }
}

function getBounds(
  target: Element | DocumentFragment,
  currentChild?: ChildNode | null,
  nextChild?: ChildNode | null,
) {
  let start: ChildNode | null = null;
  let end: ChildNode | null = null;

  if (currentChild && isStartComment(currentChild)) {
    start = currentChild;

    let nesting = 1;
    let next = start.nextSibling;

    while (next) {
      if (isStartComment(next)) {
        nesting += 1;
      }

      if (isEndComment(next)) {
        nesting -= 1;

        if (nesting === 0) {
          end = next;

          break;
        }
      }

      next = next.nextSibling;
    }
  }

  if (!start || !end) {
    start = document.createComment(START_COMMENT);
    end = document.createComment(END_COMMENT);

    appendOrReplace(target, start, currentChild);

    appendOrReplace(target, end, nextChild);
  }

  return [start, end];
}

function appendOrReplace(
  target: Element | DocumentFragment,
  newChild: ChildNode,
  currentChild?: ChildNode | null,
) {
  if (currentChild) {
    currentChild.replaceWith(newChild);
  } else {
    target.append(newChild);
  }
}

function beforeOrReplace(
  end: ChildNode,
  newChild: ChildNode,
  currentChild?: ChildNode | null,
) {
  if (currentChild) {
    currentChild.replaceWith(newChild);
  } else {
    end.before(newChild);
  }
}

function trim(currentChild?: ChildNode | null, end?: ChildNode | null) {
  while (currentChild && currentChild !== end) {
    const nextChild = currentChild?.nextSibling;

    currentChild.remove();

    currentChild = nextChild;
  }
}

function attr<T>(element: Element, key: string, value: HandcraftValue<T>) {
  mutate<Element>(
    element,
    (element) => {
      const v = resolveValue(value);

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
