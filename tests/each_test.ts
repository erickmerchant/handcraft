import "./hooks.ts";
import { assertEquals } from "@std/assert";
import { delay } from "@std/async";
import { attr, each, html, on, text, watch } from "../mod.ts";

Deno.test("each", async () => {
  const div = document.createElement("div") as unknown as HTMLDivElement;

  div.innerHTML = "<div><ul><!-- <> --><li>0 one</li><!-- </> --></ul></div>";

  const state = watch<Array<{ text: string }>>(
    [
      { text: "one" },
      { text: "two" },
      { text: "three" },
    ]
      .map((model) => watch(model)),
  );
  const node = html.div(html.ul(
    each(state)
      .filter((model) => model.text !== "four")
      .map((model, index) => html.li(text(() => `${index()} ${model.text}`)))
      .fallback(() => html.li(text("-"))),
  ));

  node(div, div.firstChild);

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

Deno.test("each", async () => {
  const div = document.createElement("div") as unknown as HTMLDivElement;
  const state = watch<Array<{ text?: string }>>(
    [{ text: "-" }, { text: "-" }, { text: "-" }]
      .map((model) => watch(model)),
  );
  const node = html.div(
    html.ul(
      each(state)
        .map((model, index) =>
          html.li(
            text(() => `${model.text ?? "x"}`),
            html.button(
              attr.id(() => `double-${index()}`),
              on.click(() => {
                model.text = model.text?.repeat?.(2);
              }),
              text("double"),
            ),
            html.button(
              attr.id(() => `clear-${index()}`),
              on.click(() => {
                delete model.text;
              }),
              text("clear"),
            ),
          )
        ),
    ),
  );

  node(div);

  await delay(0);

  assertEquals(
    `<div><ul><!-- <> --><li>-<button id="double-0">double</button><button id="clear-0">clear</button></li><li>-<button id="double-1">double</button><button id="clear-1">clear</button></li><li>-<button id="double-2">double</button><button id="clear-2">clear</button></li><!-- </> --></ul></div>`,
    div.innerHTML,
  );

  div.querySelector("#double-1")?.dispatchEvent(new Event("click"));

  div.querySelector("#clear-2")?.dispatchEvent(new Event("click"));

  await delay(0);

  assertEquals(
    `<div><ul><!-- <> --><li>-<button id="double-0">double</button><button id="clear-0">clear</button></li><li>--<button id="double-1">double</button><button id="clear-1">clear</button></li><li>x<button id="double-2">double</button><button id="clear-2">clear</button></li><!-- </> --></ul></div>`,
    div.innerHTML,
  );
});
