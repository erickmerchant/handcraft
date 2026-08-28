import type { HandcraftNode } from "./types.ts";
import { watch } from "./reactivity.ts";
import { h } from "./h.ts";
import { render } from "./render.ts";

if (!globalThis.HTMLElement) {
  // @ts-ignore{2322}
  globalThis.HTMLElement = class {};
}

export const definitions: Map<string, (new () => HandcraftElement)> = new Map();

export class HandcraftElement extends HTMLElement {
  static define(name: string): HandcraftNode {
    globalThis.customElements?.define?.(name, this);

    definitions.set(name, this);

    return h.html[name];
  }

  #state: Record<string, any> = watch<Record<string, any>>({});
  hydrating = true;
  ssr = false;

  attributeChangedCallback(k: string, o: string | null, n: string | null) {
    if (o === n) return;

    if (Object.hasOwn(this, k)) {
      let value;
      const type = typeof this[k as keyof typeof this];

      if (n == null) {
        value = null;
      } else if (type === "boolean") {
        value = n === "";
      } else if (type === "number") {
        value = +n;
      } else {
        value = n;
      }

      // @ts-ignore{2322}
      this[k as keyof typeof this] = value;
    }
  }

  connectedCallback() {
    queueMicrotask(() => this.setup());
  }

  setup() {
    const constructor = Object.getPrototypeOf(this).constructor;
    const observedAttributes: Array<string> = constructor?.observedAttributes ??
      [];
    const observedProperties: Array<string> = constructor?.observedProperties ??
      [];

    for (const name of [...observedAttributes, ...observedProperties]) {
      this.attributeChangedCallback(name, null, this.getAttribute(name));

      this.#state[name] = this[name as keyof typeof this];

      const descriptor = Object.getOwnPropertyDescriptor(this, name);

      if (!descriptor || !descriptor.enumerable) continue;

      Object.defineProperty(this, name, {
        set: descriptor.set ?? ((val) => {
          this.#state[name] = val;
        }),
        get: descriptor.get ?? (() => {
          return this.#state[name];
        }),
      });
    }

    const node = h.html[this.nodeName.toLocaleLowerCase()]();

    this.view(node);

    render(node, this, this.hydrating);

    this.hydrating = false;
  }

  view(_host: HandcraftNode): void {
  }
}
