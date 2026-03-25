import type { HandcraftControlCallback, HandcraftElement } from "./types.ts";
import { watch } from "./reactivity.ts";

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

type EachMapper<T, N> = (
  current: (() => T) & T,
  index: EachIndex,
) => HandcraftElement<N> | void;

type EachFilterer<T> = (
  current: EachFilterCurrent<T>,
  index: EachIndex,
) => boolean;

export type EachAPI<T, N> = {
  map(cb: EachMapper<T, N>): EachAPI<T, N>;
  filter(cb: EachFilterer<T>): EachAPI<T, N>;
  fallback(cb: HandcraftControlCallback<N>): EachAPI<T, N>;
} & Iterable<HandcraftControlCallback<N>>;

export function each<T, N = Node>(list: Array<T>): EachAPI<T, N> {
  let mapper: EachMapper<T, N>;
  let filterer: EachFilterer<T> = () => true;
  let fallback: HandcraftControlCallback<N> = () => {};
  const entries: Array<EachCurrent<T>> = [];
  let current: EachCurrent<T>;
  const show: HandcraftControlCallback<N> = () => {
    return mapper(current.value, current.index);
  };

  return {
    map(cb: EachMapper<T, N>) {
      mapper = cb;

      return this;
    },

    filter(cb: EachFilterer<T>) {
      filterer = cb;

      return this;
    },

    fallback(cb: HandcraftControlCallback<N>) {
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
