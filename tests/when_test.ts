import "./hooks.ts";
import { assertEquals } from "@std/assert";
import { delay } from "@std/async";
import { html, text, watch, when } from "../mod.ts";

Deno.test("when - show / fallback", async () => {
  const div = document.createElement("div") as unknown as HTMLDivElement;
  const state = watch<{ value: boolean }>({ value: false });
  let node;

  node = html.div(
    when(() => state.value)
      .show(() => html.div(text("+")))
      .fallback(() => html.div(text("-"))),
  );

  node(div);

  await delay(0);

  assertEquals(
    "<div><!-- <> --><div>-</div><!-- </> --></div>",
    div.innerHTML,
  );

  state.value = true;

  await delay(0);

  assertEquals(
    "<div><!-- <> --><div>+</div><!-- </> --></div>",
    div.innerHTML,
  );

  node = html.div(
    when(() => state.value)
      .show(() => html.div(text("*"))),
  );

  state.value = false;

  node(div, div.firstChild);

  await delay(0);

  assertEquals(
    "<div><!-- <> --><!-- </> --></div>",
    div.innerHTML,
  );

  state.value = true;

  await delay(0);

  assertEquals(
    "<div><!-- <> --><div>*</div><!-- </> --></div>",
    div.innerHTML,
  );
});

Deno.test("when - nested", async () => {
  const div = document.createElement("div") as unknown as HTMLDivElement;

  div.innerHTML =
    `<div><!-- <> --><div><!-- <> --><div>&amp;</div><!-- </> --></div><!-- </> --></div>`;

  const node = html.div(
    when(() => true)
      .show(() =>
        html.div(
          when(() => true)
            .show(() => html.div(text("&"))),
        )
      ),
  );

  node(div, div.firstChild);

  await delay(0);

  assertEquals(
    "<div><!-- <> --><div><!-- <> --><div>&amp;</div><!-- </> --></div><!-- </> --></div>",
    div.innerHTML,
  );

  div.innerHTML = `<div>prerendered nonsense</div>`;

  node(div, div.firstChild);

  await delay(0);

  assertEquals(
    "<div><!-- <> --><div><!-- <> --><div>&amp;</div><!-- </> --></div><!-- </> --></div>",
    div.innerHTML,
  );
});
