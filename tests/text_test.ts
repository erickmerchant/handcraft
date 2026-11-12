import "./hooks.ts";
import { assertEquals } from "@std/assert";
import { delay } from "@std/async";
import { text, watch } from "../mod.ts";

Deno.test("text - static", async () => {
  const div = document.createElement("div") as unknown as HTMLDivElement;
  const node1 = text("test-1");

  node1(div);

  await delay(0);

  assertEquals("test-1", div.innerText);
});

Deno.test("text - dynamic", async () => {
  const div = document.createElement("div") as unknown as HTMLDivElement;
  const state = watch<{ innerText: string }>({ innerText: "test-2" });

  const node2 = text(() => state.innerText);

  node2(div);

  await delay(0);

  assertEquals("test-2", div.innerText);

  state.innerText = "test-3";

  await delay(0);

  assertEquals("test-3", div.innerText);
});
