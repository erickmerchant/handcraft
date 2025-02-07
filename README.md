# Handcraft

A tiny front-end framework using a fluent interface for constructing UI. It also has shallow reactivity. Less than 2kB minified and compressed. Use or download it from a CDN like [jsDelivr](https://cdn.jsdelivr.net/gh/erickmerchant/handcraft/prelude/all.js) and add it to your import map.

---

## API

### _reactivity.js_

Where everything for creating reactive state resides.

#### watch(object)

Pass it an object (arrays supported) and it returns the object wrapped in a proxy that will track reads of properties in _effects_, and writes/deletions will rerun those _effects_.

#### effect(callback)

Pass it a callback to do operations that should get rerun when _watched_ objects are changed. It's for things not covered by the _element_ API. Eg. setting localStorage or calling methods on DOM elements. Only properties that are later changed will trigger a rerun. Internally this same method is used anywhere a callback known as an _effect_ is allowed.

```js
import {watch, effect} from "handcraft/reactivity.js";

let state = watch({foo: 0});

effect(() => {
	console.log(state.foo);
});

setInterval(() => {
	state.foo += 1;
}, 10_000);
```

### _dom.js_

Where everything for creating DOM elements resides.

#### html, svg, math

These are proxies of objects that return functions referred to as _tags_ that when run return an instance of `Element`. There are three because HTML, SVG, and MathML all require different namespaces when creating an DOM element.

#### Element

Usually you won't use `Element` directly unless you want to write your own methods. It is exported so that methods can be added to it's prototype.

```js
import {Element} from "handcraft/dom.js";

Element.prototype.text = function (txt) {
	this.element.textContent = txt;

	return this;
};
```

#### element.deref()

A method on `Element` instances that returns the underlying DOM element.

#### $(node)

Wraps a DOM node in the fluent interface.

```js
import {$} from "handcraft/dom.js";

assert($(document.body).deref() === document.body);
```

### _define.js_

Contains the API for creating custom elements.

#### define(name)

Pass it the name of your custom element. It returns a definition that is also a _tag_.

#### definition.connected(callback)

The callback is run in the custom element's `connectedCallback`.

```js
import {$} from "handcraft/dom.js";
import {define} from "handcraft/define.js";

$(target).nodes(
	define("hello-world")
		.connected((host) => {
			host.text("hello world!");
		})
);
```

#### definition.disconnected(callback)

The callback is run in the custom element's `disconnectedCallback`.

### _element/\*.js_

Every module in the element directory adds a method to the `Element` prototype. Import the file to add the method. For instance to use `styles(styles)` import `element/styles.js`.

#### element.prop(key, value)

Set a property. The second parameter can be an _effect_. Returns the _element_ for chaining.

#### element.attr(key, value)

Set an attribute. The second parameter can be an _effect_. Returns the _element_ for chaining.

#### element.classes(...classes)

Set classes. Accepts a variable number of strings and objects. With objects the keys become the class strings if their values are true. Values can be _effects_. Returns the _element_ for chaining.

```js
import {html} from "handcraft/dom.js";
import "handcraft/element/attr.js";
import "handcraft/element/prop.js";
import "handcraft/element/classes.js";

let {input} = html;

input()
	.attr("type", "checkbox")
	.prop("checked", () => state.checked)
	.classes({error: () => !state.valid});
```

#### element.styles(styles)

Set styles. Accepts an object. Values can be _effects_. Returns the _element_ for chaining.

#### element.aria(attrs)

Set aria attributes. Accepts an object. Values can be _effects_. Returns the _element_ for chaining.

#### element.data(data)

Set data attributes. Accepts an object. Values can be _effects_. Returns the _element_ for chaining.

```js
import {html} from "handcraft/dom.js";
import "handcraft/element/styles.js";
import "handcraft/element/aria.js";
import "handcraft/element/data.js";

let {div} = html;

div()
	.styles({
		"--foo": () => (state.foo ? "red" : "blue"),
	})
	.aria({
		label: "example",
	})
	.data({foo: () => state.foo});
```

#### element.on(name, callback, options = {})

Set an event handler. Has the same signature as `addEventListener` but the first parameter can also be an array to set the same handler for multiple event types. Returns the _element_ for chaining.

#### element.nodes(...children)

Set the children of an _element_. Each child can be a string, a DOM element, an _element_, an array, or an _effect_. Returns the _element_ for chaining.

#### element.text(text)

When you need to set one text node, use `text` instead of `nodes`. The parameter can be a string or an _effect_. Returns the _element_ for chaining.

```js
import {html} from "handcraft/dom.js";
import "handcraft/element/on.js";
import "handcraft/element/nodes.js";
import "handcraft/element/text.js";

let {button, span} = html;

button()
	.on("click", () => console.log("clicked!"))
	.nodes(span().text("click me"));
```

#### element.shadow(options = {mode: "open"})

Attaches and returns a shadow, or returns an existing one. The returned shadow DOM instance is wrapped in the `Element` API.

```js
import {html} from "handcraft/dom.js";
import {define} from "handcraft/define.js";
import "handcraft/element/text.js";
import "handcraft/element/shadow.js";

let {div} = html;

define("hello-world").connected((host) => {
	let shadow = host.shadow();

	shadow.nodes(div().text("hello world!"));
});
```

#### element.observe()

Returns an observer that uses a `MutationObserver` backed way to read attributes, and query descendants. When methods of the returned `observer` are used in an _effect_ the effect will be rerun when a mutation happens.

#### observer.attr(key)

Read an attribute.

```js
import {html} from "handcraft/dom.js";
import {define} from "handcraft/define.js";
import "handcraft/element/nodes.js";
import "handcraft/element/text.js";
import "handcraft/element/observe.js";

let {div} = html;

define("hello-world").connected((host) => {
	let observed = host.observe();

	host.nodes(div().text(() => `hello ${observed.attr("name")}!`));
});
```

#### observer.find(query)

Find children.

```js
import {$} from "handcraft/dom.js";
import {effect} from "handcraft/reactivity.js";
import "handcraft/element/on.js";
import "handcraft/element/observe.js";

let observed = $(document.body).observe();
let buttons = observed.find("button");

effect(() => {
	for (let button of buttons) {
		button.on("click", () => {
			console.log("clicked");
		});
	}
});
```

### _each.js_

Each is a way to create reactive lists.

#### each(list)

Entry point for this API. Pass it a _watched_ array. Returns a _collection_ that is iterable, having a `Symbol.iterator` method.

#### collection.filter(callback)

The callback will be run for each item in the _collection_. Return a boolean to move onto the map step.

#### collection.map(callback)

The callback will be run for each item in the _collection_ that passes the filter step. It should return an _element_. It is passed an object that contains `item`, the _collection_ item, and `index` its index. Do not use destructuring assignment with the `item` between _effects_, because they will not be rerun if the item is swapped out since the callback when run in `nodes` is only run once per index. This avoids destroying DOM elements only to rebuild them with new data.

```js
import {html} from "handcraft/dom.js";
import {each} from "handcraft/each.js";
import {watch} from "handcraft/reactivity.js";
import "handcraft/element/on.js";
import "handcraft/element/nodes.js";
import "handcraft/element/text.js";

let {button, ul, li} = html;
let list = watch([uuid()]);

button().on("click", () => {
	list.push(uuid());
});

ul().nodes(
	each(list)
		.filter((entry) => entry.value % 2)
		.map((entry) => li().text(entry.value))
);
```

### _prelude/min.js_

For convenience, a module that exports all of dom and reactivity and imports attr, nodes, on, prop, and text. The minimum you'd need to get started.

### _prelude/all.js_

Exports all other exports, and imports all element/\*.js files. Probably only use this for demos.

---

## Inspiration

A lot of the API is inspired by Rust and its ecosystem. The rest is the latest iteration of ideas I've had since around 2015. I need to mention the following as inspiration though.

- [jQuery](https://github.com/jquery/jquery)
- [Ender](https://github.com/ender-js/Ender)
- [HyperScript](https://github.com/hyperhype/hyperscript)
