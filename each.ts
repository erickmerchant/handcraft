import { watch } from "./reactivity.ts";

export function each<T>(list: Array<T>): HandcraftEachAPI<T> {
  let mapper: HandcraftEachMapper<T>;
  let filterer: HandcraftEachFilterer<T> = () => true;
  let fallback: HandcraftControlCallback = () => {};
  const entries: Array<HandcraftEachCurrent<T>> = [];
  let current: HandcraftEachCurrent<T>;
  const show: HandcraftControlCallback = () => {
    return mapper(current.value, current.index);
  };

  return {
    map(cb: HandcraftEachMapper<T>) {
      mapper = cb;

      return this;
    },

    filter(cb: HandcraftEachFilterer<T>) {
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
            }) as HandcraftEachFilterCurrent<T>,
            () => index,
          )
        ) {
          continue;
        }

        current = entries[i];

        if (!current) {
          const store: HandcraftEachStore<T> = watch({
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
          } as HandcraftEachCurrent<T>;

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
