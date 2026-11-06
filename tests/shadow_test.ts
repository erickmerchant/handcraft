import "./hooks.ts";
import { assertEquals } from "@std/assert";
import { delay } from "@std/async";
import { shadow, text } from "../mod.ts";

Deno.test("shadow", async () => {
  const div = document.createElement("div") as unknown as HTMLDivElement;

  const node = shadow({ mode: "open" }, text("hello from the shadow"));

  node(div);

  await delay(0);

  assertEquals("hello from the shadow", div.shadowRoot?.textContent);
});
