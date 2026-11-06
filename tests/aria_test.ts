import "./hooks.ts";
import { assertEquals } from "@std/assert";
import { delay } from "@std/async";
import { aria, watch } from "../mod.ts";

Deno.test("aria", async () => {
  const div = document.createElement("div");
  const state = watch<{ ariaLabel: string }>({ ariaLabel: "test-2" });
  const node1 = aria.label("test-1");

  node1(div);

  await delay(0);

  assertEquals("test-1", div.getAttribute("aria-label"));

  const node2 = aria.label(() => state.ariaLabel);

  node2(div);

  await delay(0);

  assertEquals("test-2", div.getAttribute("aria-label"));

  state.ariaLabel = "test-3";

  await delay(0);

  assertEquals("test-3", div.getAttribute("aria-label"));
});
