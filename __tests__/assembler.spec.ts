import { describe, expect, it } from 'vitest';
import { Assembler } from '../src/assembler';

const isPlaceholder = (value: string) => value.startsWith('$$');

describe('Assembler Skeleton', () => {
  it('skeleton is replaced placeholder value to Promise', () => {
    const assembler = new Assembler(isPlaceholder);

    assembler.consume({
      a: '$$1',
      b: 2,
    });

    expect(assembler.skeleton!.a).toBeInstanceOf(Promise);
    expect(assembler.skeleton!.b).toBe(2);
  });
});

describe('Assembler Skeleton Patch', () => {
  it('Patch Will Resolve Placeholder', async () => {
    const assembler = new Assembler(isPlaceholder);

    assembler.consume({
      a: '$$1',
      b: 2,
    });

    assembler.consume({ $$1: 'test' });

    expect(assembler.skeleton!.a).toBeInstanceOf(Promise);
    expect(await assembler.skeleton!.a).toBe('test');
  });

  it('Patch Can Resolve Multi Placeholder', async () => {
    const assembler = new Assembler(isPlaceholder);

    assembler.consume({
      a: '$$1',
      b: '$$2',
    });

    assembler.consume({ $$1: 'test', $$2: 'test2' });

    expect(assembler.skeleton!.a).toBeInstanceOf(Promise);
    expect(await assembler.skeleton!.a).toBe('test');

    expect(assembler.skeleton!.b).toBeInstanceOf(Promise);
    expect(await assembler.skeleton!.b).toBe('test2');
  });

  it('Nested Placeholder', async () => {
    const assembler = new Assembler(isPlaceholder);

    assembler.consume({
      a: '$$1',
      b: '$$2',
    });

    assembler.consume({
      $$1: {
        c: '$$3',
        d: 4,
      },
    });

    expect(assembler.skeleton!.a).toBeInstanceOf(Promise);
    const a = await assembler.skeleton!.a;
    expect(a.c).toBeInstanceOf(Promise);
    expect(a.d).toBe(4);
  });
});

describe('Assembler Exception', () => {
  it('skeleton can not be a array', () => {
    const assembler = new Assembler(isPlaceholder);

    try {
      assembler.consume(['$$1', '$$2', 'test']);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });
  it('Patch is not an object', () => {
    const assembler = new Assembler(isPlaceholder);

    assembler.consume({
      a: '$$1',
    });

    try {
      // @ts-expect-error
      assembler.consume('test');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });

  it('Patch is invalid construct', () => {
    const assembler = new Assembler(isPlaceholder);

    assembler.consume({
      a: '$$1',
    });

    try {
      assembler.consume({ $$1: 1, test: 2 });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });

  it('Has an unknown patch', () => {
    const assembler = new Assembler(isPlaceholder);

    assembler.consume({
      a: '$$1',
    });

    try {
      assembler.consume({ $$2: 1 });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });
});

describe('Assembler Snapshot', () => {
  it('Snapshot has not unresolved value', () => {
    const assembler = new Assembler(isPlaceholder);

    assembler.consume({
      a: '$$1',
      b: 1,
    });

    expect(assembler.snapshot.a).toBe(undefined);
    expect(assembler.snapshot.b).toBe(1);
  });

  it('Snapshot update after patched', () => {
    const assembler = new Assembler(isPlaceholder);

    assembler.consume({
      a: '$$1',
      b: 1,
    });

    expect(assembler.snapshot.a).toBe(undefined);
    expect(assembler.snapshot.b).toBe(1);

    assembler.consume({
      $$1: 'abc',
    });

    expect(assembler.snapshot.a).toBe('abc');
  });

  it('Nested snapshot update', async () => {
    const assembler = new Assembler(isPlaceholder);

    assembler.consume({
      a: '$$1',
      b: '$$2',
    });

    expect(assembler.snapshot).toEqual({});

    assembler.consume({
      $$1: {
        c: '$$3',
        d: 4,
      },
    });

    expect(assembler.snapshot).toEqual({
      a: {
        d: 4,
      },
    });

    assembler.consume({
      $$3: {
        e: '$$4',
      },
    });

    expect(assembler.snapshot).toEqual({
      a: {
        c: {},
        d: 4,
      },
    });

    assembler.consume({
      $$4: {
        f: 'test',
      },
    });

    expect(assembler.snapshot).toEqual({
      a: {
        c: {
          e: {
            f: 'test',
          },
        },
        d: 4,
      },
    });
  });
});
