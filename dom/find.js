import { $, env } from "../dom.js";
import { HandcraftNode } from "./HandcraftNode.js";
import { inEffect, watch } from "../reactivity.js";

const queries = new WeakMap();
let observer;

export function find(selector) {
  selector = `:scope ${selector}`;

  const el = this.element.deref();
  const result = [...env.observer.query(el, selector)];

  if (!inEffect()) {
    return result.map((r) => $(r));
  }

  let results = queries.get(el);

  if (!results) {
    observer ??= env.observer.create((records) => {
      for (const record of records) {
        if (record.type === "childList") {
          const results = queries.get(record.target);

          if (results) {
            for (const selector of Object.keys(results)) {
              for (
                const result of env.observer.query(record.target, selector)
              ) {
                if ([...record.addedNodes].includes(result)) {
                  results[selector] = [...results[selector], result];
                }
              }
            }
          }
        }
      }
    });

    results = watch({ [selector]: result });

    queries.set(el, results);

    observer.observe(el, { childList: true, subtree: true });
  } else if (results[selector] == null) {
    results[selector] = result;
  }

  return results[selector].splice(0, Infinity).map((r) => $(r));
}

HandcraftNode.prototype.find = find;
