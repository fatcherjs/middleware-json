// eslint-disable-next-line @typescript-eslint/no-unused-vars

import 'fatcher';

declare module 'fatcher' {
  interface FatcherOptions {
    progressive?: {
      isPlaceholder: (value: string) => boolean;
    };
  }

  interface FatcherResponse {
    skeleton: Record<string, any>;
    snapshot: Record<string, any>;
  }
}

export {};
