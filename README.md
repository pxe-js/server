# PXE.js Server
[![install size](https://packagephobia.com/badge?p=@pxe/server)](https://packagephobia.com/result?p=next)
The server module of PXE.js.

## Installation
```bash
# NPM
npm i @pxe/server

# Yarn
yarn add @pxe/server
```

# Usage
```ts
import Server from "@pxe/server";

const app = new Server();

app.use(async (ctx, next) => {
    ctx.response.body = "Hello, world!";
    await next();
});

app.set("port", 3000);
app.ls();
```