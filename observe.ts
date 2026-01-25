import type { HandcraftElement } from "./mod.ts";
import { inEffect, watch } from "./reactivity.ts";
import { $ } from "./dollar.ts";

const observerCache: WeakMap<
  Node,
  { attributes: Record<string, any>; children: Record<string, any> }
> = new WeakMap();

type ObserveAPI = {
  (...selector: Array<string>): Array<HandcraftElement>;
} & Record<string, string | undefined>;

let observer: MutationObserver;

export function observe(element: Element): ObserveAPI {
  observer ??= new MutationObserver((records) => {
    for (const record of records) {
      const results = observerCache.get(record.target);

      if (!results || !(record.target instanceof Element)) continue;

      const attributeName = record.attributeName;

      if (attributeName) {
        results.attributes[`[${attributeName as string}]`] = record.target
          .getAttribute(
            attributeName as string,
          );
      }

      const addedNodes = [...record.addedNodes];

      if (addedNodes.length) {
        for (const selector of Object.keys(results.children)) {
          for (
            const result of record.target.querySelectorAll(
              selector,
            )
          ) {
            if (addedNodes.includes(result)) {
              results.children[selector] = results.children[selector].concat(
                result,
              );
            }
          }
        }
      }
    }
  });

  let cache = element
    ? observerCache.get(element)
    : { attributes: {}, children: {} };

  function observe<T>(
    type: "children" | "attributes",
    key: string,
    value: () => T,
  ): T {
    if (!inEffect() || !element) {
      return value();
    }

    if (!cache) {
      cache = { attributes: watch({}), children: watch({}) };

      observerCache.set(element, cache);

      observer.observe(element, {
        attributes: true,
        subtree: true,
        childList: true,
      });
    }

    if (!cache[type][key]) {
      cache[type][key] = value();
    }

    return cache[type][key] as T;
  }

  return new Proxy(() => {}, {
    apply(_, __, selectors: Array<string>) {
      if (!element) return [];

      const selector = selectors.map((s) => `:scope ${s}`).join();

      const value = () => [...element.querySelectorAll(selector)];
      const observed = observe<Array<Element>>("children", selector, value);

      return observed.splice(0, Infinity).map((r: Element) => $(r));
    },
    get(_, key) {
      if (!element) return;

      if (typeof key !== "string") return;

      const value = () => element.getAttribute(key);

      return observe<string | null>("attributes", `[${key}]`, value);
    },
  }) as ObserveAPI;
}
