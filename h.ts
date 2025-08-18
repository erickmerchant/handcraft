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
  const value: HandcraftElementValue = {
    tag,
    namespace,
    options,
    props: watch([]),
    children: watch([]),
  };

  const proxy = new Proxy(() => {}, {
    apply(_, __, args: Array<HandcraftMethodChild>) {
      value.children.push(...args);

      return proxy;
    },
    get(_, key: string) {
      if (key === "then") {
        return undefined;
      }

      if (key === "toJSON") {
        return () => value;
      }

      if (key === "value") {
        return value;
      }

      return (
        ...args: Array<HandcraftMethodValue | HandcraftMethodRecordValue>
      ) => {
        value.props.push({ method: key, args });

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

export function shadow(options: Record<string, string>): HandcraftElement {
  return create(undefined, undefined, options);
}
