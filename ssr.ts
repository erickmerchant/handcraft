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

export function view(
  callback: (
    ...args: any
  ) => Response | HandcraftNode | Promise<Response | HandcraftNode>,
): () => Promise<Response | string> {
  return async (...args: any): Promise<Response | string> => {
    const response = await callback(...args);

    if (isHandcraftNode(response)) {
      return stringify(response);
    }

    return response;
  };
}

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
  const attributes: Record<string, string> = {};

  const loopAttributes = (
    records: Array<[string, any[] | Record<string, any>]>,
  ) => {
    for (const [key, value] of records ?? []) {
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

            attributes.style = styles.join(";");
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
              attributes[key] = list;
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
              val as HandcraftValue<string | boolean>,
            );

            if (resolved != null && resolved !== false) {
              if (resolved === true) {
                attributes[k] = "";
              } else {
                attributes[k] = resolved;
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
                attributes[k] = v ? "true" : "false";
              } else if (v != null) {
                attributes[k] = v.toString();
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
  };

  loopAttributes(state.attributes);

  if (state.name === "html") result += "<!doctype html>";

  result += esc`<${state.name}`;

  const Definition = definitions.get(state.name);

  if (Definition) {
    const instance = new Definition();

    instance.ssr = true;

    const constructor = Object.getPrototypeOf(instance).constructor;
    const observedAttributes: Array<string> = constructor?.observedAttributes ??
      [];
    const observedProperties: Array<string> = constructor?.observedProperties ??
      [];

    for (const name of [...observedAttributes, ...observedProperties]) {
      if (attributes[name] != null) {
        instance.attributeChangedCallback(
          name,
          null,
          attributes[name],
        );
      }
    }

    const instanceNode = h.html[state.name]();

    instance.view(instanceNode);

    const instanceState = instanceNode[NODE_STATE];

    loopAttributes(instanceState.attributes);

    state.children = instanceState.children ?? state.children;
  }

  for (const [key, value] of Object.entries(attributes)) {
    if (value === "") {
      result += esc` ${key}`;
    } else {
      result += esc` ${key}="${value}"`;
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

    let items: Iterable<
      HandcraftControlCallback | HandcraftNode | string | null
    >;

    if (
      child != null && typeof child === "object" && Symbol.iterator in child
    ) {
      result += `<!-- <> -->`;

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

    if (
      child != null && typeof child === "object" && Symbol.iterator in child
    ) {
      result += `<!-- </> -->`;
    }
  }

  return result;
}
