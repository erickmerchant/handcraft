import "./hooks.ts";
import { assertEquals } from "@std/assert";
import { delay } from "@std/async";
import { prop, watch } from "../mod.ts";

Deno.test("prop", async () => {
  const div = document.createElement("div") as unknown as HTMLDivElement;
  const state = watch<{ className: string }>({ className: "test-2" });
  const node1 = prop.className("test-1");

  node1(div);

  await delay(0);

  assertEquals("test-1", div.className);

  const node2 = prop.className(() => state.className);

  node2(div);

  await delay(0);

  assertEquals("test-2", div.className);

  state.className = "test-3";

  await delay(0);

  assertEquals("test-3", div.className);
});
