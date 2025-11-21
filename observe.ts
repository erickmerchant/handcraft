import type { HandcraftElement } from "./mod.ts";
import { inEffect, watch } from "./reactivity.ts";
import { $, deref } from "./dollar.ts";

const observerCache: WeakMap<
  Node,
  Record<string, any>
> = new WeakMap();

type ObserveAPI = {
  (...selector: Array<string>): Array<HandcraftElement>;
} & Record<string, string | undefined>;

let observer: MutationObserver;

export function observe(element: HandcraftElement): ObserveAPI {
  const el = deref(element);

  observer ??= new MutationObserver((records) => {
    for (const record of records) {
      const results = observerCache.get(record.target);

      if (results && record.target instanceof Element) {
        if (record.type === "attributes") {
          results[`[${record.attributeName as string}]`] = record.target
            .getAttribute(
              record.attributeName as string,
            );
        }

        for (const selector of Object.keys(results)) {
          if (!selector.startsWith(":scope")) continue;

          for (
            const result of record.target.querySelectorAll(
              selector,
            )
          ) {
            if ([...record.addedNodes].includes(result)) {
              results[selector] = [
                ...results[selector],
                result,
              ];
            }
          }
        }
      }
    }
  });

  let cache = el ? observerCache.get(el) : {};

  function read<T>(key: string, value: () => T): T {
    if (!inEffect() || !el) {
      return value();
    }

    if (!cache) {
      cache = watch({});

      observerCache.set(el, cache);

      observer.observe(el, {
        attributes: true,
        subtree: true,
        childList: true,
      });
    }

    if (!cache[key]) {
      cache[key] = value();
    }

    return cache[key] as T;
  }

  return new Proxy(() => {}, {
    apply(_, __, selectors: Array<string>) {
      if (!el) return [];

      const selector = selectors.map((s) => `:scope ${s}`).join();

      const value = () => [...el.querySelectorAll(selector)];
      const observed = read<Array<Element>>(selector, value);

      return observed.splice(0, Infinity).map((r: Element) => $(r));
    },
    get(_, key) {
      if (!el) return;

      if (typeof key !== "string") return;

      const value = () => el.getAttribute(key);

      return read<string | null>(`[${key}]`, value);
    },
  }) as ObserveAPI;
}
