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
) {
  const el: HandcraftAbstractNode = {
    tag,
    namespace,
    options,
    props: watch([]),
    children: watch([]),
  };

  const proxy = new Proxy(() => {}, {
    apply(_, __, args: Array<HandcraftMethodChild>) {
      el.children.push(...args);

      return proxy;
    },
    get(_, method: string) {
      if (method === "then") {
        return undefined;
      }

      if (method === "toJSON" || method === "deref") {
        return () => el;
      }

      return (
        ...args: Array<HandcraftMethodValue | HandcraftMethodRecordValue>
      ) => {
        el.props.push({ method, args });

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

export const h = {
  html: factory("html"),
  svg: factory("svg"),
  math: factory("math"),
};

export function shadow(options: Record<string, string>) {
  return create(undefined, undefined, options);
}
