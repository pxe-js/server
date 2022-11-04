import http from "http";
import { getBody, getQuery, parseUrl } from "./parsers";

export = function createContext(req: http.IncomingMessage, res: http.ServerResponse, app: any) {
    return {
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
}