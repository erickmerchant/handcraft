import type { HandcraftValue } from "./types.ts";
import { resolveValue } from "./utils.ts";

export default (
  tokens: Record<string, HandcraftValue<boolean>>,
): () => string => {
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
};
