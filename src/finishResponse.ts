import cookie from "cookie";

function parseResponse(body: any): string {
    // Special case for primitives
    if (body === undefined || body === null)
        return "";

    if (typeof body !== "object")
        return String(body);

    // Start parsing
    let parsed: string = "";
    if (!Array.isArray(body)) {
        parsed = body.toString();
        if (parsed.startsWith("[object ") && parsed.endsWith("]"))
            parsed = JSON.stringify(body);
    } else  
        parsed = JSON.stringify(body);

    return parsed;
}

export = function finishResponse(ctx: any) {
    const res = ctx.response.raw;
    const req = ctx.request.raw;

    // If nothing is set, return a 404
    if (typeof ctx.response.body === "undefined" && !ctx.response.type && !ctx.response.status.code && !ctx.response.status.message) {
        res.statusCode = 404;
        res.end("Cannot " + ctx.request.method + " " + ctx.request.url);
        return;
    }

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

    if (ctx.options.useDefaultCookie && (ctx.cookie.value || ctx.cookie.removed)) {
        // Check whether the cookie is removed or the protocol is not correct
        // @ts-ignore
        const doRemoveCookie = ctx.cookie.removed || (ctx.cookie.options.secure && !req.socket.encrypted);

        // Set cookie
        res.setHeader('Set-Cookie', doRemoveCookie
            ? "connect.sid=; max-age=0"
            : cookie.serialize(
                "connect.sid",
                ctx.cookie.value,
                ctx.cookie.options
            ));
    }
    /**
     * If the body is primitive, we can just send it
     * If not:
     * If the body has a toString method and does not convert to something like "[object Object]", we can send it
     * Else parse it using JSON.stringify
     */
    res.end(parseResponse(ctx.response.body));
}