import { dom } from "../dom.js";
import { registered } from "../reactivity.js";

function env($) {
  $.kind = (el) => {
    if (el instanceof Element) {
      return "element";
    }

    if (el instanceof ShadowRoot || el instanceof Document) {
      return "root";
    }

    return null;
  };

  $.create = (tag, namespace = namespaces.html) => {
    return document.createElementNS(namespace, tag);
  };

  $.root = (element) => {
    return element.getRootNode();
  };

  $.attr = (element, key, value) => {
    if (value === true || value === false || value == null) {
      element.toggleAttribute(key, !!value);
    } else {
      element.setAttribute(key, value);
    }
  };

  $.data = (element, key, value) => {
    element.dataset[key] = value;
  };

  $.class = (element, key, value) => {
    element.classList.toggle(key, value);
  };

  $.shadow = (element, options) => {
    if (!element.shadowRoot) {
      element.attachShadow(options);
    }

    return element.shadowRoot;
  };

  $.style = (element, key, value) => {
    element.style.setProperty(key, value);
  };

  $.on = (element, event, handler, options) => {
    element.addEventListener(event, handler, options);
  };

  $.comment = (content = "") => {
    return document.createComment(content);
  };

  $.fragment = () => {
    return new DocumentFragment();
  };

  $.append = (element, ...children) => {
    element.append(...children);
  };

  $.next = (element) => {
    return element?.nextSibling;
  };

  $.remove = (element) => {
    element.remove();

    registered.delete(element);
  };

  $.replace = (current, next) => {
    if (!(next instanceof Element)) {
      if (current.nodeType === 3) {
        current.textContent = next;

        return current;
      }

      next = document.createTextNode(next);
    }

    current.replaceWith(next);

    registered.delete(current);

    return next;
  };

  $.before = (element, child) => {
    element.before(child);
  };

  $.observer = {
    create(cb) {
      return new MutationObserver(cb);
    },
    attr(element, key) {
      return element.getAttribute(key);
    },
    query(element, selector) {
      return element.querySelectorAll(selector);
    },
  };

  $.stylesheet = {
    create() {
      return new CSSStyleSheet();
    },
    adopt(element, stylesheet) {
      element.adoptedStyleSheets.splice(
        element.adoptedStyleSheets.length,
        1,
        stylesheet,
      );
    },
    css(stylesheet, css) {
      stylesheet.replaceSync(css);
    },
  };

  $.define = (options) => {
    customElements.define(
      options.name,
      class
        extends (options.extends
          ? $.create(options.extends).constructor
          : HTMLElement) {
        connectedCallback() {
          options.setup($(this));
        }

        disconnectedCallback() {
          options.teardown($(this));
        }
      },
      options.extends ? { extends: options.extends } : null,
    );
  };
}

const { $, h, define } = dom(env);

export { $, define, h };

export * from "../reactivity.js";
export * from "../each.js";
export * from "../when.js";
