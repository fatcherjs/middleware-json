import { fatcher } from 'fatcher';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { json } from '../src';

const server = setupServer(
  http.get('https://foo.bar/get', async () => {
    return HttpResponse.json({
      success: true,
    });
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('fatcher-middleware-json', () => {
  it('Response json with json data', async () => {
    const res = await fatcher('https://foo.bar/get', {
      middlewares: [json],
    });

    const streamingJson = await res.readStreamAsJson();
    expect(streamingJson).toStrictEqual({
      success: true,
    });
  });

  it('Read string data with chunk', async () => {
    const res = await fatcher('https://foo.bar/get', {
      middlewares: [json],
    });

    const streamingJson = await res.readStreamAsJson((string, buffer) => {
      expect(typeof string).toBe('string');
      expect(buffer instanceof Uint8Array).toBe(true);
    });

    expect(streamingJson).toStrictEqual({
      success: true,
    });
  });
});
