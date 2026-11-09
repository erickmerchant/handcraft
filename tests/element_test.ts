import "./hooks.ts";
import { assertEquals } from "@std/assert";
import { delay } from "@std/async";
import type { HandcraftNode, HandcraftTag } from "../types.ts";

Deno.test("html", async () => {
  const { HandcraftElementWithAttributes, html, text, watch } = await import(
    "../mod.ts?reload"
  );

  class TestElement extends HandcraftElementWithAttributes {
    static observedAttributes = ["num"];

    override state: { num: number } = watch({ num: 3 });

    override view(host: HandcraftTag): HandcraftNode {
      return host(
        html.ul(
          ...[...Array(this.state.num).keys()].map(
            (i) => html.li(text(`${i}`)),
          ),
        ),
      );
    }
  }

  const testElement = TestElement.define("test-element");
  const div = document.createElement("div") as unknown as HTMLDivElement;

  document.body.append(div);

  const node = testElement();

  node(div);

  await delay(0);

  assertEquals(
    "<test-element><ul><li>0</li><li>1</li><li>2</li></ul></test-element>",
    div.innerHTML,
  );
});
