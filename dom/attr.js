import { env } from "../dom.js";
import { HandcraftNode } from "./HandcraftNode.js";
import { inEffect, watch } from "../reactivity.js";

const states = new WeakMap();
let observer;

export function attr(key) {
  const el = this.element.deref();
  const value = env.observer.attr(el, key);

  if (!inEffect()) {
    return value;
  }

  let state = states.get(el);

  if (!state) {
    observer ??= env.observer.create((records) => {
      for (const record of records) {
        if (record.type === "attributes") {
          const state = states.get(record.target);

          if (state) {
            state[record.attributeName] = env.observer.attr(
              record.target,
              record.attributeName,
            );
          }
        }
      }
    });

    state = watch({ [key]: value });

    states.set(el, state);

    observer.observe(el, { attributes: true });
  } else if (state[key] == null) {
    state[key] = value;
  }

  return state[key];
}

HandcraftNode.prototype.attr = attr;
