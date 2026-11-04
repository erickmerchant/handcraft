import { assertEquals } from "@std/assert";
import { tokens } from "../mod.ts";

Deno.test("tokens test", () => {
  const state = {
    a: false,
    b: true,
  };

  const list = tokens({
    a: () => state.a,
    b: () => state.b,
    c: true,
  });

  assertEquals("b c", list());

  state.a = true;
  state.b = false;

  assertEquals("a c", list());
});
