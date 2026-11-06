import { GlobalRegistrator } from "@happy-dom/global-registrator";

Deno.test.beforeEach(() => {
  GlobalRegistrator.register({
    url: "http://localhost:3000",
    width: 1920,
    height: 1080,
  });

  document.body.innerHTML = `<div id="app"></div>`;
});

Deno.test.afterEach(() => {
  GlobalRegistrator.unregister();
});
