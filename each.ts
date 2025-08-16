import { watch } from "./reactivity.ts";

export function each<T>(list: Array<T>) {
  type Index = () => number;
  type Store = {
    value: T | null;
    index: number;
  };
  type Current = {
    store: Store;
    value: (() => T) & T;
    index: Index;
  };
  type FilterCurrent = {
    (): T;
  } & T;
  type Mapper = (current: () => T, index: Index) => HandcraftElement | void;
  type Filterer = (current: FilterCurrent, index: Index) => boolean;
  type Fallback = () => HandcraftElement | void;

  let mapper: Mapper;
  let filterer: Filterer = () => true;
  let fallback: Fallback = () => {};
  const entries: Array<Current> = [];
  let current: Current;
  const show = () => {
    return mapper(current.value, current.index);
  };

  return {
    map(cb: Mapper) {
      mapper = cb;

      return this;
    },

    filter(cb: Filterer) {
      filterer = cb;

      return this;
    },

    fallback(cb: Fallback) {
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
            }) as FilterCurrent,
            () => index,
          )
        ) {
          continue;
        }

        current = entries[i];

        if (!current) {
          const store: Store = watch({
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
          } as Current;

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
