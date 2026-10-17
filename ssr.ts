import { escape } from "@std/html/entities";
import type {
  HandcraftControlCallback,
  HandcraftNode,
  HandcraftState,
} from "./support.ts";
import { definitions } from "./element.ts";
import { h, namespace_html } from "./h.ts";
import { resolveValue } from "./support.ts";

export function view(
  callback: (
    ...args: any
  ) => Response | HandcraftNode | Promise<Response | HandcraftNode>,
): () => Promise<Response | string> {
  return async (...args: any): Promise<Response | string> => {
    const response = await callback(...args);

    if (!(response instanceof Response)) {
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
  node: { state: HandcraftState },
  escape: boolean = true,
): string {
  let result = "";
  const state = node.state;

  const attributes: Record<string, string> = {};

  const loopAttributes = (
    nodes: Array<HandcraftNode>,
  ) => {
    for (const node of nodes) {
      if (node.state.type === "attr" && node.state.name) {
        const v = resolveValue(node.state.value);

        if (v === true || v === false || v === null) {
          if (v) {
            attributes[node.state.name] = "";
          }
        } else {
          attributes[node.state.name] = v;
        }
      }
    }
  };

  if (state.name) {
    loopAttributes(state.nodes ?? []);

    if (state.name === "html") result += "<!doctype html>";

    result += esc`<${state.name}`;

    const Definition = definitions.get(state.name);

    if (Definition) {
      const instance = new Definition();

      instance.ssr = true;

      const constructor = Object.getPrototypeOf(instance).constructor;
      const observedAttributes: Array<string> =
        constructor?.observedAttributes ??
          [];

      for (const name of observedAttributes) {
        if (attributes[name] != null) {
          instance.attributeChangedCallback(
            name,
            null,
            attributes[name],
          );
        }
      }

      const tag = h(namespace_html)[state.name];
      const instanceNode = instance.view(tag);

      if (instanceNode) {
        const instanceState = instanceNode.state;

        loopAttributes(instanceState.nodes ?? []);

        let nodes;

        if (state.nodes?.length) {
          const instanceNodes = instanceState.nodes?.filter?.(({ state }) =>
            state.type === "shadow" || state.type === "attr"
          ) ?? [];

          nodes = instanceNodes.concat(state.nodes ?? []);
        } else {
          nodes = instanceState.nodes ?? [];
        }

        state.nodes = nodes;
      }
    }

    for (const [key, value] of Object.entries(attributes)) {
      if (value === "") {
        result += esc` ${key}`;
      } else {
        result += esc` ${key}="${value}"`;
      }
    }

    result += ">";

    const children = nodes(state.nodes ?? [], escape);

    result += children;

    if (!voids.includes(state.name) || children) {
      result += esc`</${state.name}>`;
    }
  }

  return result;
}

function nodes(nodes: Array<HandcraftNode>, escape: boolean): string {
  let result = "";

  try {
    for (const node of nodes ?? []) {
      if (node == null) continue;

      if (node.state.type === "shadow") {
        const state: HandcraftState = {
          type: "node",
          name: "template",
          namespace: "http://www.w3.org/1999/xhtml",
          nodes: node.state.nodes,
        };

        for (const [key, value] of Object.entries(node.state.options ?? {})) {
          state.nodes!.push({
            state: {
              type: "attr",
              name: `shadowroot${key}`,
              value,
            },
          } as HandcraftNode);
        }

        result += stringify({ state: state }, escape);
      } else if (node.state.type === "text") {
        result += node.state.text ?? "";
      } else if (node.state.type === "node") {
        result += stringify(node, escape);
      } else if (
        Symbol.iterator in node
      ) {
        result += `<!-- <> -->`;

        for (const item of node as Iterable<HandcraftControlCallback>) {
          const c = item();

          if (c == null) continue;

          result += stringify(c, escape);
        }

        result += `<!-- </> -->`;
      }
    }
  } catch (_e) {
    // console.error(e);
  }

  return result;
}
