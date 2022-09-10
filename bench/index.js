const Server = require("@pxe/server");

const regx = /^\/user\/(?<id>[0-9]+)/i;

const app = new Server();

app.on("finish", ctx => {
    const res = ctx.response;

    return res.raw.end(res.body || "");
});

app.use(async ctx => {
    const url = ctx.request.url;
    const req = ctx.request;

    if ((req.method === "POST" && url === "/user") || (req.method === "GET" && url === "/"))
        return;
     
    const id = regx.exec(url);
    if (id) 
        return ctx.response.body = id.groups.id;
    
    ctx.response.raw.statusCode = 404;
});

app.ls(3000);

// ┌─────────┬───────┬───────┬───────┬───────┬──────────┬─────────┬────────┐
// │ Stat    │ 2.5%  │ 50%   │ 97.5% │ 99%   │ Avg      │ Stdev   │ Max    │
// ├─────────┼───────┼───────┼───────┼───────┼──────────┼─────────┼────────┤
// │ Latency │ 15 ms │ 24 ms │ 46 ms │ 56 ms │ 25.66 ms │ 9.27 ms │ 157 ms │
// └─────────┴───────┴───────┴───────┴───────┴──────────┴─────────┴────────┘
// ┌───────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
// │ Stat      │ 1%      │ 2.5%    │ 50%     │ 97.5%   │ Avg     │ Stdev   │ Min     │
// ├───────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
// │ Req/Sec   │ 19983   │ 19983   │ 24479   │ 28495   │ 24510.4 │ 2337.54 │ 19980   │
// ├───────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
// │ Bytes/Sec │ 2.44 MB │ 2.44 MB │ 2.99 MB │ 3.48 MB │ 2.99 MB │ 285 kB  │ 2.44 MB │
// └───────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘

// RAM: 8GB
// CPU: 4 Cores (Intel(R) Core(TM) i3-1005G1 CPU)