import cookie from "cookie";

function parseResponse(body: any): string | Buffer {
    // Special case for primitives
    if (typeof body !== "object" || Buffer.isBuffer(body))
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
    const resp = ctx.response;
    const requ = ctx.request;

    const res = resp.raw;
    const req = requ.raw;

    // If nothing is set, return a 404
    if (typeof resp.body === "undefined" && !resp.type && !resp.status.code && !resp.status.message) {
        res.statusCode = 404;
        res.end("Cannot " + requ.method + " " + requ.url);
        return;
    }

    // Send the response
    for (const key in resp.headers)
        res.setHeader(key, resp.headers[key]);

    // Check properties
    if (resp.type)
        res.setHeader('Content-Type', resp.type);

    if (resp.status.code)
        res.statusCode = resp.status.code;

    if (resp.status.message)
        res.statusMessage = resp.status.message;

    if (ctx.options.useDefaultCookie && ctx.cookie && (ctx.cookie.value || ctx.cookie.removed)) {
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
    res.end(parseResponse(resp.body));
}