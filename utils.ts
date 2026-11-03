/**
 * ...
 */
export function resolveValue<T>(value: T | (() => T)): T {
  return typeof value === "function" ? (value as CallableFunction)() : value;
}

/**
 * ...
 */
export function recordProxy<T>(getter: (name: string) => T): Record<string, T> {
  return new Proxy(
    {},
    {
      get(_, name: string) {
        return getter(name);
      },
    },
  ) as Record<string, T>;
}
