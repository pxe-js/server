import http from "http";
import { Context, RequestMethod } from "../declare";
import { getBody, getQuery } from "./bodyParser";

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
        },
        response: {
            raw: res,
            body: null,
            status: {
                code: null,
                message: null,
            },
            headers: {},
            type: null,
            redirect(url, permanent = false) {
                c.response.status.code = permanent ? 308 : 307;
                c.response.headers['Location'] = url;
            }
        }
    }
    return c;
}