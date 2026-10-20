import type { HandcraftValue } from "./mod.ts";
import { resolveValue } from "./mod.ts";

export default function (
  tokens: Record<string, HandcraftValue<boolean>>,
): () => string {
  const result = new Set();

  return () => {
    for (const [key, value] of Object.entries(tokens)) {
      if (resolveValue(value)) {
        result.add(key);
      } else {
        result.delete(key);
      }
    }

    return [...result].join(" ");
  };
}
