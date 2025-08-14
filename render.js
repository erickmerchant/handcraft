import { namespaces, rawMap } from "./h.js";

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

function escape(str) {
  return `${str}`.replace(/[&<>"']/g, (k) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[k];
  });
}

export function render(node) {
  if (node == null) return "";

  if (typeof node !== "function") {
    return (typeof node === "symbol" ? rawMap.get(node) : null) ?? escape(node);
  }

  if (node.deref == null) {
    return "";
  }

  node = node.deref();

  let result = "";
  let css = "";

  if (node.tag === "html" && node.namespace === "html") {
    result += "<!doctype html>";
  }

  if (node.tag != null) {
    result += "<" + node.tag;

    if (node.namespace !== "html" && node.tag === node.namespace) {
      result += ' xmlns="' + namespaces[node.namespace] + '"';
    }
  } else {
    result += `<template shadowrootmode="${node.options?.mode ?? "open"}"`;
  }

  const children = [];

  for (const [key, ...values] of node.records) {
    if (key == null) {
      for (const child of values.flat(Infinity)) {
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
    } else {
      if (["on", "once", "command", "prop", "effect"].includes(key)) continue;

      if (key === "aria") {
        for (const [key, value] of Object.entries(values[0])) {
          result += getAttr(`aria-${key}`, value);
        }

        continue;
      }

      if (key === "data") {
        for (const [key, value] of Object.entries(values[0])) {
          result += ` data-${key}="${escape(getValue(value))}"`;
        }

        continue;
      }

      if (key === "class") {
        const classes = values.flat(Infinity);
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

      if (key === "style") {
        const styles = [];

        for (const [key, value] of Object.entries(values[0])) {
          styles.push(
            `${key}: ${getValue(value)}`,
          );
        }

        result += ' style="' + escape(styles.join("; ")) + '"';

        continue;
      }

      if (key === "css") {
        if (node.tag == null) {
          css += getValue(values[0]);
        }

        continue;
      }

      result += getAttr(key, values[0]);
    }
  }

  result += ">";

  if (node.tag != null) {
    if (!VOID_ELEMENTS.includes(node.tag)) {
      result += children.join("") + "</" + node.tag + ">";
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
