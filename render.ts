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

export function render(node: HandcraftNode): string {
  if (node == null) return "";

  if (typeof node !== "function") {
    return escape(node);
  }

  if (node.value == null) {
    return "";
  }

  const value = node.value;

  let result = "";
  let css = "";
  let html = "";

  if (value.tag === "html" && value.namespace === "html") {
    result += "<!doctype html>";
  }

  if (value.namespace != null) {
    result += "<" + value.tag;

    if (value.namespace !== "html" && value.tag === value.namespace) {
      result += ' xmlns="' + namespaces[value.namespace] + '"';
    }
  } else if (value.tag === "shadow") {
    result += `<template shadowrootmode="${value.options?.mode ?? "open"}"`;
  }

  for (const { method, args } of value.props) {
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
        value.tag === "shadow" &&
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

  if (value.tag !== "fragment") result += ">";

  if (value.tag === "shadow") {
    if (css) {
      result += `<style>${escape(css)}</style>`;
    }
  }

  if (html) {
    result += html;
  } else {
    for (const child of value.children.flat(Infinity)) {
      if (!child) continue;

      if (
        child != null
      ) {
        if (typeof child === "object" && Symbol.iterator in child) {
          for (const c of child) {
            const r = c();

            if (!r) continue;

            result += render(r);
          }
        } else {
          result += render(
            (typeof child === "function" &&
                (child as HandcraftElement).value == null
              ? child()
              : child) as HandcraftNode,
          );
        }
      }
    }
  }

  if (value.namespace != null && value.tag != null) {
    if (!VOID_ELEMENTS.includes(value.tag)) {
      result += "</" + value.tag + ">";
    }
  } else if (value.tag === "shadow") {
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
