import { fatcher } from 'fatcher';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { json } from '../src';

const server = setupServer(
  http.get('https://foo.bar/get', async () => {
    return new HttpResponse();
  }),
  http.get('https://foo.bar/non-json', async () => {
    return HttpResponse.text('non-json');
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('fatcher-middleware-json', () => {
  it('Provide a json read function', async () => {
    const res = await fatcher('https://foo.bar/get', {
      middlewares: [json],
    });

    expect(typeof res.readStreamAsJson).toEqual('function');
  });

  it('Return null with empty body', async () => {
    const res = await fatcher('https://foo.bar/get', {
      middlewares: [json],
    });

    expect(await res.readStreamAsJson()).toBe(null);
  });

  it('Return null with used body', async () => {
    const res = await fatcher('https://foo.bar/get', {
      middlewares: [
        json,
        async (req, next) => {
          const response = await next();
          await response.text();
          return response;
        },
      ],
    });

    expect(await res.readStreamAsJson()).toBe(null);
  });

  it('Return null with non-json data', async () => {
    const res = await fatcher('https://foo.bar/non-json', {
      middlewares: [json],
    });

    expect(await res.readStreamAsJson()).toBe(null);
  });
});
