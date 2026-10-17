import type { HandcraftControlCallback, HandcraftNode } from "./support.ts";
import { run } from "./reactivity.ts";

export function render(
  node: HandcraftNode,
  target: Element | DocumentFragment,
) {
  const state = node.state;

  if (target instanceof Element) {
    let current = target.firstChild;

    for (const v of state?.nodes ?? []) {
      current = v(
        target,
        current,
      ) ?? current;

      current = current?.nextSibling ?? null;
    }
  }
}

export function mutate<T extends object>(
  element: T,
  callback: (
    element: T,
  ) => void,
) {
  const el = new WeakRef(element);

  run(() => {
    const e = el.deref();

    if (e) {
      callback(e);
    }
  });
}

export function controlCallback(
  iterable: Iterable<HandcraftControlCallback>,
): (
  target: Element,
  current?: ChildNode | null,
) => ChildNode | null {
  return (
    target: Element,
    current?: ChildNode | null,
  ): ChildNode | null => {
    const [start, end] = getBounds(target, current, current?.nextSibling);
    const weakBounds = [start, end].map((c) => new WeakRef(c));

    mutate(target, () => {
      const [start, end] = weakBounds.map((b) => b.deref());

      for (const control of iterable) {
        if (!start || !end) return;

        let current: ChildNode | null = start && start?.nextSibling !== end
          ? start?.nextSibling
          : null;

        const node = control();

        if (!node) continue;

        node(target, current);

        current = current?.nextSibling !== end
          ? (current?.nextSibling ?? null)
          : null;
      }

      trim(current, end);
    });

    return end;
  };
}

const START_COMMENT = " <> ";
const END_COMMENT = " </> ";

export function isCommentWithSpecificValue(
  currentChild: ChildNode,
  value: string,
): boolean {
  return currentChild?.nodeType === Node.COMMENT_NODE &&
    currentChild.nodeValue === value;
}

export function appendOrReplaceComment(
  target: Element | DocumentFragment,
  text: string,
  currentChild?: ChildNode | null,
): Comment {
  const comment = document.createComment(text);

  appendOrReplace(target as ChildNode, comment, currentChild);

  return comment;
}

export function getBounds(
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

export function trim(currentChild?: ChildNode | null, end?: ChildNode | null) {
  while (currentChild && currentChild !== end) {
    const nextChild = currentChild?.nextSibling;

    currentChild.remove();

    currentChild = nextChild;
  }
}

export function appendOrReplace(
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
