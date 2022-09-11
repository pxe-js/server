# PXE.js Server
[![install size](https://packagephobia.com/badge?p=%40pxe%2Fserver)](https://packagephobia.com/result?p=%40pxe%2Fserver)
[![Gitter](https://badges.gitter.im/pxe-js/community.svg)](https://gitter.im/pxe-js/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

The server module of PXE.js.

## Installation
Install `@pxe/server`.

```bash
# NPM
npm i @pxe/server

# Yarn
yarn add @pxe/server
```

## Usage
A simple "Hello world" example:

```ts
import Server from "@pxe/server";

const app = new Server();

app.use(async ctx => {
    ctx.response.body = "Hello, world!";
});

app.ls(3000);
```

## Benchmarking
Install `autocannon` then run `node bench` in the root directory of this repo.
This will start a server then start benchmarking using `autocannon`.
Once benchmarking is done the process is terminated.

See our framework compares to other Node.js frameworks: https://web-frameworks-benchmark.netlify.app/result?l=javascript
