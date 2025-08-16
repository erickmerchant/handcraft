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

export function render(node: HandcraftElement | string | null) {
  if (node == null) return "";

  if (typeof node !== "function") {
    return escape(node);
  }

  if (node.deref == null) {
    return "";
  }

  const anode = node.deref();

  let result = "";
  let css = "";

  if (anode.tag === "html" && anode.namespace === "html") {
    result += "<!doctype html>";
  }

  if (anode.tag != null) {
    result += "<" + anode.tag;

    if (anode.namespace !== "html" && anode.tag === anode.namespace) {
      result += ' xmlns="' + namespaces[anode.namespace] + '"';
    }
  } else {
    result += `<template shadowrootmode="${anode.options?.mode ?? "open"}"`;
  }

  const children = [];

  for (const child of anode.children.flat(Infinity)) {
    if (!child) continue;

    if (
      child != null && typeof child === "object" &&
      child[Symbol.iterator] != null
    ) {
      for (const c of child) {
        children.push(render(c()));
      }
    } else {
      children.push(render(child));
    }
  }

  for (const { method, args } of anode.props) {
    if (["on", "once", "command", "prop", "effect"].includes(method)) continue;

    if (method === "aria") {
      for (const [key, value] of Object.entries(args[0])) {
        result += getAttr(`aria-${key}`, value);
      }

      continue;
    }

    if (method === "data") {
      for (const [key, value] of Object.entries(args[0])) {
        result += ` data-${key}="${escape(getValue(value))}"`;
      }

      continue;
    }

    if (method === "class") {
      const classes = args.flat(Infinity);
      const list = [];

      for (let c of classes) {
        if (typeof c !== "object") {
          c = { [c]: true };
        }

        for (const [key, value] of Object.entries(c)) {
          for (const k of key.split(" ")) {
            if (value) {
              list.push(k);
            }
          }
        }
      }

      result += ` class="${escape(list.join(" "))}"`;

      continue;
    }

    if (method === "style") {
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
      if (anode.tag == null) {
        css += getValue(args[0]);
      }

      continue;
    }

    result += getAttr(method, args[0]);
  }

  result += ">";

  if (anode.tag != null) {
    if (!VOID_ELEMENTS.includes(anode.tag)) {
      result += children.join("") + "</" + anode.tag + ">";
    }
  } else {
    if (css) {
      result += `<style>${escape(css)}</style>`;
    }

    result += children.join("") + `</template>`;
  }

  return result;
}

function getValue(value) {
  return typeof value === "function" ? value() : value;
}

function getAttr(key, value) {
  const v = getValue(value);

  if (v != null && v !== false && v !== true) {
    return ` ${key}="${escape(v)}"`;
  } else if (v !== true) {
    return ` ${key}`;
  }

  return "";
}
