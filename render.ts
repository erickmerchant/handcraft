import type { HandcraftNode, HandcraftValueArg } from "./mod.ts";
import { isHandcraftElement, VNODE } from "./mod.ts";
import { namespaces } from "./h.ts";

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
  let css = "";
  let html = "";

  if (vnode.tag === "html" && vnode.namespace === "html") {
    result += "<!doctype html>";
  }

  if (vnode.namespace != null) {
    result += "<" + vnode.tag;

    if (vnode.namespace !== "html" && vnode.tag === vnode.namespace) {
      result += ' xmlns="' + namespaces[vnode.namespace] + '"';
    }
  } else if (vnode.tag === "shadow") {
    result += `<template shadowrootmode="${vnode.options?.mode ?? "open"}"`;
  }

  for (const { method, args } of vnode.props) {
    if (["on", "once", "command", "prop", "effect"].includes(method)) continue;

    if (method === "aria" && args[0] != null && typeof args[0] == "object") {
      for (const [key, value] of Object.entries(args[0])) {
        result += getAttr(`aria-${key}`, value);
      }

      continue;
    }

    if (method === "data" && args[0] != null && typeof args[0] == "object") {
      for (const [key, value] of Object.entries(args[0])) {
        if (typeof value === "string" || typeof value === "function") {
          result += ` data-${key}="${escape({ toString: () => `${value}` })}"`;
        }
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
        styles.push(
          `${key}: ${getValue(value)}`,
        );
      }

      result += ' style="' + escape(styles.join("; ")) + '"';

      continue;
    }

    if (method === "css") {
      if (
        vnode.tag === "shadow" &&
        (typeof args[0] === "string" || typeof args[0] === "function")
      ) {
        css += getValue(args[0]);
      }

      continue;
    }

    if (method === "html") {
      if (
        (typeof args[0] === "string" || typeof args[0] === "function")
      ) {
        html += getValue(args[0]);
      }

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

  if (vnode.tag === "shadow") {
    if (css) {
      result += `<style>${escape(css)}</style>`;
    }
  }

  if (html) {
    result += html;
  } else {
    for (const child of vnode.children.flat(Infinity)) {
      if (!child) continue;

      if (
        child != null
      ) {
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

function getValue(value: HandcraftValueArg) {
  return typeof value === "function" ? value() : value;
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
