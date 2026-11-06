import "./hooks.ts";
import { assertEquals } from "@std/assert";
import { delay } from "@std/async";
import { $, text } from "../mod.ts";

Deno.test("dollar", async () => {
  const div = document.createElement("div");

  div.setAttribute("id", "test");

  document.body.appendChild(div);

  $("#test", document)(text("1 2 3"));

  await delay(0);

  assertEquals("1 2 3", div.innerHTML);
});
