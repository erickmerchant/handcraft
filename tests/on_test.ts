import { assertEquals } from "@std/assert";
import { delay } from "@std/async";
import * as DOM from "@b-fuze/deno-dom";
import { on } from "../mod.ts";

Deno.test("on test", async () => {
  const doc = new DOM.DOMParser().parseFromString(
    "<body></body>",
    "text/html",
  )!;

  globalThis.document = doc as unknown as Document;
  // @ts-ignore{2741}
  globalThis.Element = DOM.Element as unknown as Element;

  const div = doc.createElement("div") as unknown as HTMLDivElement;

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
