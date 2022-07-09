import http from "http";
import { Context, RequestMethod } from "./declare";
import { getBody, getQuery } from "./bodyParser";
import cookie from "cookie";

export = async function createContext(req: http.IncomingMessage, res: http.ServerResponse): Promise<Context> {
    const endUrlIndex = req.url.indexOf('?');
    const pathname = req.url.slice(0, endUrlIndex === -1 ? req.url.length : endUrlIndex);

    const c: Context = {
        request: {
            method: req.method as RequestMethod,
            raw: req,
            url: (pathname.endsWith("/") && pathname !== "/"
                ? pathname.substring(0, pathname.length - 1)
                : pathname),
            headers: req.headers,
            body: await getBody(req),
            query: getQuery(req.url)
        },
        response: {
            raw: res,
            status: {},
            headers: {},
            redirect(url, permanent = false) {
                c.response.status.code = permanent ? 308 : 307;
                c.response.headers['Location'] = url;
            },
        },
        cookie: {
            value: cookie.parse(req.headers.cookie ?? "")["connect.sid"],
            options: {},
        },
    }
    return c;
}