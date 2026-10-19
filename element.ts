import type { HandcraftNode, HandcraftTag } from "./mod.ts";
import { watch } from "./reactivity.ts";
import { h, namespace_html } from "./h.ts";
import { render } from "./render.ts";

if (!globalThis.HTMLElement) {
  // @ts-ignore{2322}
  globalThis.HTMLElement = class {};
}

export const definitions: Map<string, (new () => HandcraftElement)> = new Map();

export class HandcraftElement extends HTMLElement {
  static define(name: string): HandcraftTag {
    globalThis.customElements?.define?.(name, this);

    definitions.set(name, this);

    return h(namespace_html)[name];
  }

  ssr = false;

  connectedCallback() {
    queueMicrotask(() => this.setup());
  }

  setup() {
    const tag = h(namespace_html)[this.nodeName.toLocaleLowerCase()];
    const node = this.view(tag);

    if (node) render(node, this);
  }

  view(_host: HandcraftTag): HandcraftNode | void {
  }
}

export class HandcraftElementWithAttributes extends HandcraftElement {
  #state: Record<string, any> = watch<Record<string, any>>({});

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

  override setup() {
    const constructor = Object.getPrototypeOf(this).constructor;
    const observedAttributes: Array<string> = constructor?.observedAttributes ??
      [];

    for (const name of observedAttributes) {
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

    super.setup();
  }
}
