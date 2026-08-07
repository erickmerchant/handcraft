import type {
  HandcraftChild,
  HandcraftNode,
  HandcraftNodeFactoryNS,
  HandcraftNodeState,
} from "./types.ts";
import { NODE_STATE } from "./types.ts";

export function factory(
  name: string,
  namespace: string,
): HandcraftNode {
  const vnode: HandcraftNodeState = {
    namespace,
    name,
    attributes: [],
  };

  const proxy = new Proxy(() => {}, {
    apply(_, __, args: Array<HandcraftChild>) {
      if (args.length) {
        vnode.children ??= [];

        vnode.children.push(...args);
      }

      return proxy;
    },
    has(_target, key) {
      return key === NODE_STATE;
    },
    get(_, key: string | symbol) {
      if (key === "then") {
        return undefined;
      }

      if (key === NODE_STATE) {
        return vnode;
      }

      return (...args: Array<any>) => {
        if (typeof key === "string") {
          vnode.attributes.push([key, args]);
        }

        return proxy;
      };
    },
  }) as HandcraftNode;

  return proxy;
}

function factoryNS(namespace: string): HandcraftNodeFactoryNS {
  return new Proxy(
    {},
    {
      get(_, name: string) {
        return new Proxy(() => {}, {
          apply(_, __, args) {
            const el = factory(name, namespace);

            return el(...args);
          },
          get(_, key: string) {
            const el = factory(name, namespace);

            return el[key as keyof HandcraftNode];
          },
        }) as HandcraftNode;
      },
    },
  ) as HandcraftNodeFactoryNS;
}

export const h: {
  html: HandcraftNodeFactoryNS;
  svg: HandcraftNodeFactoryNS;
  math: HandcraftNodeFactoryNS;
} = {
  html: factoryNS("1999/xhtml"),
  svg: factoryNS("2000/svg"),
  math: factoryNS("1998/Math/MathML"),
};
