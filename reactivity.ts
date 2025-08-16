let current: () => void;
const queue: Array<() => void> = [];
const reads = new WeakMap();
let scheduled = false;

function getProperty<T extends object>(o: T, key: string | symbol, r: T) {
  if (current) {
    let callbacks = reads.get(o).get(key);

    if (!callbacks) {
      callbacks = new Set();
      reads.get(o).set(key, callbacks);
    }

    callbacks.add(current);
  }

  return Reflect.get(o, key, r);
}

function modifyProperty<T extends object>(o: T, key: string | symbol) {
  const callbacks = reads.get(o).get(key);

  if (callbacks != null && callbacks.size) {
    for (const cb of callbacks) {
      if (cb === current) continue;

      effect(cb);
    }

    callbacks.clear();
  }
}

function setProperty<T extends object>(
  o: T,
  key: string | symbol,
  value: any,
  r: T,
) {
  modifyProperty(o, key);

  return Reflect.set(o, key, value, r);
}

function deleteProperty<T extends object>(o: T, key: string | symbol) {
  modifyProperty(o, key);

  return Reflect.deleteProperty(o, key);
}

export function effect(callback: () => void) {
  if (!queue.includes(callback)) {
    queue.push(callback);

    if (!scheduled) {
      scheduled = true;

      setTimeout(() => {
        scheduled = false;

        const callbacks = queue.splice(0, Infinity);
        const prev = current;

        for (const cb of callbacks) {
          current = cb;

          cb();
        }

        current = prev;
      }, 0);
    }
  }
}

export function inEffect() {
  return current != null;
}

export function watch<T extends object>(object: T) {
  reads.set(object, new Map());

  return new Proxy<T>(object, {
    set: setProperty,
    get: getProperty,
    deleteProperty,
  });
}
