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
  options?: Record<string, string>,
): HandcraftElement {
  const vnode: HandcraftElementValue = {
    tag,
    namespace,
    options,
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
          vnode.props.push({ method: key, args });
        }

        return proxy;
      };
    },
  }) as HandcraftElement;

  return proxy;
}

function factory(namespace: string): Record<string, HandcraftElement> {
  return new Proxy(
    {},
    {
      get(_, tag: string) {
        return new Proxy(() => {}, {
          apply(_, __, args) {
            const el = create(tag, namespace);

            return el(...args);
          },
          get(_, key: string) {
            const el = create(tag, namespace);

            return el[key as keyof typeof el];
          },
        });
      },
    },
  ) as Record<string, HandcraftElement>;
}

export const h: Record<
  "html" | "svg" | "math",
  Record<string, HandcraftElement>
> = {
  html: factory("html"),
  svg: factory("svg"),
  math: factory("math"),
};

export function shadow(options?: Record<string, string>): HandcraftElement {
  return create("shadow", undefined, options);
}

export function fragment(): HandcraftElement {
  return create("fragment", undefined);
}
