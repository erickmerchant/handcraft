import { assertEquals } from "@std/assert";
import { delay } from "@std/async";
import { DOMParser } from "@b-fuze/deno-dom";
import { $, text } from "../mod.ts";

Deno.test("dollar test", async () => {
  const doc = new DOMParser().parseFromString("<body></body>", "text/html");

  globalThis.document = doc as unknown as Document;

  const div = doc.createElement("div");

  div.setAttribute("id", "test");

  doc.appendChild(div);

  $("#test", doc as unknown as Element)(text("1 2 3"));

  await delay(0);

  assertEquals("1 2 3", div.innerText);
});
