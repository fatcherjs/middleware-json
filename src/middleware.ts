import { readStreamByChunk } from '@fatcherjs/utils-shared';
import { FatcherMiddleware, FatcherResponse } from 'fatcher';
import { Assembler } from './assembler';
import { Parser } from './parser';
import { withResolvers } from './utils';

export const json: FatcherMiddleware = {
  name: 'fatcher-middleware-json',
  use: async (context, next) => {
    const response = await next();

    if (!context.progressive) {
      return response;
    }

    if (response.bodyUsed || !response.body) {
      return response;
    }

    let resolved = false;
    const { promise, resolve } = withResolvers();

    const assembler = new Assembler(context.progressive.isPlaceholder);

    const readableStream = new ReadableStream({
      async start(controller) {
        const textDecoder = new TextDecoder();
        const parser = new Parser();

        await readStreamByChunk(response.clone().body!, chunk => {
          const text = textDecoder.decode(chunk, { stream: true });
          parser.parse(text);

          const frames = parser.drain();
          for (const frame of frames) {
            assembler.consume(frame);
            if (!resolved && assembler.skeleton) {
              resolved = true;
              resolve(assembler.skeleton);
            }
          }
        });

        controller.enqueue(new TextEncoder().encode(JSON.stringify(assembler.snapshot)));
        controller.close();
      },
    });

    await promise;
    const newResponse = new Response(readableStream, response) as FatcherResponse;
    newResponse.skeleton = assembler.skeleton!;
    newResponse.snapshot = assembler.snapshot;
    return newResponse;
  },
};
