# Handcraft

Handcraft is a small TypeScript library for building declarative, reactive UI.
Use server-side, through custom elements, add reactive behavior to existing
elements with the `$` function, or do any combination of the three.

## Install and import

Add the JSR package to a Deno project:

```sh
deno add jsr:@handcraft/lib
```

See the exported modules in `deno.json` for the full list of modules. Import
`html` or `svg` from `@handcraft/lib/h` and then beyond that only the modules
you need. It's fully tree-shakeable, and a goal of the project is for there to
be no unused code in projects that use it.

For example, a minimal set of imports for server-side rendering would be:

```ts
import { html } from "@handcraft/lib/h";
import attr from "@handcraft/lib/attr";
import text from "@handcraft/lib/text";
```

## Declarative

`html` is a proxy that will give you functions for making elements of a
particular type: `html.main(...nodes)`, `html.h1(...nodes)`,
`html.button(...nodes)`, etc. In Handcraft parlance nodes are elements,
attributes, properties, event handlers, effects, shadow roots, or control nodes
for loops or conditionals.

```ts
import { html } from "@handcraft/lib/h";
import attr from "@handcraft/lib/attr";
import text from "@handcraft/lib/text";

export default function helloWorld() {
  return html.main(
    attr.id("hello-page")
    html.h1(text("Hello World!")),
  );
}
```

## Reactive

Wrap an object with `watch(object)` to make reads and writes reactive. If a
rendered node reads a watched property, Handcraft reruns the relevant update
when that property changes.

```ts
import { html } from "@handcraft/lib/h";
import { watch } from "@handcraft/lib/reactivity";
import attr from "@handcraft/lib/attr";
import on from "@handcraft/lib/on";
import prop from "@handcraft/lib/prop";

const state = watch({ count: 0 });
const counter = html.button(
  attr.class(tokens({
    clicked: state.count > 0
  }))
  on.click(() => state.count++),
  html.input(prop.readonly(true), prop.value(() => state.count)),
);

$("#conter")(counter);
```

Use `effect(callback)` when a side effect needs the element as its argument. It
tracks watched values read by the callback and reruns when they change:

```ts
import { html } from "@handcraft/lib/h";
import { watch } from "@handcraft/lib/reactivity";
import effect from "@handcraft/lib/effect";

const state = watch({ open: false });
const dialog = html.dialog(
  effect((el: HTMLDialogElement) => {
    if (state.open) el.showModal();
    else el.close();
  }),
);
```

Use `run(callback)` for a general reactive side effect, without an element
argument. It schedules the callback immediately and reruns it when watched
values it reads change:

```ts
import { run, watch } from "@handcraft/lib/reactivity";

const state = watch({ query: "" });

run(() => {
  document.title = state.query ? `Search: ${state.query}` : "Search";
});
```

## Lists and conditional content

`each(items).map(callback)` creates a list of nodes. The callback to `map`
receives a reactive item and an index, so properties read from an item can
update in place. Use `.filter(callback)` to omit items and `.fallback(...)` to
supply content when there are no visible items.

```ts
import { html } from "@handcraft/lib/h";
import each from "@handcraft/lib/each";
import text from "@handcraft/lib/text";
import attr from "@handcraft/lib/attr";

type Photo = { caption: string; src: string };

const gallery = (photos: Photo[]) =>
  html.div(
    each(photos).map((photo, index) =>
      html.figure(
        attr.id(() => `photo-${index()}`)
        html.img(attr.src(() => photo.src)),
        html.figcaption(text(() => photo.caption)),
      )
    ),
  );
```

For conditional branches, `when(() => condition).show(() => node)` renders the
shown node while the condition is truthy; `.fallback(() => node)` supplies the
falsy branch. The condition can read watched state, and thus will be reevaluated
when state changes.

```ts
import { html } from "@handcraft/lib/h";
import { watch } from "@handcraft/lib/reactivity";
import text from "@handcraft/lib/text";
import when from "@handcraft/lib/when";

const state = watch({ signedIn: false });
const account = when(() => state.signedIn)
  .show(() => html.p(text("Welcome back!")))
  .fallback(() => html.a(text("Sign in")));
```

## Custom elements

Extend `HandcraftElement` and override `view(host)`. `host` is the node for the
custom element instance, so the view can apply reactive attributes and children,
etc. Register the class with the static function `define`, like
`MyElement.define("my-element")`. The returned function will return nodes of
that custom element type, which can then be used in other views. This works with
server-side rendering as well.

For a shadow root, put `shadow({ mode: "open" }, ...nodes)` inside the host
view. Shadow roots will be serialized to declarative shadow DOM if used in
server-side rendering.

```ts
import type { HandcraftTag } from "@handcraft/lib";
import { HandcraftElement } from "@handcraft/lib/element";
import { html } from "@handcraft/lib/h";
import { watch } from "@handcraft/lib/reactivity";
import text from "@handcraft/lib/text";

class MyGreeting extends HandcraftElement {
  state = watch({ name: "world" });

  override view(host: HandcraftTag) {
    return host(shadow(
      { mode: "open" },
      html.p(text(() => `Hello, ${this.state.name}!`)),
    ));
  }
}

export default MyGreeting.define("my-greeting");
```

```ts
import myGreeting from "./my-greeting.ts";

export default function helloWorld() {
  return html.main(
    myGreeting.class("hello-world")(),
  );
}
```

## Server rendering

For server-side rendering, `stringify(node)` from `@handcraft/lib/ssr` returns a
string of HTML. `view(callback)` adapts a view callback for a server route.

```ts
import { view } from "@handcraft/lib/ssr";
import page from "./page.ts";

const route = view(page);
```

`view` accepts synchronous or asynchronous callbacks that return a Handcraft
node or a `Response`. Server-rendered custom elements can filter browser-only
content with `!this.ssr` so it is omitted from the initial HTML.

## Author

Handcraft is created and maintained by Erick Merchant. Find him at his
[blog](https://erickmerchant.com/) or
[Bluesky](https://bsky.app/profile/erickmerchant.bsky.social)
