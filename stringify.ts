import { escape } from "@std/html/entities";
import type {
  HandcraftChild,
  HandcraftControlCallback,
  HandcraftNode,
  HandcraftNodeState,
  HandcraftValue,
} from "./mod.ts";
import {
  definitions,
  h,
  isHandcraftNode,
  NODE_STATE,
  resolveValue,
} from "./mod.ts";

function esc(
  strs: ReadonlyArray<string>,
  ...values: Array<string | number>
): string {
  let result = "";

  for (const str of strs) {
    result += str;

    const value = values.shift();

    if (value) {
      result += escape(`${value}`);
    }
  }

  return result;
}

const voids = [
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

export function stringify(
  node: { [NODE_STATE]: HandcraftNodeState },
  escape: boolean = true,
): string {
  let result = "";
  let shadow = "";
  const state = node[NODE_STATE];

  const Definition = definitions.get(state.name);

  if (Definition) {
    const instance = new Definition();

    instance.ssr = true;

    const instanceNode = h.html[state.name]();

    instance.view(instanceNode);

    const instanceState = instanceNode[NODE_STATE];

    state.attributes.push(...instanceState.attributes);

    state.children = instanceState.children ?? state.children;
  }

  if (state.name === "html") result += "<!doctype html>";

  result += esc`<${state.name}`;

  for (const [key, value] of state.attributes ?? []) {
    switch (key) {
      case "effect":
      case "on":
      case "prop":
        break;
      case "style":
        {
          const [val] = value as [
            Record<
              string,
              HandcraftValue<string | number | null>
            >,
          ];

          const styles = [];

          for (const [k, v] of Object.entries(val)) {
            const resolved = resolveValue(v);

            if (resolved != null) styles.push(`${k}: ${resolved}`);
          }

          result += esc` style="${styles.join(";")}"`;
        }
        break;
      case "class":
      case "part":
        {
          const tokens = [];

          for (
            const val of value as Array<
              string | Record<string, HandcraftValue<boolean>>
            >
          ) {
            if (typeof val === "string") {
              tokens.push(val);
            } else {
              for (const [k, v] of Object.entries(val)) {
                const resolved = resolveValue(v);

                if (resolved) {
                  tokens.push(k);
                }
              }
            }
          }

          const list = tokens.join(" ");

          if (list) {
            result += esc` ${key}="${list}"`;
          }
        }
        break;
      case "attr":
        {
          const [k, val] = value as [
            string,
            HandcraftValue<string | number | boolean | null>,
          ];

          const resolved = resolveValue(
            val as unknown as HandcraftValue<string | boolean>,
          );

          if (resolved != null && resolved !== false) {
            if (resolved === true) {
              result += esc` ${k}`;
            } else {
              result += esc` ${k}="${resolved}"`;
            }
          }
        }
        break;
      case "aria":
        {
          const [key, val] = value as [
            string,
            HandcraftValue<string | number | boolean | null>,
          ];

          if (val != null) {
            const v = resolveValue(val);
            const k = `aria-${key}`;

            if (v === true || v === false) {
              result += esc` ${k}="${v ? "true" : "false"}"`;
            } else if (v != null) {
              result += esc` ${k}="${v}"`;
            }
          }
        }
        break;
      case "shadow":
        {
          const [options, children] = value as [
            ShadowRootInit,
            Array<HandcraftChild>,
          ];

          const node: HandcraftNodeState = {
            name: "template",
            namespace: "1999/xhtml",
            attributes: [],
            children,
          };

          for (const [key, value] of Object.entries(options)) {
            node.attributes.push(["attr", [`shadowroot${key}`, value]]);
          }

          shadow = stringify({ [NODE_STATE]: node }, escape);
        }

        break;
    }
  }

  result += ">";

  result += shadow;

  const children = nodes(state.children ?? [], escape);

  result += children;

  if (!voids.includes(state.name) || shadow || children) {
    result += esc`</${state.name}>`;
  }

  return result;
}

function nodes(children: Array<HandcraftChild>, escape: boolean): string {
  let result = "";

  for (const child of children ?? []) {
    if (child == null) continue;

    const fenced = typeof child !== "string" && !isHandcraftNode(child);

    if (fenced) {
      result += `<!-- <> -->`;
    }

    let items: Iterable<
      HandcraftControlCallback | HandcraftNode | string | null
    >;

    if (
      child != null && typeof child === "object" && Symbol.iterator in child
    ) {
      items = child;
    } else {
      items = [child];
    }

    for (const item of items) {
      const resolved = resolveValue(item);

      if (!resolved) continue;

      if (typeof resolved === "string") {
        result += escape ? esc`${resolved}` : resolved;
      } else if (resolved != null) {
        result += stringify(resolved, escape);
      }
    }

    if (fenced) {
      result += `<!-- </> -->`;
    }
  }

  return result;
}
