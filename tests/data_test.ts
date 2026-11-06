import "./hooks.ts";
import { assertEquals } from "@std/assert";
import { delay } from "@std/async";
import { data, watch } from "../mod.ts";

Deno.test("data", async () => {
  const div = document.createElement("div") as unknown as HTMLDivElement;
  const state = watch<{ dataFoo: string }>({ dataFoo: "test-2" });
  const node1 = data.foo("test-1");

  node1(div);

  await delay(0);

  assertEquals("test-1", div.getAttribute("data-foo"));

  const node2 = data.foo(() => state.dataFoo);

  node2(div);

  await delay(0);

  assertEquals("test-2", div.getAttribute("data-foo"));

  state.dataFoo = "test-3";

  await delay(0);

  assertEquals("test-3", div.getAttribute("data-foo"));
});
