import "./hooks.ts";
import { assertEquals } from "@std/assert";
import { delay } from "@std/async";
import { html, text, watch, when } from "../mod.ts";

Deno.test("when", async () => {
  const div = document.createElement("div") as unknown as HTMLDivElement;
  const state = watch<{ value: boolean }>({ value: false });
  const node = html.div(
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
});
