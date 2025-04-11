# Handcraft

A tiny front-end framework using a fluent interface for constructing UI. It also has shallow reactivity. Install from NPM or get it from a CDN like [jsDelivr](https://cdn.jsdelivr.net/gh/erickmerchant/handcraft@latest/prelude/all.js) and add it to your import map.

---

## API

### reactivity.js

Where everything for creating reactive state resides.

#### watch(object)

Pass it an object (arrays supported) and it returns the object wrapped in a proxy that will track reads of properties in _effects_, and writes/deletions will rerun those _effects_.

#### effect(callback)

Pass it a callback to do operations that should get rerun when _watched_ objects are changed. It's for things not covered by the DOM API. Eg. setting localStorage or calling methods on DOM elements. Only properties that are later changed will trigger a rerun. Internally this same method is used anywhere a callback known as an _effect_ is allowed.

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

### dom.js

Where everything for creating DOM elements resides.

#### html, svg, math

These are proxies of objects with properties that are functions referred to as _tags_ that when run return an instance of `HandcraftElement`. There are three because HTML, SVG, and MathML all require different namespaces when creating a DOM element.

#### HandcraftNode, HandcraftElement, and HandcraftRoot

Usually you won't use these directly unless you want to write your own methods. They are exported so that methods can be added to their prototype. `HandcraftElement` and `HandcraftRoot` are sub-classes of `HandcraftNode` so they inherit all methods on `HandcraftNode`.

```js
import {HandcraftElement} from "handcraft/dom.js";

HandcraftElement.prototype.text = function (txt) {
	this.element.textContent = txt;

	return this;
};
```

Below `node` refers to methods on `HandcraftNode`, `element` refers to methods on `HandcraftElement`, and `shadow` those on `HandcraftRoot`.

#### node.deref()

A method on `HandcraftNode` instances that returns the underlying DOM element.

#### $(node)

Wraps a DOM node in the fluent interface.

```js
import {$} from "handcraft/dom.js";

assert($(document.body).deref() === document.body);
```

### define.js

Contains the API for creating custom elements.

#### define(name)

Pass it the name of your custom element. It returns a definition that is also a _tag_.

#### definition.connected(callback)

The callback is run in the custom element's `connectedCallback`.

```js
import {$} from "handcraft/dom.js";
import {define} from "handcraft/define.js";

$(target).append(
	define("hello-world").connected((host) => {
		host.text("hello world!");
	})
);
```

#### definition.disconnected(callback)

The callback is run in the custom element's `disconnectedCallback`.

### dom/\*.js

Every module in the "dom" directory adds a method to the `HandcraftNode`, `HandcraftElement`, or `HandcraftRoot` prototype. Import the file to add the method. For instance to use `styles(styles)` import `dom/styles.js`.

#### node.append(...children)

Append children to a _node_. Each child can be a string, a DOM element, or a _node_. Children are initially appended, but on update their position is maintained. Returns the _node_ for chaining. Though it's not necessary you may want to also import dom/_nodes.js, to reduce network waterfall.

#### element.aria(attrs)

Set aria attributes. Accepts an object. Values can be _effects_. Returns the _element_ for chaining.

#### element.attr(key, value)

Set an attribute. The second parameter can be an _effect_. Returns the _element_ for chaining. This method also can be used to read an attribute if no value is provided.

#### element.classes(...classes)

Set classes. Accepts a variable number of strings and objects. With objects the keys become the class strings if their values are truthy. Values can be _effects_. Returns the _element_ for chaining.

#### root.css(css)

Adds a stylesheet to the `adoptedStyleSheets` of a `HandcraftRoot` instance. The `css` can be an `effect`. Returns the _root_ for chaining.

#### element.data(data)

Set data attributes. Accepts an object. Values can be _effects_. Returns the _element_ for chaining.

```js
import "handcraft/dom/aria.js";
import "handcraft/dom/attr.js";
import "handcraft/dom/classes.js";
import "handcraft/dom/data.js";
import {html} from "handcraft/dom.js";

let {div} = html;

div()
	.aria({
		label: "example",
	})
	.attr("role", "foo"})
	.classes({
		"foo": () => state.foo
	})
	.data({"foo": "example"});
```

#### node.effect(callback)

Run an _effect_. The callback is passed the DOM element. Returns the _node_ for chaining.

```js
import "handcraft/dom/effect.js";
import {html} from "handcraft/dom.js";
import {watch} from "handcraft/reactivity.js";

let {dialog} = html;
let state = watch({
	modalOpen: false,
});

dialog().effect((el) => {
	if (state.modalOpen) {
		el.showModal();
	} else {
		el.close();
	}
});
```

##### node.find(selector)

Find children based on a selector. Returns an iterable with each item wrapped in the DOM API.

```js
import "handcraft/dom/find.js";
import {$} from "handcraft/dom.js";

let divs = $(document.body).find("div");

for (let div of divs) {
	div.classes("bar");
}
```

#### node.observe()

Returns an observer that uses a `MutationObserver` backed way to read attributes and find descendants.

##### observer.attr(key)

Read an attribute.

```js
import "handcraft/dom/append.js";
import "handcraft/dom/observe.js";
import "handcraft/dom/text.js";
import {html} from "handcraft/dom.js";
import {define} from "handcraft/define.js";

let {div} = html;

define("hello-world").connected((host) => {
	let observed = host.observe();

	host.append(div().text(() => `hello ${observed.attr("name")}!`));
});
```

##### observer.find(selector)

Find children.

```js
import "handcraft/dom/observe.js";
import {$} from "handcraft/dom.js";
import {effect} from "handcraft/reactivity.js";

let observed = $(document.body).observe();
let divs = observed.find("div");

effect(() => {
	for (let div of divs) {
		div.classes("bar");
	}
});
```

#### node.prepend(...children)

Like `append`, but for prepending children to a _node_. Each child can be a string, a DOM element, or a _node_. Children are initially prepended, but on update their position is maintained. Returns the _node_ for chaining. Though it's not necessary you may want to also import dom/_nodes.js, to reduce network waterfall.

#### node.on(name, callback, options = {})

Set an event handler. Has the same signature as `addEventListener` but the first parameter can also be an array to set the same handler for multiple event types. Returns the _node_ for chaining.

#### node.once(name, callback, options = {})

Set an event handler. Has the same signature as `node.on` but it automatically adds `once: true` to the options. Returns the _node_ for chaining.

#### node.prop(key, value)

Set a property. The second parameter can be an _effect_. Returns the _node_ for chaining.

#### element.shadow(options = {mode: "open"})

Attaches and returns a _shadow_, or returns an existing one. The returned shadow instance is wrapped in the `HandcraftRoot` API.

#### element.styles(styles)

Set styles. Accepts an object. Values can be _effects_. Returns the _element_ for chaining.

#### node.text(text)

When you need to set one text node, use `text` instead of `append` or `prepend`. The parameter can be a string or an _effect_. Returns the _node_ for chaining. This method also can be used to read text if no argument is provided.

```js
import "handcraft/dom/append.js";
import "handcraft/dom/on.js";
import "handcraft/dom/prop.js";
import "handcraft/dom/shadow.js";
import "handcraft/dom/styles.js";
import "handcraft/dom/text.js";
import {html} from "handcraft/dom.js";
import {define} from "handcraft/define.js";

let {button, span} = html;

define("hello-world").connected((host) => {
	let shadow = host.shadow();

	shadow.append(
		button()
			.prop("type", "button")
			.styles({
				color: "white",
				background: "rebeccapurple",
			})
			.on("click", () => console.log("clicked!"))
			.append(span().text("click me"))
	);
});
```

### each.js

Each is a way to create reactive lists.

#### each(list)

Entry point for this API. Pass it a _watched_ array. Returns a _collection_ that is iterable, having a `Symbol.iterator` method.

##### collection.filter(callback)

The callback will be run for each item in the _collection_. Return a truthy value to move onto the map step. It is passed `value` and `index`. Both are functions, but `value` proxies to the underlying item.

##### collection.map(callback)

The callback will be run for each item in the _collection_ that passes the filter step. It should return an _element_. It is passed `value` and `index`. Both are functions, but `value` proxies to the underlying item. Do not use destructuring assignment with the `value` between _effects_, because they will not be rerun if the item is swapped out since the callback when run in `append` or `prepend` is only run once per index. This avoids destroying DOM elements only to rebuild them with new data.

```js
import "handcraft/dom/on.js";
import "handcraft/dom/append.js";
import "handcraft/dom/text.js";
import {html} from "handcraft/dom.js";
import {each} from "handcraft/each.js";
import {watch} from "handcraft/reactivity.js";

let {button, ul, li} = html;
let list = watch([]);

button().on("click", () => {
	list.push(Math.floor(Math.random() * 20) + 1);
});

ul().append(
	each(list)
		.filter((value) => value() % 2)
		.map((value) => li().text(value()))
);
```

### when.js

When is used to conditionally render an _element_.

#### when(callback)

Entry point for this API. Pass it a function that should return a boolean that controls whether the _element_ should be rendered. The function is passed the previous result of the callback being called. Returns a _conditional_.

##### conditional.show(callback)

The callback should return the _element_ to be rendered.

##### conditional.fallback(callback)

The callback should return a different _element_ to be rendered if the the `when` callback returns false.

```js
import "handcraft/dom/append.js";
import "handcraft/dom/on.js";
import "handcraft/dom/text.js";
import {html} from "handcraft/dom.js";
import {watch} from "handcraft/reactivity.js";
import {when} from "handcraft/when.js";

let {span, button} = html;
let state = watch({
	clicked,
});

button()
	.on("click", () => {
		state.clicked = true;
	})
	.append(
		when(() => state.clicked)
			.show((entry) => span().text("clicked!"))
			.fallback("not clicked")
	);
```

### prelude/min.js

For convenience, a module that exports all of dom and reactivity and imports attr, append, on, prop, and text. The minimum you'd need to get started.

### prelude/all.js

Exports all other exports, and imports all dom/\*.js files. Probably only use this for demos.

---

## Inspiration

Much of the API is inspired by Rust and its ecosystem. The rest is the latest iteration of ideas I've had since around 2015. I need to mention the following as inspiration though.

- [jQuery](https://github.com/jquery/jquery)
- [Ender](https://github.com/ender-js/Ender)
- [HyperScript](https://github.com/hyperhype/hyperscript)
