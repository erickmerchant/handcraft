import "./hooks.ts";
import { assertEquals } from "@std/assert";
import { delay } from "@std/async";
import { on } from "../mod.ts";

Deno.test("on", async () => {
  const div = document.createElement("div") as unknown as HTMLDivElement;

  let count = 0;

  const node = on.click(() => {
    count += 1;
  });

  node(div);

  div.dispatchEvent(new Event("click"));

  await delay(0);

  assertEquals(1, count);

  div.dispatchEvent(new Event("click"));

  await delay(0);

  assertEquals(2, count);
});
