export function withResolvers<T>() {
  let resolve!: (v: T) => void;
  let reject!: () => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
