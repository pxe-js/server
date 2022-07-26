import http from "http";
import { getBody as getBodyFromRequest, getQuery } from "./bodyParser";
import cookie from "cookie";
import { decrypt, encrypt, iv, secretKey } from "./crypt";

export = async function createContext(req: http.IncomingMessage, res: http.ServerResponse, app: any): Promise<any> {
    // For parsing URL
    const endUrlIndex = req.url.indexOf('?');
    const pathname = req.url.slice(0, endUrlIndex === -1 ? req.url.length : endUrlIndex);

    // The cookie current value
    const cookieVal = req.headers.cookie;

    const c = {
        request: {
            method: req.method,
            raw: req,
            url: (pathname.endsWith("/") && pathname !== "/"
                ? pathname.substring(0, pathname.length - 1)
                : pathname),
            headers: req.headers,
            async getBody() {
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
        cookie: {
            value: cookieVal ? cookie.parse(cookieVal, {
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
        },
        options: {
            finishResponse: true,
            useDefaultCookie: false,
        },
        app,
    }
    return c;
}