import type {
  HandcraftControlCallback,
  HandcraftNode,
  HandcraftNodeState,
} from "./types.ts";
import { HandcraftFragmentState } from "./types.ts";
import { watch } from "./reactivity.ts";
import { controlCallback } from "./render.ts";

type EachIndex = () => number;

type EachCurrent<T extends object> = {
  (): T;
} & T;

type EachStore<T extends object> = {
  value: T;
  index: number;
};

type EachEntry<T extends object> = {
  store: EachStore<T>;
  value: EachCurrent<T>;
  index: EachIndex;
};

type EachCallback<T extends object, N, R> = (
  current: EachCurrent<T>,
  index: EachIndex,
) => R;

export type EachAPI<T extends object, N> =
  & HandcraftNode<HandcraftFragmentState>
  & {
    map(
      cb: EachCallback<T, N, HandcraftNode<HandcraftNodeState> | null>,
    ): EachAPI<T, N>;
    filter(cb: EachCallback<T, N, boolean>): EachAPI<T, N>;
    fallback(cb: HandcraftControlCallback): EachAPI<T, N>;
  }
  & Iterable<HandcraftControlCallback>;

export default <T extends object, N = Node>(
  list: Array<T>,
): EachAPI<T, N> => {
  let mapper: EachCallback<T, N, HandcraftNode<HandcraftNodeState> | null>;
  let filterer: EachCallback<T, N, boolean> = () => true;
  let fallback: HandcraftControlCallback = () => null;
  let current: EachEntry<T>;
  const entries: Array<EachEntry<T>> = [];
  const show: HandcraftControlCallback = () => {
    return mapper(current.value, current.index);
  };

  const state = new HandcraftFragmentState(function* () {
    let i = 0;

    for (const [index, value] of list.entries()) {
      if (
        !filterer(valueProxy(() => value) as EachCurrent<T>, () => index)
      ) {
        continue;
      }

      current = entries[i];

      if (!current) {
        const store: EachStore<T> = watch({
          value,
          index,
        });

        current = {
          store,
          value: valueProxy(() => store.value),
          index() {
            return store.index;
          },
        } as EachEntry<T>;

        entries.push(current);
      }

      if (value !== current.store.value) {
        current.store.value = value;
      }

      current.store.index = index;

      yield show;

      i++;
    }

    if (i === 0) {
      yield fallback;
    }

    entries.splice(i, Infinity);
  });

  const node = controlCallback(state) as EachAPI<T, N>;

  node.state = state;

  node.map = (
    cb: EachCallback<T, N, HandcraftNode<HandcraftNodeState> | null>,
  ) => {
    mapper = cb;

    return node;
  };

  node.filter = (cb: EachCallback<T, N, boolean>) => {
    filterer = cb;

    return node;
  };

  node.fallback = (cb: HandcraftControlCallback) => {
    fallback = cb;

    return node;
  };

  return node;
};

function valueProxy<T extends object>(getter: () => T) {
  return new Proxy(getter, {
    get(_, p) {
      return Reflect.get(getter(), p);
    },
    set(_, p, newValue) {
      return Reflect.set(getter(), p, newValue);
    },
    deleteProperty(_, p) {
      return Reflect.deleteProperty(getter(), p);
    },
  });
}
