// Source
const Server = require("../..");
const regx = /^\/user\/(?<id>[0-9]+)/i;

const app = new Server();

app.on("finish", ctx => {
    const res = ctx.response;
    return res.raw.end(res.body || "");
});

app.use(async ctx => {
    const url = ctx.request.url;
    const method = ctx.request.method;
    
    if ((method === "POST" && url === "/user") || (method === "GET" && url === "/"))
        return;
     
    const id = regx.exec(url);
    if (id) 
        return ctx.response.body = id.groups.id;
    
    ctx.response.raw.statusCode = 404;
});

app.ls(3000);