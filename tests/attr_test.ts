import "./hooks.ts";
import { assertEquals } from "@std/assert";
import { delay } from "@std/async";
import { attr, watch } from "../mod.ts";

Deno.test("attr", async () => {
  const div = document.createElement("div") as unknown as HTMLDivElement;
  const state = watch<{ className: string }>({ className: "test-2" });
  const node1 = attr.class("test-1");

  node1(div);

  await delay(0);

  assertEquals("test-1", div.getAttribute("class"));

  const node2 = attr.class(() => state.className);

  node2(div);

  await delay(0);

  assertEquals("test-2", div.getAttribute("class"));

  state.className = "test-3";

  await delay(0);

  assertEquals("test-3", div.getAttribute("class"));
});

Deno.test("attr", async () => {
  const input = document.createElement("input") as unknown as HTMLInputElement;
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
