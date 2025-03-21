function cleanNulls<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      key,
      value === null ? undefined : value,
    ]),
  ) as T;
}
