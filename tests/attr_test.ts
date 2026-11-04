import { assertEquals } from "@std/assert";
import { delay } from "@std/async";
import * as DOM from "@b-fuze/deno-dom";
import { attr, watch } from "../mod.ts";

Deno.test("string attr test", async () => {
  const doc = new DOM.DOMParser().parseFromString(
    "<body></body>",
    "text/html",
  )!;
  const div = doc.createElement("div") as unknown as HTMLDivElement;
  const state = watch<{ className: string }>({ className: "test-2" });
  const node1 = attr.class("test-1");

  node1(div);

  await delay(0);

  assertEquals("test-1", div.className);

  const node2 = attr.class(() => state.className);

  node2(div);

  await delay(0);

  assertEquals("test-2", div.className);

  state.className = "test-3";

  await delay(0);

  assertEquals("test-3", div.className);
});

Deno.test("bool attr test", async () => {
  const doc = new DOM.DOMParser().parseFromString(
    "<body></body>",
    "text/html",
  )!;
  const input = doc.createElement("input") as unknown as HTMLInputElement;
  const state = watch<{ checked: boolean }>({ checked: false });
  const node1 = attr.checked(true);

  node1(input);

  await delay(0);

  assertEquals(true, input.hasAttribute("checked"));

  const node2 = attr.checked(() => state.checked);

  node2(input);

  await delay(0);

  assertEquals(false, input.hasAttribute("checked"));

  state.checked = true;

  await delay(0);

  assertEquals(true, input.hasAttribute("checked"));
});
