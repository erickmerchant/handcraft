import { assertEquals } from "@std/assert";
import { delay } from "@std/async";
import { run, watch } from "../mod.ts";

Deno.test("watch and run test", async () => {
  const state = watch<{ count?: number }>({ count: 0 });
  let count: number | undefined = 0;

  run(() => {
    count = state.count;
  });

  await delay(0);

  assertEquals(0, count);

  state.count = 1;

  await delay(0);

  assertEquals(1, count);

  state.count = 2;
  state.count = 3;

  await delay(0);

  assertEquals(3, count);

  delete state.count;

  await delay(0);

  assertEquals(undefined, count);
});
