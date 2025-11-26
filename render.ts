import type { HandcraftNode, HandcraftValueArg } from "./mod.ts";
import { isHandcraftElement, VNODE } from "./mod.ts";

const VOID_ELEMENTS = [
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

function escape(str: { toString: () => string }): string {
  return `${str}`.replace(/[&<>"']/g, (k: string) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[k] ?? k;
  });
}

export async function render(node: HandcraftNode): Promise<string> {
  if (node == null) return "";

  if (typeof node !== "function") {
    return escape(node);
  }

  if (node[VNODE] == null) {
    return "";
  }

  const vnode = node[VNODE];

  let result = "";
  let html = "";

  if (vnode.tag === "html" && vnode.namespace === "1999/xhtml") {
    result += "<!doctype html>";
  }

  if (vnode.namespace != null) {
    result += "<" + vnode.tag;

    if (
      (vnode.tag === "svg" && vnode.namespace === "2000/svg") ||
      (vnode.tag === "math" && vnode.namespace === "1998/Math/MathML")
    ) {
      result += ' xmlns="http://www.w3.org/' + vnode.namespace + '"';
    }
  } else if (vnode.tag === "shadow") {
    result += `<template shadowrootmode="${vnode?.options?.mode ?? "open"}"`;
  }

  for (const { method, args } of vnode.props) {
    if (["on", "prop", "effect"].includes(method)) continue;

    if (method === "aria" && args[0] != null && typeof args[0] == "object") {
      for (const [key, value] of Object.entries(args[0])) {
        result += getAttr(`aria-${key}`, value);
      }

      continue;
    }

    if (method === "class") {
      const classes = args.flat(Infinity);
      const list = [];

      for (let c of classes) {
        if (typeof c === "string") {
          c = { [c]: true };
        }

        if (c != null && typeof c == "object") {
          for (const [key, value] of Object.entries(c)) {
            for (const k of key.split(" ")) {
              if (value) {
                list.push(k);
              }
            }
          }
        }
      }

      result += ` class="${escape(list.join(" "))}"`;

      continue;
    }

    if (method === "style" && args[0] != null && typeof args[0] == "object") {
      const styles = [];

      for (const [key, value] of Object.entries(args[0])) {
        styles.push(`${key}: ${getValue(value)}`);
      }

      result += ' style="' + escape(styles.join("; ")) + '"';

      continue;
    }

    if (method === "html") {
      if (typeof args[0] === "string" || typeof args[0] === "function") {
        html += getValue(args[0]);
      }

      continue;
    }

    if (
      method === "attr" && typeof args[0] === "string" &&
      (typeof args[1] === "string" || typeof args[1] === "function")
    ) {
      result += getAttr(args[0], args[1]);

      continue;
    }

    if (
      typeof args[0] === "string" || typeof args[0] === "number" ||
      args[0] == null || typeof args[0] === "function"
    ) {
      result += getAttr(method, args[0]);
    }
  }

  if (vnode.tag !== "fragment") result += ">";

  if (html) {
    result += html;
  } else {
    for (const child of vnode.children) {
      if (!child) continue;

      if (child != null) {
        if (typeof child === "object" && Symbol.iterator in child) {
          for (const c of child) {
            const r = await c();

            if (!r) continue;

            result += await render(r);
          }
        } else {
          result += await render(
            typeof child === "function" &&
              !isHandcraftElement(child)
              ? child()
              : child,
          );
        }
      }
    }
  }

  if (vnode.namespace != null && vnode.tag != null) {
    if (!VOID_ELEMENTS.includes(vnode.tag)) {
      result += "</" + vnode.tag + ">";
    }
  } else if (vnode.tag === "shadow") {
    result += `</template>`;
  }

  return result;
}

function getValue<T = HandcraftValueArg>(value: T) {
  return (typeof value === "function" ? value() : value);
}

function getAttr(
  key: string,
  value:
    | string
    | number
    | boolean
    | null
    | (() => string | number | boolean | null),
) {
  const v = getValue(value);

  if (v != null && v !== false && v !== true) {
    return ` ${key}="${escape(v)}"`;
  } else if (v !== true) {
    return ` ${key}`;
  }

  return "";
}
