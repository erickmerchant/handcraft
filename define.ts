import { h } from "./mod.ts";
import { $ } from "./dollar.ts";

export function define(name: string): HandcraftDefineFactory {
  const options: {
    name: string;
    setup: HandcraftDefineLifeCycleCallback;
    teardown: HandcraftDefineLifeCycleCallback;
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
  const factory: HandcraftDefineFactory = {
    setup: (cb: HandcraftDefineLifeCycleCallback) => {
      options.setup = cb;

      return proxy;
    },
    teardown: (cb: HandcraftDefineLifeCycleCallback) => {
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
        return factory[key as keyof typeof factory];
      }

      if (typeof key === "string" && key in tag) {
        return tag[key as keyof typeof tag];
      }

      return null;
    },
  }) as HandcraftDefineAPI;

  return proxy;
}
