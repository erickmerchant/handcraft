import type { HandcraftPrimitive } from "./types.ts";
import { watch } from "./reactivity.ts";

type Attributes = Record<string, HandcraftPrimitive>;

export function define<
  T extends Attributes = Record<PropertyKey, any>,
>(
  name: string,
  { connected, disconnected = (() => {}), extend, ...attributes }: T & {
    connected: (this: T, el: Element) => void;
    disconnected?: (el: Element) => void;
    extend?: string;
  },
): void {
  const options: {
    name: string;
    extend?: string;
    attributes: Attributes;
    connected: (this: T, el: Element) => void;
    disconnected: (el: Element) => void;
  } = {
    name,
    extend,
    connected,
    disconnected,
    attributes,
  };

  const BaseClass =
    (options.extend != null
      ? document.createElement(options.extend).constructor
      : HTMLElement) as CustomElementConstructor;

  globalThis.customElements?.define?.(
    options.name,
    class extends BaseClass {
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

        // this.attachInternals();

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
    { extends: options.extend },
  );
}
