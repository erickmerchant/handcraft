import "./hooks.ts";
import { assertEquals } from "@std/assert";
import { delay } from "@std/async";
import { html, text } from "../mod.ts";

Deno.test("html", async () => {
  const div = document.createElement("div") as unknown as HTMLDivElement;

  const node = html.ul(
    html.li(text("1")),
    html.li(text("2")),
    html.li(text("3")),
  );

  node(div);

  await delay(0);

  assertEquals("<ul><li>1</li><li>2</li><li>3</li></ul>", div.innerHTML);
});
