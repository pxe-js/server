import parseResponse from "./parseResponse";
import { Context } from "./declare";

export = function finishResponse(ctx: Context) {
    const res = ctx.response.raw;

    // Send the response
    for (const key in ctx.response.headers)
        res.setHeader(key, ctx.response.headers[key]);

    // Check properties
    if (ctx.response.type)
        res.setHeader('Content-Type', ctx.response.type);

    if (ctx.response.status.code)
        res.statusCode = ctx.response.status.code;

    if (ctx.response.status.message)
        res.statusMessage = ctx.response.status.message;

    if (ctx.cookie) 
        res.setHeader('Set-Cookie', `props=${ctx.cookie}`);

    // If nothing is set, return a 404
    if (typeof ctx.response.body === "undefined" && !ctx.response.type && !ctx.response.status.code && !ctx.response.status.message) {
        res.statusCode = 404;
        res.end("Cannot " + ctx.request.method + " " + ctx.request.url);
        return;
    }

    /**
     * If the body is primitive, we can just send it
     * If not:
     * If the body has a toString method and does not convert to something like "[object Object]", we can send it
     * Else parse it using JSON.stringify
     */
    res.end(parseResponse(ctx.response.body));
}