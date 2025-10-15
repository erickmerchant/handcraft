import type { HandcraftControlCallback, HandcraftElement } from "./mod.ts";

type EachIndex = () => number;

type EachStore<T> = {
  value: T | null;
  index: number;
};

type EachCurrent<T> = {
  store: EachStore<T>;
  value: (() => T) & T;
  index: EachIndex;
};

type EachFilterCurrent<T> = {
  (): T;
} & T;

type EachMapper<T> = (
  current: (() => T) & T,
  index: EachIndex,
) => HandcraftElement | void | Promise<HandcraftElement | void>;

type EachFilterer<T> = (
  current: EachFilterCurrent<T>,
  index: EachIndex,
) => boolean;

type EachAPI<T> = {
  map(cb: EachMapper<T>): EachAPI<T>;
  filter(cb: EachFilterer<T>): EachAPI<T>;
  fallback(cb: HandcraftControlCallback): EachAPI<T>;
} & Iterable<HandcraftControlCallback>;

import { watch } from "./reactivity.ts";

export function each<T>(list: Array<T>): EachAPI<T> {
  let mapper: EachMapper<T>;
  let filterer: EachFilterer<T> = () => true;
  let fallback: HandcraftControlCallback = () => {};
  const entries: Array<EachCurrent<T>> = [];
  let current: EachCurrent<T>;
  const show: HandcraftControlCallback = () => {
    return mapper(current.value, current.index);
  };

  return {
    map(cb: EachMapper<T>) {
      mapper = cb;

      return this;
    },

    filter(cb: EachFilterer<T>) {
      filterer = cb;

      return this;
    },

    fallback(cb: HandcraftControlCallback) {
      fallback = cb;

      return this;
    },

    *[Symbol.iterator]() {
      let i = 0;

      if (!list.length) {
        yield fallback;
      }

      for (const [index, value] of list.entries()) {
        if (
          !filterer(
            new Proxy(() => value, {
              get(_, p) {
                return value != null && typeof value === "object"
                  ? Reflect.get(value, p)
                  : undefined;
              },
            }) as EachFilterCurrent<T>,
            () => index,
          )
        ) {
          continue;
        }

        current = entries[i];

        if (!current) {
          const store: EachStore<T> = watch({
            value: null,
            index,
          });

          current = {
            store,
            value: new Proxy(() => store.value, {
              get(_, p) {
                return store.value != null && typeof store.value === "object"
                  ? Reflect.get(store.value, p)
                  : undefined;
              },
              set(_, p, newValue) {
                if (store.value == null || typeof store.value !== "object") {
                  return false;
                }

                return Reflect.set(store.value, p, newValue);
              },
              deleteProperty(_, p) {
                if (store.value == null || typeof store.value !== "object") {
                  return false;
                }

                return Reflect.deleteProperty(store.value, p);
              },
            }),
            index() {
              return store.index;
            },
          } as EachCurrent<T>;

          entries.push(current);
        }

        if (value !== current.store.value) {
          current.store.value = value;
        }

        current.store.index = index;

        yield show;

        i++;
      }

      entries.splice(i, Infinity);
    },
  };
}
