import type { HandcraftElement, HandcraftPrimitive } from "./types.ts";
import { h } from "./dom.ts";
import { watch } from "./reactivity.ts";

type Attributes = Record<string, HandcraftPrimitive>;

export function define<
  T extends Attributes = Record<PropertyKey, any>,
>(
  name: string,
  { connected, disconnected = (() => {}), ...attributes }: T & {
    connected: (this: T, el: Element) => void;
    disconnected?: (el: Element) => void;
  },
): HandcraftElement<Node> {
  const options: {
    name: string;
    attributes: Attributes;
    connected: (this: T, el: Element) => void;
    disconnected: (el: Element) => void;
  } = {
    name,
    connected,
    disconnected,
    attributes,
  };

  globalThis.customElements?.define?.(
    options.name,
    class extends HTMLElement {
      static observedAttributes = Object.keys(options.attributes);

      #attributes = watch<typeof options.attributes>(options.attributes);

      #set(key: string, value: string | null) {
        if (value == null) {
          this.#attributes[key] = options.attributes[key];
        } else {
          switch (typeof options.attributes[key]) {
            case "boolean":
              this.#attributes[key] = value !== "";
              break;
            case "number":
              this.#attributes[key] = +value;
              break;
            default:
              this.#attributes[key] = value;
          }
        }
      }

      constructor() {
        super();

        this.attachInternals();

        for (const key of Object.keys(options.attributes)) {
          this.#set(key, this.getAttribute(key));
        }
      }

      connectedCallback() {
        setTimeout(() => {
          options.connected.call(this.#attributes as T, this);
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
