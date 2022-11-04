import http from "http";
import formidable from "formidable";

// Try parse to JSON
function tryParseJSON(body: string): object {
    try {
        return JSON.parse(body);
    } catch (e) {
        return;
    }
}

// Try parse form
async function parseForm(req: http.IncomingMessage) {
    const form = formidable({
        keepExtensions: true
    });
    return new Promise(res =>
        form.parse(req, (err, fields, files) => {
            if (err)
                return res(null);
            res({ fields, files });
        })
    );
}

// Try parse to URLSearchParams
function tryParseQuery(body: string): { [key: string]: string } {
    try {
        return JSON.parse('{"' + decodeURIComponent(body).replaceAll(/"/g, '\\"').replaceAll(/&/g, '","').replaceAll(/=/g,'":"') + '"}');
    } catch (e) {
        return null;
    }
}

// Get the body of a request
export const getBody = async (req: http.IncomingMessage): Promise<any> => {
    // Special case for form
    if (req.headers['content-type']?.startsWith('multipart/form-data'))
        return parseForm(req);

    // JSON and query body
    const buffers = [];

    for await (const chunk of req)
        buffers.push(chunk);

    const body = Buffer.concat(buffers).toString();
    
    // If body is empty
    if (!body)
        return null;

    // Check content type
    if (req.headers['content-type']) {
        // Parse by content type
        if (req.headers['content-type'].startsWith('application/json'))
            return tryParseJSON(body);
        else if (req.headers['content-type'].startsWith('application/x-www-form-urlencoded'))
            return tryParseQuery(body);
    } 

    return body;
}

// Get query of an URL
export const getQuery = (url: string): { [key: string]: string } => {
    const beginQueryIndex = url.indexOf('?');

    if (beginQueryIndex === -1)
        return null;

    return tryParseQuery(url.substring(beginQueryIndex + 1));
};

export function parseUrl(url: string) {
    // For parsing URL
    const endUrlIndex = url.indexOf('?');
    const pathname = url.slice(0, endUrlIndex === -1 ? url.length : endUrlIndex);

    return pathname.endsWith("/") && pathname !== "/"
        ? pathname.substring(0, pathname.length - 1)
        : pathname;
}