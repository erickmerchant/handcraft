import { h } from "./mod.js";
import { $ } from "./dollar.js";

export function define(name) {
  const options = {
    name,
    setup: () => {},
    teardown: () => {},
  };

  queueMicrotask(() => {
    const BaseClass = options.extends
      ? document.creatElement(options.extends).constructor
      : HTMLElement;

    customElements.define(
      options.name,
      class extends BaseClass {
        connectedCallback() {
          options.setup($(this));
        }

        disconnectedCallback() {
          options.teardown($(this));
        }
      },
      options.extends ? { extends: options.extends } : null,
    );
  });

  const tag = h.html[name];
  const factory = {
    setup: (cb) => {
      options.setup = cb;

      return proxy;
    },
    teardown: (cb) => {
      options.teardown = cb;

      return proxy;
    },
    extends: (name) => {
      options.extends = name;

      return proxy;
    },
  };
  const proxy = new Proxy(() => {}, {
    apply(_, __, children) {
      return tag(children);
    },
    get(_, key) {
      if (key in factory) {
        return factory[key];
      }

      return tag[key];
    },
  });

  return proxy;
}
