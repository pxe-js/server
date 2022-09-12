import http from "http";
import { getBody, getQuery } from "./bodyParser";

function parseUrl(url: string) {
    // For parsing URL
    const endUrlIndex = url.indexOf('?');
    const pathname = url.slice(0, endUrlIndex === -1 ? url.length : endUrlIndex);

    return pathname.endsWith("/") && pathname !== "/"
        ? pathname.substring(0, pathname.length - 1)
        : pathname;
}

export = function createContext(req: http.IncomingMessage, res: http.ServerResponse, app: any) {
    const c = {
        request: {
            method: req.method,
            raw: req,
            get url() {
                return parseUrl(req.url);
            },
            headers: req.headers,
            get body() {
                return getBody(req);
            },
            get query() {
                return getQuery(req.url);
            }
        },
        response: {
            raw: res,
            status: {},
            headers: {}
        },
        app,
    };
    return c;
}