export = function parseResponse(body: any): string {
    // Special case for primitives
    if (typeof body === "undefined" || body === null)
        return "";

    if (typeof body !== "object")
        return String(body);

    // Start parsing
    let parsed: string = "";
    if (!Array.isArray(body) && typeof body.toString === "function") {
        parsed = body.toString();
        if (parsed.startsWith("[object ") && parsed.endsWith("]"))
            parsed = JSON.stringify(body);
    } else  
        parsed = JSON.stringify(body);

    return parsed;
}