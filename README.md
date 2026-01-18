# @fatcherjs/middleware-json

<div align="center">
  <a href="https://codecov.io/github/fatcherjs/middleware-json" > 
    <img src="https://codecov.io/github/fatcherjs/middleware-json/graph/badge.svg?token=TFKUGW6YNI"/> 
 </a>
  <a href="https://www.jsdelivr.com/package/npm/@fatcherjs/middleware-json">
    <img src="https://data.jsdelivr.com/v1/package/npm/@fatcherjs/middleware-json/badge?style=rounded" alt="jsDelivr">
  </a>
  <a href="https://packagephobia.com/result?p=@fatcherjs/middleware-json">
    <img src="https://packagephobia.com/badge?p=@fatcherjs/middleware-json" alt="install size">
  </a>
  <a href="https://unpkg.com/@fatcherjs/middleware-json">
    <img src="https://img.badgesize.io/https://unpkg.com/@fatcherjs/middleware-json" alt="Size">
  </a>
  <a href="https://npmjs.com/package/@fatcherjs/middleware-json">
    <img src="https://img.shields.io/npm/v/@fatcherjs/middleware-json.svg" alt="npm package">
  </a>
  <a href="https://github.com/fatcherjs/middleware-json/actions/workflows/ci.yml">
    <img src="https://github.com/fatcherjs/middleware-json/actions/workflows/ci.yml/badge.svg?branch=master" alt="build status">
  </a>
</div>

## Install

### NPM

```bash
>$ npm install @fatcherjs/middleware-json
```

### CDN

```html
<script src="https://cdn.jsdelivr.net/npm/fatcher/dist/fatcher.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@fatcherjs/middleware-json/dist/index.min.js"></script>

<script>
  Fatcher.fatcher('url', {
    middlewares: [FatcherMiddlewareJson],
    progressive: {
      isPlaceholder: (value) => value.startsWith('$$');
    }
  }).then(response => {
    console.log(response.skeleton); // Promise Tree
    console.log(response.snapshot); // Progressive Json
  });
</script>
```

## Usage

```ts
import { fatcher } from 'fatcher';
import { json } from '@fatcherjs/middleware-json';

const res = await fatcher('https://foo.bar/get', {
  middlewares: [json],
  progressive: {
    isPlaceholder: (value) => value.startsWith('$$');
  }
});

console.log(response.skeleton); // Promise Tree
console.log(response.snapshot); // Progressive Json
```

## Examples

### React 19

[Code Sandbox](https://codesandbox.io/p/sandbox/fatcher-progressive-json-kdn9w3)

```jsx
import { useState } from 'react';
import { json } from '@fatcherjs/middleware-json';
import { fatcher } from 'fatcher';
import { use, Suspense } from 'react';
function delay(ms) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

async function fetchMessage() {
  const response = await fatcher('https://test.com', {
    progressive: {
      isPlaceholder: value => value.startsWith('$$'),
    },
    middlewares: [
      json,
      () => {
        return new Response(
          new ReadableStream({
            async start(controller) {
              controller.enqueue(new TextEncoder().encode(JSON.stringify({ userInfo: '$$1' })));
              await delay(300);
              controller.enqueue(
                new TextEncoder().encode(
                  JSON.stringify({
                    $$1: { name: 'Alice', age: 18 },
                  }),
                ),
              );
              controller.close();
            },
          }),
        );
      },
    ],
  });

  return response.skeleton;
}

function UserInfo({ userInfoPromise }) {
  const userInfo = use(userInfoPromise);

  return userInfo ? `${userInfo.name} (${userInfo.age})` : 'loading...';
}

function Message({ skeleton }) {
  const data = use(skeleton);

  return (
    <p>
      Here is the message:{' '}
      <Suspense fallback={<p>⌛Downloading UserInfo...</p>}>
        <UserInfo userInfoPromise={data.userInfo} />
      </Suspense>
    </p>
  );
}

export default function App() {
  const [skeleton, setSkeleton] = useState(null);

  async function download() {
    setSkeleton(fetchMessage());
  }

  if (!skeleton) {
    return <button onClick={download}>Download message</button>;
  }

  return (
    <Suspense fallback={<p>⌛Downloading message...</p>}>
      <Message skeleton={skeleton} />
    </Suspense>
  );
}
```

## License

[MIT](https://github.com/fatcherjs/middleware-json/blob/master/LICENSE)
