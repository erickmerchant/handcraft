import type { HandcraftNode, HandcraftTag } from "./types.ts";
import { watch } from "./reactivity.ts";
import html from "./html.ts";
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

    return html[name];
  }

  ssr = false;

  connectedCallback() {
    queueMicrotask(() => this.setup());
  }

  setup() {
    const tag = html[this.nodeName.toLocaleLowerCase()];
    const node = this.view(tag);

    if (node) render(node, this);
  }

  view(_host: HandcraftTag): HandcraftNode | void {
  }
}

export class HandcraftElementWithAttributes extends HandcraftElement {
  state: Record<string, any> = watch<Record<string, any>>({});

  attributeChangedCallback(
    key: string,
    previous: string | null,
    current: string | null,
  ) {
    if (previous === current) return;

    if (key in this.state) {
      switch (typeof this.state[key]) {
        case "number":
          this.state[key] = Number(current);
          break;
        case "boolean":
          this.state[key] = current === "";
          break;
        default:
          this.state[key] = current;
      }
    }
  }

  override setup() {
    const constructor = Object.getPrototypeOf(this).constructor;
    const observedAttributes: Array<string> = constructor?.observedAttributes ??
      [];

    for (const name of observedAttributes) {
      this.attributeChangedCallback(name, null, this.getAttribute(name));
    }

    super.setup();
  }
}
