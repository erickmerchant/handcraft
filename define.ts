import type {
  HandcraftChildArg,
  HandcraftElement,
  HandcraftObservedElement,
} from "./mod.ts";
import { h } from "./mod.ts";
import { $ } from "./dollar.ts";

type DefineLifeCycleCallback = (el: HandcraftObservedElement) => void;

export type DefineFactory = {
  setup: (cb: DefineLifeCycleCallback) => DefineAPI;
  teardown: (cb: DefineLifeCycleCallback) => DefineAPI;
};

type DefineAPI = HandcraftElement & DefineFactory;

export function define(name: string): DefineFactory {
  const options: {
    name: string;
    setup: DefineLifeCycleCallback;
    teardown: DefineLifeCycleCallback;
  } = {
    name,
    setup: () => {},
    teardown: () => {},
  };

  queueMicrotask(() => {
    customElements.define(
      options.name,
      class extends HTMLElement {
        connectedCallback() {
          options.setup($(this));
        }

        disconnectedCallback() {
          options.teardown($(this));
        }
      },
    );
  });

  const tag = h.html[name];
  const factory: DefineFactory = {
    setup: (cb: DefineLifeCycleCallback) => {
      options.setup = cb;

      return proxy;
    },
    teardown: (cb: DefineLifeCycleCallback) => {
      options.teardown = cb;

      return proxy;
    },
  };
  const proxy = new Proxy(() => {}, {
    apply(_, __, children: Array<HandcraftChildArg>) {
      return tag(...children);
    },
    get(_, key) {
      if (typeof key === "string" && key in factory) {
        return factory[key as keyof DefineFactory];
      }

      if (typeof key === "string" && key in tag) {
        return tag[key as keyof HandcraftElement];
      }

      return null;
    },
  }) as DefineAPI;

  return proxy;
}
