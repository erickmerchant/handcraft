import type { HandcraftElement } from "./mod.ts";
import { h } from "./h.ts";
import { watch } from "./reactivity.ts";

export function define<T>(
  name: string,
  opts: {
    connected: (this: any, el: Element) => void;
    disconnected?: (el: Element) => void;
    attrs?: Record<string, number | string | boolean>;
  },
): HandcraftElement {
  const options: {
    name: string;
    attrs: Record<string, number | string | boolean>;
    connected: (this: typeof opts.attrs, el: Element) => void;
    disconnected: (el: Element) => void;
  } = {
    name,
    disconnected: () => {},
    attrs: {},
    ...opts,
  };

  globalThis.customElements?.define?.(
    options.name,
    class extends HTMLElement {
      static observedAttributes = Object.keys(options.attrs);

      #attrs = watch<typeof options.attrs>(options.attrs);

      #set(key: string, value: string | null) {
        if (value == null) {
          this.#attrs[key] = options.attrs[key];
        } else {
          switch (typeof options.attrs[key]) {
            case "boolean":
              this.#attrs[key] = value !== "";
              break;
            case "number":
              this.#attrs[key] = +value;
              break;
            default:
              this.#attrs[key] = value;
          }
        }
      }

      constructor() {
        super();

        for (const key of Object.keys(options.attrs)) {
          this.#set(key, this.getAttribute(key));
        }
      }

      connectedCallback() {
        setTimeout(() => {
          options.connected.call(this.#attrs, this);
        }, 0);
      }

      disconnectedCallback() {
        options.disconnected(this);
      }

      attributeChangedCallback(key: string, _: string, value: string) {
        this.#set(key, value);
      }
    },
  );

  return h.html[name];
}
