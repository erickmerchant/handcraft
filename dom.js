import { inEffect, mutate, watch } from "./reactivity.js";

export const namespaces = {
  html: "http://www.w3.org/1999/xhtml",
  svg: "http://www.w3.org/2000/svg",
  math: "http://www.w3.org/1998/Math/MathML",
};

const position = {
  start: Symbol("start"),
  end: Symbol("end"),
};

export function dom(env) {
  class HandcraftEventTarget {
    constructor(element) {
      this.element = new WeakRef(element);
    }

    deref() {
      return this.element.deref();
    }

    on(events, handler, options = {}) {
      const el = this.element.deref();

      if (el) {
        const h = (e, ...args) => {
          const el = this.element.deref();

          if (el) {
            return handler.call(e.currentTarget, e, ...args);
          }
        };

        for (const event of events.split(/\s+/)) {
          $.on(el, event, h, options);
        }
      }

      return this;
    }

    command(commands, handler, options = {}) {
      commands = commands.split(/\s+/);

      this.on(
        "command",
        (e) => {
          if (commands.includes(e.command)) {
            return handler.call(this, e);
          }
        },
        options,
      );

      return this;
    }

    once(events, handler, options = {}) {
      if (options === true || options === false) {
        options = { capture: options };
      }

      this.on(events, handler, { ...options, once: true });

      return this;
    }
  }

  const queries = new WeakMap();
  let treeObserver;

  const states = new WeakMap();
  let attrObserver;

  class HandcraftNode extends HandcraftEventTarget {
    attr(key) {
      const el = this.element.deref();
      const value = $.observer.attr(el, key);

      if (!inEffect()) {
        return value;
      }

      let state = states.get(el);

      if (!state) {
        attrObserver ??= $.observer.create((records) => {
          for (const record of records) {
            if (record.type === "attributes") {
              const state = states.get(record.target);

              if (state) {
                state[record.attributeName] = $.observer.attr(
                  record.target,
                  record.attributeName,
                );
              }
            }
          }
        });

        state = watch({ [key]: value });

        states.set(el, state);

        attrObserver.observe(el, { attributes: true });
      } else if (state[key] == null) {
        state[key] = value;
      }

      return state[key];
    }

    effect(cb) {
      mutate(this.element, cb);

      return this;
    }

    find(selector) {
      selector = `:scope ${selector}`;

      const el = this.element.deref();
      const result = [...$.observer.query(el, selector)];

      if (!inEffect()) {
        return result.map((r) => $(r));
      }

      let results = queries.get(el);

      if (!results) {
        treeObserver ??= $.observer.create((records) => {
          for (const record of records) {
            if (record.type === "childList") {
              const results = queries.get(record.target);

              if (results) {
                for (const selector of Object.keys(results)) {
                  for (
                    const result of $.observer.query(
                      record.target,
                      selector,
                    )
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

        treeObserver.observe(el, { childList: true, subtree: true });
      } else if (results[selector] == null) {
        results[selector] = result;
      }

      return results[selector].splice(0, Infinity).map((r) => $(r));
    }

    nodes(children, pos = position.end) {
      const el = this.element.deref();
      const nodeToCallback = new WeakMap();
      const fragment = $.fragment();

      children = children.flat(Infinity);

      for (let child of children) {
        if (!child) continue;

        if (
          child != null &&
          typeof child === "object" &&
          child[Symbol.iterator] != null
        ) {
          let bounds = [$.comment(), $.comment()];

          $.append(fragment, ...bounds);

          bounds = bounds.map((c) => new WeakRef(c));

          mutate(this.element, () => {
            const [start, end] = bounds.map((b) => b.deref());
            let currentChild = start && $.next(start) !== end
              ? $.next(start)
              : null;
            const fragment = $.fragment();

            for (const item of child) {
              const create = !currentChild;
              const replace = !create &&
                nodeToCallback.get(currentChild) !== item;

              if (create || replace) {
                let result = item();

                result = deref(result);

                if (result != null) {
                  if (create) {
                    $.append(fragment, result);
                  } else {
                    currentChild = $.replace(currentChild, result);
                  }

                  nodeToCallback.set(result, item);
                } else if (replace) {
                  continue;
                }
              }

              currentChild = $.next(currentChild) !== end
                ? $.next(currentChild)
                : null;
            }

            $.before(end, fragment);

            while (currentChild && currentChild !== end) {
              const nextChild = $.next(currentChild);

              $.remove(currentChild);

              currentChild = nextChild;
            }
          });
        } else if (child != null && typeof child === "function") {
          let prev = $.comment();

          $.append(fragment, prev);

          prev = new WeakRef(prev);

          mutate(
            this.element,
            (_, child) => {
              child = deref(child);

              const p = prev.deref();

              if (p) {
                prev = new WeakRef(
                  $.replace(p, child ?? $.comment()),
                );
              }
            },
            child,
          );
        } else {
          child = deref(child);

          $.append(fragment, child);
        }
      }

      switch (pos) {
        case position.start:
          $.append(el, fragment);
          break;

        case position.end:
          $.append(el, fragment);
          break;
      }

      return this;
    }

    prop(key, value) {
      mutate(
        this.element,
        (element, value) => {
          element[key] = value;
        },
        value,
      );

      return this;
    }
  }

  class HandcraftRoot extends HandcraftNode {
    css(css, options = {}) {
      const stylesheet = $.stylesheet.create();

      for (const prop of ["media"]) {
        if (options[prop]) {
          mutate(
            this.element,
            (stylesheet, val) => {
              stylesheet[prop] = val;
            },
            options[prop],
          );
        }
      }

      const el = this.element.deref();

      $.stylesheet.adopt(el, stylesheet);

      mutate(
        this.element,
        (_element, css) => {
          $.stylesheet.css(stylesheet, css);
        },
        css,
      );

      return this;
    }
  }

  class HandcraftElement extends HandcraftNode {
    root() {
      const el = this.element.deref();

      if (!el) {
        return;
      }

      return $($.root(el));
    }

    _attr(key, value) {
      mutate(
        this.element,
        (element, value) => {
          $.attr(element, key, value);
        },
        value,
      );

      return this;
    }

    aria(attrs) {
      for (const [key, value] of Object.entries(attrs)) {
        this._attr(`aria-${key}`, value);
      }

      return this;
    }

    classes(...classes) {
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
                $.class(element, k, value);
              }
            },
            value,
          );
        }
      }

      return this;
    }

    data(data) {
      for (const [key, value] of Object.entries(data)) {
        mutate(
          this.element,
          (element, value) => {
            $.data(element, key, value);
          },
          value,
        );
      }

      return this;
    }

    shadow(options = { mode: "open" }) {
      const el = this.element.deref();

      if (el) {
        const shadowRoot = $.shadow(el, options);

        return $(shadowRoot);
      }
    }

    styles(styles) {
      for (const [key, value] of Object.entries(styles)) {
        mutate(
          this.element,
          (element, value) => {
            $.style(element, key, value);
          },
          value,
        );
      }

      return this;
    }
  }

  function deref(val) {
    return val instanceof HandcraftNode ? val.deref() : val;
  }

  function $(el) {
    const type = $.kind(el);
    let element;

    switch (type) {
      case "element":
        element = new HandcraftElement(el);
        break;

      case "root":
        element = new HandcraftRoot(el);
        break;

      default:
        element = new HandcraftEventTarget(el);
    }

    const p = new Proxy(() => {}, {
      apply(_, __, children) {
        element.nodes?.(children);

        return p;
      },
      get(_, key) {
        if (key === "then") {
          return;
        }

        if (key in element) {
          return typeof element[key] === "function"
            ? (...args) => {
              const result = element[key](...args);

              if (result === element) {
                return p;
              }

              return result;
            }
            : element[key];
        }

        if (typeof key !== "string") {
          return;
        }

        return (...args) => {
          element._attr(key, ...args);

          return p;
        };
      },
      getPrototypeOf() {
        return Object.getPrototypeOf(element);
      },
    });

    return p;
  }

  env($);

  function factory(namespace) {
    return new Proxy(
      {},
      {
        get(_, tag) {
          return new Proxy(() => {}, {
            apply(_, __, args) {
              const el = $($.create(tag, namespace));

              return el(...args);
            },
            get(_, key) {
              const el = $($.create(tag, namespace));

              return el[key];
            },
          });
        },
      },
    );
  }

  const h = {
    html: factory(namespaces.html),
    svg: factory(namespaces.svg),
    math: factory(namespaces.math),
  };

  function define(name) {
    const options = {
      name,
      setup: () => {},
      teardown: () => {},
    };

    queueMicrotask(() => {
      $.define(options);
    });

    const tag = h.html[name];
    const factory = {
      setup: (cb) => {
        options.setup = cb;

        return proxy;
      },
      teardown: (cb) => {
        options.teardown = cb;

        return proxy;
      },
      extends: (name) => {
        options.extends = name;

        return proxy;
      },
    };
    const proxy = new Proxy(() => {}, {
      apply(_, __, children) {
        return tag(children);
      },
      get(_, key) {
        if (key in factory) {
          return factory[key];
        }

        return tag[key];
      },
    });

    return proxy;
  }

  return { $, h, define };
}
