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

  hydrating = true;
  ssr = false;

  attributeChangedCallback(k: string, o: string | null, n: string | null) {
    if (o !== n) {
      let value;

      const type = k in this ? typeof this[k as keyof typeof this] : "string";

      if (n == null) {
        value = null;
      } else if (type === "boolean") {
        value = n === "";
      } else if (type === "number") {
        value = +n;
      } else {
        value = n;
      }

      if (k in this) {
        // @ts-ignore{2322}
        this[k as keyof typeof this] = value;
      }
    }
  }

  connectedCallback() {
    queueMicrotask(() => this.setup());
  }

  setup() {
    const constructor = Object.getPrototypeOf(this).constructor;

    for (const key of constructor.observedAttributes ?? []) {
      this.attributeChangedCallback(
        key,
        null,
        this.getAttribute(key),
      );
    }

    const node = h.html[this.nodeName.toLocaleLowerCase()]();

    this.view(node);

    render(node, this, this.hydrating);

    this.hydrating = false;
  }

  view(_host: HandcraftNode): void {
  }
}

const states = new WeakMap<HandcraftElement, Record<string | symbol, any>>();

function store(target: HandcraftElement) {
  let state = states.get(target);

  if (!state) {
    state = watch<Record<string | symbol, any>>({});

    states.set(target, state);
  }

  return state;
}

export function reactive(): (
  target: ClassAccessorDecoratorTarget<HandcraftElement, any>,
  context: ClassAccessorDecoratorContext<HandcraftElement, any>,
) => ClassAccessorDecoratorResult<HandcraftElement, any> {
  return function (
    _target,
    context: ClassAccessorDecoratorContext<HandcraftElement, any>,
  ): ClassAccessorDecoratorResult<any, any> {
    return {
      set(value: any) {
        const state = store(this);

        state[context.name] = value;
      },
      get() {
        const state = store(this);

        return state[context.name];
      },
      init(value: any) {
        const state = store(this);

        state[context.name] = value;

        return value;
      },
    };
  };
}
