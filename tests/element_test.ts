import "./hooks.ts";
import { assertEquals } from "@std/assert";
import { delay } from "@std/async";
import type { HandcraftNode, HandcraftTag } from "../types.ts";

Deno.test("html", async () => {
  const { HandcraftElementWithAttributes, html, text, watch, attr } =
    await import(
      "../mod.ts?reload"
    );

  class TestElement extends HandcraftElementWithAttributes {
    static observedAttributes = ["num", "str", "bool"];

    override state: { num: number; str: string; bool: boolean } = watch({
      num: 3,
      str: "three",
      bool: false,
    });

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

  let node;

  node = testElement();

  node(div);

  await delay(0);

  assertEquals(
    "<test-element><ul><li>0</li><li>1</li><li>2</li></ul></test-element>",
    div.innerHTML,
  );

  node = testElement(attr.num(4), attr.str("four"), attr.bool(true));

  node(div, div.firstChild);

  await delay(0);

  assertEquals(
    `<test-element num="4" str="four" bool=""><ul><li>0</li><li>1</li><li>2</li></ul></test-element>`,
    div.innerHTML,
  );
});
