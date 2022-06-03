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
async function tryParseForm(req: http.IncomingMessage) {
    const form = formidable({
        keepExtensions: true
    });
    return new Promise((res, rej) =>
        form.parse(req, (err, fields, files) => {
            if (err)
                return rej(err);
            res({ fields, files });
        })
    );
}

// Try parse to URLSearchParams
function tryParseQuery(body: string): { [key: string]: string } {
    const params =  new URLSearchParams(body);
    const keys = Array.from(params.keys());
    const values = Array.from(params.values());

    return keys.map((key, i) => ({ [key]: values[i] }))
        .reduce((a, b) => ({ ...a, ...b }));
}

// Get the body of a request
export const getBody = async (req: http.IncomingMessage): Promise<any> => {
    // Special case for form
    if (req.headers['content-type']?.startsWith('multipart/form-data'))
        return tryParseForm(req);

    // JSON and query body
    return new Promise((res, rej) => {
        let body = '';
        req.on('data', data => {
            body += data;
            if (body.length > 1e7) {
                req.socket.destroy();
                rej("Request data to long");
            }
        });
        req.on('end', () => {
            // If body is empty
            if (!body) 
                return res(null);

            let parsed: any = body;

            // Check content type
            if (req.headers['content-type']) {
                // Parse by content type
                if (req.headers['content-type'].startsWith('application/json'))
                    parsed = tryParseJSON(body);
                else if (req.headers['content-type'].startsWith('application/x-www-form-urlencoded'))
                    parsed = tryParseQuery(body);
            }
            res(parsed);
        });
    });
}

// Get query of an URL
export const getQuery = (url: string): { [key: string]: string } => {
    const beginQueryIndex = url.indexOf('?');

    if (beginQueryIndex === -1)
        return null;

    return tryParseQuery(url.substring(beginQueryIndex));
};