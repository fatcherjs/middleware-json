import { describe, expect, it } from 'vitest';
import { Parser } from '../src/parser';

describe('Parser - basic', () => {
  it('parses a complete object in one chunk', () => {
    const parser = new Parser();

    parser.parse('{"a":1,"b":2}');

    expect(parser.drain()).toEqual([{ a: 1, b: 2 }]);
    expect(parser.drain()).toEqual([]); // drain 后清空
  });

  it('parses multiple JSON frames in one chunk', () => {
    const parser = new Parser();

    parser.parse('{"a":1}{"b":2}');

    expect(parser.drain()).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it('parses top-level array', () => {
    const parser = new Parser();

    parser.parse('[1,2,3]');

    expect(parser.drain()).toEqual([[1, 2, 3]]);
  });
});
describe('Parser - chunked input', () => {
  it('parses JSON split across chunks', () => {
    const parser = new Parser();

    parser.parse('{ "a": ');
    expect(parser.drain()).toEqual([]);

    parser.parse('1, "b": ');
    expect(parser.drain()).toEqual([]);

    parser.parse('{ "c": 2 } }');

    expect(parser.drain()).toEqual([{ a: 1, b: { c: 2 } }]);
  });

  it('handles chunks split at every character', () => {
    const parser = new Parser();
    const json = '{"a":1,"b":[1,2,{"c":3}]}';

    for (const char of json) {
      parser.parse(char);
    }

    expect(parser.drain()).toEqual([{ a: 1, b: [1, 2, { c: 3 }] }]);
  });
});

describe('Parser - strings & escape', () => {
  it('handles escaped quotes', () => {
    const parser = new Parser();

    parser.parse('{ "a": "he said \\"hi\\"" }');

    expect(parser.drain()).toEqual([{ a: 'he said "hi"' }]);
  });

  it('handles escaped backslash', () => {
    const parser = new Parser();

    parser.parse('{ "a": "c:\\\\path\\\\file" }');

    expect(parser.drain()).toEqual([{ a: 'c:\\path\\file' }]);
  });

  it('ignores braces inside strings', () => {
    const parser = new Parser();

    parser.parse('{ "a": "{ [ not json ] }" }');

    expect(parser.drain()).toEqual([{ a: '{ [ not json ] }' }]);
  });

  it('handles newline inside string', () => {
    const parser = new Parser();

    parser.parse('{ "a": "line1\\nline2" }');

    expect(parser.drain()).toEqual([{ a: 'line1\nline2' }]);
  });
});
describe('Parser - whitespace & framing', () => {
  it('ignores leading whitespace', () => {
    const parser = new Parser();

    parser.parse('\n  \t {"a":1}');

    expect(parser.drain()).toEqual([{ a: 1 }]);
  });

  it('handles whitespace between frames', () => {
    const parser = new Parser();

    parser.parse('{"a":1}   \n  {"b":2}');

    expect(parser.drain()).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it('does not emit incomplete JSON', () => {
    const parser = new Parser();

    parser.parse('{ "a": 1');

    expect(parser.drain()).toEqual([]);
  });
});
describe('Parser - errors', () => {
  it('throws on invalid start character', () => {
    const parser = new Parser();

    expect(() => {
      parser.parse('x{"a":1}');
    }).toThrow(TypeError);
  });

  it('throws on mismatched brackets', () => {
    const parser = new Parser();

    expect(() => {
      parser.parse('{ "a": [1, 2 }');
    }).toThrow(TypeError);
  });

  it('throws on extra closing bracket', () => {
    const parser = new Parser();

    expect(() => {
      parser.parse('{"a":1}}');
    }).toThrow(TypeError);
  });
});
describe('Parser - fuzz', () => {
  it('parses JSON with random chunk sizes', () => {
    const value = {
      a: 1,
      b: [1, 2, { c: 'hello', d: '\\escaped"' }],
    };

    const json = JSON.stringify(value);

    for (let i = 0; i < 50; i++) {
      const parser = new Parser();
      let cursor = 0;

      while (cursor < json.length) {
        const size = Math.max(1, Math.floor(Math.random() * 4));
        parser.parse(json.slice(cursor, cursor + size));
        cursor += size;
      }

      expect(parser.drain()).toEqual([value]);
    }
  });
});
