import "./hooks.ts";
import { assertEquals } from "@std/assert";
import view from "../ssr.ts";
import { attr, html, text } from "../mod.ts";

Deno.test("ssr", async () => {
  const v = view(() => {
    return html.div(attr.class("test"), html.span(text("1 2 3")));
  });

  assertEquals(`<div class="test"><span>1 2 3</span></div>`, await v());
});
