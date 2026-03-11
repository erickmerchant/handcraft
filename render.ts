import { GlobalRegistrator } from "@happy-dom/global-registrator";
import type { HandcraftElement } from "./mod.ts";
import { NODE } from "./mod.ts";

export async function render(
  view: () => HandcraftElement | Promise<HandcraftElement>,
): Promise<string> {
  GlobalRegistrator.register({
    url: "http://localhost:3000",
    width: 1920,
    height: 1080,
    settings: {
      handleDisabledFileLoadingAsSuccess: true,
      disableCSSFileLoading: true,
      disableJavaScriptFileLoading: true,
    },
  });

  const v = await view();

  const { resolve, promise, reject } = Promise.withResolvers<string>();

  setTimeout(async () => {
    try {
      const el = v[NODE];
      let html = "";

      // @ts-ignore undefined global
      await globalThis.happyDOM.waitUntilComplete();

      if (el && el instanceof Element) {
        html = `<!doctype html>${
          el.getHTML({ serializableShadowRoots: true })
        }`;
      }

      await GlobalRegistrator.unregister();

      resolve(html);
    } catch (e) {
      reject(e);
    }
  }, 0);

  return promise;
}
