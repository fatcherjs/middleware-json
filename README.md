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
<script src="https://cdn.jsdelivr.net/npm/@fatcherjs/middleware-json/dist/index.min.js"></script>
```

## Usage

```ts
import { fatcher } from 'fatcher';
import { json } from '@fatcherjs/middleware-json';

const res = await fatcher('https://foo.bar/get', {
  middlewares: [json],
});

const streamingJson = await res.readStreamAsJson((string: string, buffer: Uint8Array) => {
  console.log(string, buffer); // chunks for streaming string
}); // full result
```

## License

[MIT](https://github.com/fatcherjs/middleware-json/blob/master/LICENSE)
