import { fatcher } from 'fatcher';
import { delay, http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { json } from '../src';

function progressiveResponse(chunks: string[]) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      for (const chunk of chunks) {
        await delay(50);
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
const server = setupServer(
  http.get('https://foo.bar/empty', () => new HttpResponse()),
  http.get('https://foo.bar/plain', () => HttpResponse.json({ ok: true })),

  http.get('https://foo.bar/object', () =>
    progressiveResponse([
      '{ "a": "$$1", "b": "$$2" }',
      '{ "$$2": { "v": 2 } }',
      '{ "$$1": { "v": 1 } }',
    ]),
  ),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('fatcher-middleware-json', () => {
  it('does not affect body is null', async () => {
    const res = await fatcher('https://foo.bar/empty', {
      progressive: {
        isPlaceholder: v => v.startsWith('$$'),
      },
      middlewares: [json],
    });

    expect(res.body).toBe(null);
    expect(res.skeleton).toBe(undefined);
    expect(res.snapshot).toBe(undefined);
  });

  it('does not affect body is used', async () => {
    const res = await fatcher('https://foo.bar/plain', {
      progressive: {
        isPlaceholder: v => v.startsWith('$$'),
      },
      middlewares: [
        json,
        async (ctx, next) => {
          const response = await next();
          response.body?.getReader().read();
          return response;
        },
      ],
    });

    expect(res.bodyUsed).toBe(true);
    expect(res.skeleton).toBe(undefined);
    expect(res.snapshot).toBe(undefined);
  });

  it('does not affect normal fetch behavior', async () => {
    const res = await fatcher('https://foo.bar/plain', {
      middlewares: [json],
    });

    expect(await res.json()).toEqual({ ok: true });
  });

  it('assembles progressive object json into final response body', async () => {
    const res = await fatcher('https://foo.bar/object', {
      progressive: {
        isPlaceholder: v => v.startsWith('$$'),
      },
      middlewares: [json],
    });

    const data = await res.json();

    expect(data).toEqual({
      a: { v: 1 },
      b: { v: 2 },
    });
  });

  it('exposes progressive json', async () => {
    const res = await fatcher('https://foo.bar/object', {
      progressive: {
        isPlaceholder: v => v.startsWith('$$'),
      },
      middlewares: [json],
    });

    const root = res.skeleton;
    const progressive = res.snapshot;

    expect(root).toHaveProperty('a');
    expect(root).toHaveProperty('b');
    expect(progressive).toEqual({});

    await delay(50);
    expect(progressive).toEqual({
      b: {
        v: 2,
      },
    });

    await delay(50);
    expect(progressive).toEqual({
      a: {
        v: 1,
      },
      b: {
        v: 2,
      },
    });
  });
});
