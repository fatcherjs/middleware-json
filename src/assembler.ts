import { isPlainObject, isString } from 'es-toolkit';
import { withResolvers } from './utils';

type ValidJSON = any[] | Record<string, any>;

type Placeholder = {
  resolve: (value: ValidJSON) => void;
  promise: Promise<ValidJSON>;
};

export class Assembler {
  skeleton: ValidJSON | null = null;

  private buffer = new Map<string, Placeholder>();

  constructor(readonly isPlaceholder: (value: string) => boolean) {}

  consume(frame: ValidJSON) {
    if (!this.skeleton) {
      this.skeleton = this.replaceFrameValues(frame);
      return;
    }

    if (!isPlainObject(frame)) {
      throw new TypeError('Patch must be an object');
    }

    const keys = Object.keys(frame);

    if (keys.some(key => !this.isPlaceholder(key))) {
      throw new TypeError('Patch has an invalid key');
    }

    for (const key of keys) {
      if (!this.buffer.has(key)) {
        throw new TypeError('It is a unknown patch');
      }

      const { resolve } = this.buffer.get(key)!;

      // @ts-expect-error
      const value = frame[key];

      if (!isPlainObject(value) && !Array.isArray(value)) {
        resolve(value);
      } else {
        resolve(this.replaceFrameValues(value));
      }
    }
  }

  replaceFrameValues(frame: ValidJSON) {
    if (Array.isArray(frame)) {
      return frame.map(item => {
        if (isString(item) && this.isPlaceholder(item)) {
          const resolver = withResolvers<ValidJSON>();
          this.buffer.set(item, resolver);
          return resolver.promise;
        }

        return item;
      });
    }

    return Object.fromEntries(
      Object.entries(frame).map(item => {
        const [key, value] = item;

        if (isString(value) && this.isPlaceholder(value)) {
          const resolver = withResolvers<ValidJSON>();
          this.buffer.set(value, resolver);
          return [key, resolver.promise];
        }

        return item;
      }),
    );
  }
}
