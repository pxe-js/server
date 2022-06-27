import http from "http";
import { Context, RequestMethod } from "./declare";
import { getBody, getQuery } from "./bodyParser";
import cookieParser from "cookie";

export = async function createContext(req: http.IncomingMessage, res: http.ServerResponse): Promise<Context> {
    const endUrlIndex = req.url.indexOf('?');

    const c: Context = {
        request: {
            method: req.method as RequestMethod,
            raw: req,
            url: req.url.slice(0, endUrlIndex === -1 ? req.url.length : endUrlIndex),
            headers: req.headers,
            body: await getBody(req),
            query: getQuery(req.url),
            cookie: req.headers.cookie ? 
                cookieParser.parse(req.headers.cookie)?.props ?? undefined
                : undefined,
        },
        response: {
            raw: res,
            status: {},
            headers: {},
            redirect(url, permanent = false) {
                c.response.status.code = permanent ? 308 : 307;
                c.response.headers['Location'] = url;
            }, 
            cookieOptions: {},
        }
    }
    return c;
}