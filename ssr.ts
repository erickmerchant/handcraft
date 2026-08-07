import { escape } from "@std/html/entities";
import type {
  HandcraftChild,
  HandcraftControlCallback,
  HandcraftNode,
  HandcraftNodeMethods,
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
    records: Array<[string, Array<any>]>,
  ) => {
    const methods: HandcraftNodeMethods = {
      effect(
        _cb: (...args: Array<any>) => void,
      ): void {
      },
      on(
        _events: string,
        _handler: EventListener,
        _options?: AddEventListenerOptions | boolean,
      ): void {
      },
      attr(
        key: string,
        value: HandcraftValue<string | number | boolean | null>,
      ): void {
        const resolved = resolveValue(
          value as HandcraftValue<string | boolean>,
        );

        if (resolved != null && resolved !== false) {
          if (resolved === true) {
            attributes[key] = "";
          } else {
            attributes[key] = resolved;
          }
        }
      },
      aria(
        key: string,
        value: HandcraftValue<string | number | boolean | null>,
      ): void {
        if (value != null) {
          const v = resolveValue(value);
          const k = `aria-${key}`;

          if (v === true || v === false) {
            attributes[k] = v ? "true" : "false";
          } else if (v != null) {
            attributes[k] = v.toString();
          }
        }
      },
      data(
        key: string,
        value: HandcraftValue<string | number | null>,
      ): void {
        if (value != null) {
          const v = resolveValue(value);
          const k = `data-${key}`;

          if (v != null) {
            attributes[k] = v.toString();
          }
        }
      },
      prop<T>(
        _key: string,
        _value: HandcraftValue<T>,
      ): void {
      },
      class(
        ...classes: Array<
          string | Record<string, HandcraftValue<boolean>>
        >
      ): void {
        const tokens = [];

        for (
          const val of classes as Array<
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
          attributes.class = list;
        }
      },
      part(
        ...parts: Array<
          string | Record<string, HandcraftValue<boolean>>
        >
      ): void {
        const tokens = [];

        for (
          const val of parts as Array<
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
          attributes.part = list;
        }
      },
      style(
        attrs: Record<
          string,
          HandcraftValue<string | number | null>
        >,
      ): void {
        const styles = [];

        for (const [k, v] of Object.entries(attrs)) {
          const resolved = resolveValue(v);

          if (resolved != null) styles.push(`${k}: ${resolved}`);
        }

        attributes.style = styles.join(";");
      },
      shadow(
        options: ShadowRootInit,
        children: Array<HandcraftChild>,
      ): void {
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
      },
    };

    for (const [key, value] of records ?? []) {
      if (key in methods) {
        // @ts-ignore{2556}
        methods[key as keyof typeof methods](...value);
      } else {
        // @ts-ignore{2556}
        methods.attr(key, ...value);
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
