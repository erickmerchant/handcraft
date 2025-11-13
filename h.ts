import type {
  HandcraftChildArg,
  HandcraftElement,
  HandcraftElementValue,
  HandcraftValueArg,
  HandcraftValueRecordArg,
} from "./mod.ts";
import { VNODE } from "./mod.ts";
import { watch } from "./reactivity.ts";

export const namespaces: Record<string, string> = {
  html: "http://www.w3.org/1999/xhtml",
  svg: "http://www.w3.org/2000/svg",
  math: "http://www.w3.org/1998/Math/MathML",
};

function create(
  tag?: string,
  namespace?: string,
): HandcraftElement {
  const vnode: HandcraftElementValue = {
    tag,
    namespace,
    props: watch([]),
    children: watch([]),
  };

  const proxy = new Proxy(() => {}, {
    apply(_, __, args: Array<HandcraftChildArg>) {
      vnode.children.push(...args);

      return proxy;
    },
    has(_target, key) {
      return key === VNODE;
    },
    get(_, key: string | symbol) {
      if (key === "then") {
        return undefined;
      }

      if (key === "toJSON") {
        return () => vnode;
      }

      if (key === VNODE) {
        return vnode;
      }

      return (
        ...args: Array<HandcraftValueArg | HandcraftValueRecordArg>
      ) => {
        if (typeof key === "string") {
          if (
            args.length === 1 && key === "options" && args[0] &&
            typeof args[0] === "object"
          ) {
            vnode.options = args[0];
          } else {
            vnode.props.push({ method: key, args });
          }
        }

        return proxy;
      };
    },
  }) as HandcraftElement;

  return proxy;
}

function factory(tag: string, namespace?: string) {
  return new Proxy(() => {}, {
    apply(_, __, args) {
      const el = create(tag, namespace);

      return el(...args);
    },
    get(_, key: string) {
      const el = create(tag, namespace);

      return el[key as keyof HandcraftElement];
    },
  }) as HandcraftElement;
}

function factoryNS(namespace: string): Record<string, HandcraftElement> {
  return new Proxy(
    {},
    {
      get(_, tag: string) {
        return factory(tag, namespace);
      },
    },
  ) as Record<string, HandcraftElement>;
}

export const h: Record<
  "html" | "svg" | "math",
  Record<string, HandcraftElement>
> = {
  html: factoryNS("html"),
  svg: factoryNS("svg"),
  math: factoryNS("math"),
};

export const shadow = factory("shadow") as HandcraftElement;

export const fragment = factory("fragment") as HandcraftElement;
