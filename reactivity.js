let current;
const queue = [];
const reads = new WeakMap();
let scheduled = false;

export const registered = new WeakSet();

function getProperty(o, key, r) {
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

function modifyProperty(o, key) {
  const callbacks = reads.get(o).get(key);

  if (callbacks != null && callbacks.size) {
    for (const cb of callbacks) {
      if (cb === current) continue;

      effect(cb);
    }

    callbacks.clear();
  }
}

function setProperty(o, key, value, r) {
  modifyProperty(o, key);

  return Reflect.set(o, key, value, r);
}

function deleteProperty(o, key) {
  modifyProperty(o, key);

  return Reflect.deleteProperty(o, key);
}

export function effect(callback) {
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

export function watch(object) {
  reads.set(object, new Map());

  return new Proxy(object, {
    set: setProperty,
    get: getProperty,
    deleteProperty,
  });
}

export function mutate(element, callback, value = () => {}) {
  const el = element.deref();

  if (el) {
    registered.add(el);
  }

  if (typeof value !== "function") {
    callback(el, value);
  } else {
    effect(() => {
      const el = element.deref();

      if (el && registered.has(el)) {
        callback(el, value());
      }
    });
  }
}
