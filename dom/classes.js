import { browser, env } from "../dom.js";
import { HandcraftElement } from "./HandcraftElement.js";
import { mutate } from "../reactivity.js";

browser.class = (element, key, value) => {
  element.classList.toggle(key, value);
};

export function classes(...classes) {
  classes = classes.flat(Infinity);

  for (let c of classes) {
    if (typeof c !== "object") {
      c = { [c]: true };
    }

    for (const [key, value] of Object.entries(c)) {
      mutate(
        this.element,
        (element, value) => {
          for (const k of key.split(" ")) {
            env.class(element, k, value);
          }
        },
        value,
      );
    }
  }

  return this;
}

HandcraftElement.prototype.classes = classes;
