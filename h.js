import { watch } from "./reactivity.js";

export const namespaces = {
  html: "http://www.w3.org/1999/xhtml",
  svg: "http://www.w3.org/2000/svg",
  math: "http://www.w3.org/1998/Math/MathML",
};

function create(tag, namespace, options) {
  const el = {
    tag,
    namespace,
    options,
    records: watch([]),
  };

  const proxy = new Proxy(() => {}, {
    apply(_, __, args) {
      el.records.push([null, ...args]);

      return proxy;
    },
    get(_, key) {
      if (key === "then") {
        return undefined;
      }

      if (key === "toJSON" || key === "deref") {
        return () => el;
      }

      return (...args) => {
        el.records.push([key, ...args]);

        return proxy;
      };
    },
  });

  return proxy;
}

function factory(namespace) {
  return new Proxy(
    {},
    {
      get(_, tag) {
        return new Proxy(() => {}, {
          apply(_, __, args) {
            const el = create(tag, namespace);

            return el(...args);
          },
          get(_, key) {
            const el = create(tag, namespace);

            return el[key];
          },
        });
      },
    },
  );
}

export const h = {
  html: factory("html"),
  svg: factory("svg"),
  math: factory("math"),
};

export function shadow(options) {
  return create(null, null, options);
}

export const rawMap = new WeakMap();

export function raw(str) {
  const symbol = Symbol("raw");

  rawMap.set(symbol, str);

  return symbol;
}
