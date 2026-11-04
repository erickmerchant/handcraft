import { assertEquals } from "@std/assert";
import { delay } from "@std/async";
import * as DOM from "@b-fuze/deno-dom";
import { effect, watch } from "../mod.ts";

Deno.test("effect test", async () => {
  const doc = new DOM.DOMParser().parseFromString(
    "<body></body>",
    "text/html",
  )!;
  const div = doc.createElement("div") as unknown as HTMLDivElement;
  const state = watch<{ className: string }>({ className: "test-1" });
  const node1 = effect((el: Element) => {
    el.className = state.className;
  });

  node1(div);

  await delay(0);

  assertEquals("test-1", div.className);

  state.className = "test-2";

  await delay(0);

  assertEquals("test-2", div.className);
});
