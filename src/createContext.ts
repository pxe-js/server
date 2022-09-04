import http from "http";
import { getBody as getBodyFromRequest, getQuery } from "./bodyParser";
import cookie from "cookie";
import { decrypt, encrypt, iv, secretKey } from "./crypt";

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
                return getBodyFromRequest(req);
            },
            get query() {
                return getQuery(req.url);
            }
        },
        response: {
            raw: res,
            status: {},
            headers: {},
            redirect(url: string, permanent = false) {
                // @ts-ignore
                c.response.status.code = permanent ? 308 : 307;
                c.response.headers['Location'] = url;
            },
        },
        cookie: app.get("use cookie") ? {
            value: req.headers.cookie ? cookie.parse(req.headers.cookie, {
                decode: decrypt
            })["connect.sid"] : "",
            options: {
                encode: encrypt
            },
            removed: false,
            iv: iv,
            key: secretKey,
            remove() {
                // @ts-ignore
                c.cookie.removed = true;
                Object.defineProperty(c.cookie, "value", {
                    get() {
                        return undefined;
                    },
                    enumerable: false
                });

                Object.defineProperty(c.cookie, "options", {
                    get() {
                        return {};
                    },
                    enumerable: false
                });
            },
        } : null,
        app,
    };
    return c;
}