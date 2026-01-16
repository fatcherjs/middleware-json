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

    expect(assembler.skeleton.a).toBeInstanceOf(Promise);
    expect(assembler.skeleton.b).toBe(2);
  });

  it('skeleton can be a array', () => {
    const assembler = new Assembler(isPlaceholder);

    assembler.consume(['$$1', '$$2', 'test']);

    expect(assembler.skeleton[0]).toBeInstanceOf(Promise);
    expect(assembler.skeleton[1]).toBeInstanceOf(Promise);
    expect(assembler.skeleton[2]).toBe('test');
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

    expect(assembler.skeleton.a).toBeInstanceOf(Promise);
    expect(await assembler.skeleton.a).toBe('test');
  });

  it('Patch Can Resolve Multi Placeholder', async () => {
    const assembler = new Assembler(isPlaceholder);

    assembler.consume({
      a: '$$1',
      b: '$$2',
    });

    assembler.consume({ $$1: 'test', $$2: 'test2' });

    expect(assembler.skeleton.a).toBeInstanceOf(Promise);
    expect(await assembler.skeleton.a).toBe('test');

    expect(assembler.skeleton.b).toBeInstanceOf(Promise);
    expect(await assembler.skeleton.b).toBe('test2');
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

    expect(assembler.skeleton.a).toBeInstanceOf(Promise);
    const a = await assembler.skeleton.a;
    expect(a.c).toBeInstanceOf(Promise);
    expect(a.d).toBe(4);
  });
});

describe('Assembler Exception', () => {
  it('Patch is not an object', () => {
    const assembler = new Assembler(isPlaceholder);

    assembler.consume({
      a: '$$1',
    });

    try {
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
