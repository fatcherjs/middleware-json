import { isPlainObject, isPromise, isString, pickBy } from 'es-toolkit';
import { set } from 'es-toolkit/compat';
import { withResolvers } from './utils';

type ProgressiveJSON = Record<string, any>;

type Placeholder = {
  resolve: (value: ProgressiveJSON) => void;
  promise: Promise<ProgressiveJSON>;
  path: string;
};

export class Assembler {
  skeleton: ProgressiveJSON | null = null;
  snapshot: ProgressiveJSON = {};

  private buffer = new Map<string, Placeholder>();

  constructor(readonly isPlaceholder: (value: string) => boolean) {}

  consume(frame: ProgressiveJSON) {
    if (!isPlainObject(frame)) {
      throw new TypeError('Frame must be an object');
    }

    if (!this.skeleton) {
      this.skeleton = this.replaceFrameValues(frame);
      this.snapshot = pickBy(this.skeleton, item => !isPromise(item));
      return;
    }

    const keys = Object.keys(frame);

    if (keys.some(key => !this.isPlaceholder(key))) {
      throw new TypeError('Patch has an invalid key');
    }

    for (const key of keys) {
      if (!this.buffer.has(key)) {
        throw new TypeError('It is a unknown patch');
      }

      const { resolve, path } = this.buffer.get(key)!;

      const value = frame[key];

      if (isPlainObject(value)) {
        const nextValue = this.replaceFrameValues(value, path);

        set(
          this.snapshot,
          path,
          pickBy(nextValue, item => !isPromise(item)),
        );

        resolve(nextValue);
        continue;
      }

      set(this.snapshot, path, value);
      resolve(value);
    }
  }

  replaceFrameValues(frame: ProgressiveJSON, path?: string) {
    return Object.fromEntries(
      Object.entries(frame).map(item => {
        const [key, value] = item;
        const target = [path, key].filter(Boolean).join('.');
        if (isString(value) && this.isPlaceholder(value)) {
          const resolver = withResolvers<ProgressiveJSON>();

          this.buffer.set(value, {
            promise: resolver.promise,
            resolve: resolver.resolve,
            path: target,
          });
          return [key, resolver.promise];
        }

        return item;
      }),
    );
  }
}
