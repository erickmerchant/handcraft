type View<T, R> =
  & {
    [Property in keyof T]-?: (a: T[Property]) => View<T, R>;
  }
  & (() => R);

export function view<
  // deno-lint-ignore no-explicit-any
  T extends Record<string | symbol, any>,
  R,
>(cb: (context: T) => R): View<T, R> {
  // deno-lint-ignore no-explicit-any
  const context: Record<string | symbol, any> = {};

  return new Proxy(() => {}, {
    apply() {
      return cb(context as T);
    },
    get(_, p: string | symbol, self) {
      // deno-lint-ignore no-explicit-any
      return (arg: any) => {
        context[p] = arg;

        return self;
      };
    },
  }) as View<T, R>;
}
