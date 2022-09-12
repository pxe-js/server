function parseResponse(body: any): string | Buffer {
    if (typeof body === "string" || Buffer.isBuffer(body))
        return body;

    // Special case for primitives 
    if (typeof body !== "object")
        return String(body);

    if (Array.isArray(body))
        return JSON.stringify(body);

    // Parsing an object
    let parsed = body.toString();
    if (parsed.startsWith("[object ") && parsed.endsWith("]"))
        parsed = JSON.stringify(body);

    return parsed;
}

export = function finishResponse(ctx: any) {
    const resp = ctx.response;
    const requ = ctx.request;

    const res = resp.raw;

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
    /**
     * If the body is primitive, we can just send it
     * If not:
     * If the body has a toString method and does not convert to something like "[object Object]", we can send it
     * Else parse it using JSON.stringify
     */
    res.end(parseResponse(resp.body));
}