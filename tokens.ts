import type { HandcraftValue } from "./types.ts";
import { resolveValue } from "./utils.ts";

export default (
  tokens: Record<string, HandcraftValue<boolean>>,
): () => string => {
  return () => {
    const result = [];

    for (const [key, value] of Object.entries(tokens)) {
      if (resolveValue(value)) {
        result.push(key);
      }
    }

    return result.join(" ");
  };
};
