import { assertEquals } from "@std/assert";
import { delay } from "@std/async";
import * as DOM from "@b-fuze/deno-dom";
import { $, text } from "../mod.ts";

Deno.test("dollar test", async () => {
  const doc = new DOM.DOMParser().parseFromString("<body></body>", "text/html");

  globalThis.document = doc as unknown as Document;
  // @ts-ignore{2741}
  globalThis.Element = DOM.Element as unknown as Element;

  const div = doc.createElement("div");

  div.setAttribute("id", "test");

  doc.appendChild(div);

  $("#test", doc as unknown as Element)(text("1 2 3"));

  await delay(0);

  assertEquals("1 2 3", div.innerText);
});
