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

export function render(node: HandcraftElementChild) {
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

  if (value.tag === "html" && value.namespace === "html") {
    result += "<!doctype html>";
  }

  if (value.tag != null) {
    result += "<" + value.tag;

    if (value.namespace !== "html" && value.tag === value.namespace) {
      result += ' xmlns="' + namespaces[value.namespace] + '"';
    }
  } else {
    result += `<template shadowrootmode="${value.options?.mode ?? "open"}"`;
  }

  const children = [];

  for (const child of value.children.flat(Infinity)) {
    if (!child) continue;

    if (
      child != null
    ) {
      if (typeof child === "object" && Symbol.iterator in child) {
        for (const c of child) {
          children.push(render(c()));
        }
      } else {
        children.push(render(typeof child === "function" ? child() : child));
      }
    }
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
        value.tag == null &&
        (typeof args[0] === "string" || typeof args[0] === "function")
      ) {
        css += getValue(args[0]);
      }

      continue;
    }

    if (typeof args[0] === "string" || typeof args[0] === "function") {
      result += getAttr(method, args[0]);
    }
  }

  result += ">";

  if (value.tag != null) {
    if (!VOID_ELEMENTS.includes(value.tag)) {
      result += children.join("") + "</" + value.tag + ">";
    }
  } else {
    if (css) {
      result += `<style>${escape(css)}</style>`;
    }

    result += children.join("") + `</template>`;
  }

  return result;
}

function getValue(value: HandcraftMethodValue) {
  return typeof value === "function" ? value() : value;
}

function getAttr(
  key: string,
  value: string | number | boolean | null | (() => HandcraftMethodValue),
) {
  const v = getValue(value);

  if (v != null && v !== false && v !== true) {
    return ` ${key}="${escape(v)}"`;
  } else if (v !== true) {
    return ` ${key}`;
  }

  return "";
}
