# PXE.js Server
[![install size](https://packagephobia.com/badge?p=%40pxe%2Fserver)](https://packagephobia.com/result?p=%40pxe%2Fserver)
[![Gitter](https://badges.gitter.im/pxe-js/community.svg)](https://gitter.im/pxe-js/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

The server module of PXE.js.

## Installation
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
