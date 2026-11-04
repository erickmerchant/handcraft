// import { assertEquals } from "@std/assert";
// import { delay } from "@std/async";
import { assertEquals } from "@std/assert/unstable-equals";
import view from "../ssr.ts";

Deno.test("ssr test", () => {
  assertEquals("function", typeof view);
});
