import "./hooks.ts";
import { assert, assertEquals } from "@std/assert";
import { delay } from "@std/async/delay";
import view from "../ssr.ts";
import {
  attr,
  each,
  HandcraftElementWithAttributes,
  html,
  shadow,
  text,
  watch,
} from "../mod.ts";
import type { HandcraftNode, HandcraftTag } from "../types.ts";

Deno.test("ssr", async () => {
  const v = view(() => {
    return new Response("testing");
  });
  const res = await v();

  assert(typeof res === "object" && res != null && res instanceof Response);
});

Deno.test("ssr", async () => {
  const v = view(() => {
    return html.html(html.body());
  });

  assertEquals(`<!doctype html><html><body></body></html>`, await v());
});

Deno.test("ssr", async () => {
  const v = view(() => {
    return html.div(attr.class("test"), html.span(text("1 2 3"), null));
  });

  assertEquals(`<div class="test"><span>1 2 3</span></div>`, await v());
});

Deno.test("ssr", async () => {
  const v = view(() => {
    return html.input(attr.checked(true));
  });

  assertEquals(`<input checked>`, await v());
});

Deno.test("ssr", async () => {
  const v = view(() => {
    return html.div(shadow({ mode: "open" }, html.span(text("1 2 3"), null)));
  });

  assertEquals(
    `<div><template shadowrootmode="open"><span>1 2 3</span></template></div>`,
    await v(),
  );
});

Deno.test("ssr", async () => {
  const v = view(() => {
    return html.div(html.ul(
      each([
        { text: "one" },
        { text: "two" },
        { text: "three" },
        { text: "four" },
      ])
        .map((model, index) =>
          model.text === "four"
            ? null
            : html.li(text(() => `${index()} ${model.text}`))
        ),
    ));
  });

  assertEquals(
    `<div><ul><!-- <> --><li>0 one</li><li>1 two</li><li>2 three</li><!-- </> --></ul></div>`,
    await v(),
  );
});

Deno.test("ssr", async () => {
  class TestElement extends HandcraftElementWithAttributes {
    override state: { num: number } = watch({ num: 0 });

    override view(host: HandcraftTag): HandcraftNode {
      return host(html.div(text(() => `${this.state.num}`)));
    }
  }

  const testElement = TestElement.define("test-element");
  let v;

  v = view(() => {
    return html.div(testElement());
  });

  assertEquals(
    `<div><test-element><div>0</div></test-element></div>`,
    await v(),
  );

  v = view(() => {
    return html.div(testElement(attr.num("12")));
  });

  await delay(0);

  assertEquals(
    `<div><test-element num="12"><div>0</div></test-element></div>`,
    await v(),
  );
});

Deno.test("ssr", async () => {
  class TestElement extends HandcraftElementWithAttributes {
    static observedAttributes = ["num"];

    override state: { num: number } = watch({ num: 0 });

    override view(host: HandcraftTag): HandcraftNode {
      return host(html.div(text(() => `${this.state.num}`)));
    }
  }

  const testElement = TestElement.define("test-element");
  let v;

  v = view(() => {
    return html.div(testElement());
  });

  assertEquals(
    `<div><test-element><div>0</div></test-element></div>`,
    await v(),
  );

  v = view(() => {
    return html.div(testElement(attr.num("12")));
  });

  await delay(0);

  assertEquals(
    `<div><test-element num="12"><div>12</div></test-element></div>`,
    await v(),
  );

  v = view(() => {
    return html.div(testElement(attr.num("12"), html.div(text(() => `${24}`))));
  });

  await delay(0);

  assertEquals(
    `<div><test-element num="12"><div>24</div></test-element></div>`,
    await v(),
  );
});

Deno.test("ssr", async () => {
  class TestElement extends HandcraftElementWithAttributes {
    static observedAttributes = ["num"];

    override state: { num: number } = watch({ num: 0 });

    override view(host: HandcraftTag): HandcraftNode {
      return host(shadow({ mode: "open" }, html.p(text("hello"))));
    }
  }

  const testElement = TestElement.define("test-element");
  let v;

  v = view(() => {
    return html.div(testElement());
  });

  assertEquals(
    `<div><test-element><template shadowrootmode="open"><p>hello</p></template></test-element></div>`,
    await v(),
  );

  v = view(() => {
    return html.div(testElement(shadow({ mode: "open" }, html.p(text("hi")))));
  });

  await delay(0);

  assertEquals(
    `<div><test-element><template shadowrootmode="open"><p>hi</p></template></test-element></div>`,
    await v(),
  );
});
