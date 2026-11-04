import { assertEquals } from "@std/assert";
import { delay } from "@std/async";
import * as DOM from "@b-fuze/deno-dom";
import { html, text } from "../mod.ts";

Deno.test("html test", async () => {
  const doc = new DOM.DOMParser().parseFromString(
    "<body></body>",
    "text/html",
  )!;

  globalThis.document = doc as unknown as Document;
  // @ts-ignore{2741}
  globalThis.Element = DOM.Element as unknown as Element;

  const div = doc.createElement("div") as unknown as HTMLDivElement;

  const node = html.ul(
    html.li(text("1")),
    html.li(text("2")),
    html.li(text("3")),
  );

  node(div);

  await delay(0);

  assertEquals("<ul><li>1</li><li>2</li><li>3</li></ul>", div.innerHTML);
});
