import "./hooks.ts";
import { assertEquals } from "@std/assert";
import { delay } from "@std/async";
import { each, html, text, watch } from "../mod.ts";

Deno.test("each", async () => {
  const div = document.createElement("div") as unknown as HTMLDivElement;
  const state = watch(
    [{ text: "one" }, { text: "two" }, { text: "three" }]
      .map((model) => watch(model)),
  );
  const node = html.div(html.ul(
    each(state)
      .filter((model) => model.text !== "four")
      .map((model, index) => html.li(text(() => `${index()} ${model.text}`)))
      .fallback(() => html.li(text("-"))),
  ));

  node(div);

  await delay(0);

  assertEquals(
    "<div><ul><!-- <> --><li>0 one</li><li>1 two</li><li>2 three</li><!-- </> --></ul></div>",
    div.innerHTML,
  );

  state.splice(0, 0, watch({ text: "zero" }));

  await delay(0);

  assertEquals(
    "<div><ul><!-- <> --><li>0 zero</li><li>1 one</li><li>2 two</li><li>3 three</li><!-- </> --></ul></div>",
    div.innerHTML,
  );

  state.splice(state.length, 0, watch({ text: "four" }));

  await delay(0);

  assertEquals(
    "<div><ul><!-- <> --><li>0 zero</li><li>1 one</li><li>2 two</li><li>3 three</li><!-- </> --></ul></div>",
    div.innerHTML,
  );

  state.splice(2, 2);

  await delay(0);

  assertEquals(
    "<div><ul><!-- <> --><li>0 zero</li><li>1 one</li><!-- </> --></ul></div>",
    div.innerHTML,
  );

  state.splice(0, 2);

  await delay(0);

  assertEquals(
    "<div><ul><!-- <> --><li>-</li><!-- </> --></ul></div>",
    div.innerHTML,
  );
});
