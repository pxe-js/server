import createContext from "./createContext";
import http from "http";
import finishResponse from "./finishResponse";
import { readFileSync } from "fs";
import Server from "./declare";

interface Server {
    (req: http.IncomingMessage, res: http.ServerResponse): Promise<void>;
}

class Server extends Function {
    private readonly middlewares: Server.Middleware[];
    private ico: string;
    private readonly props: Record<string, any>;
    private readonly events: {
        [ev: string]: (...args: any[]) => void | Promise<void>
    }

    constructor() {
        super();
        this.middlewares = [];
        this.props = {};
        this.events = {};

        return new Proxy(this, {
            apply(target, _, args) {
                // @ts-ignore
                return target.cb(...args);
            }
        });
    }

    use(...m: Server.Middleware[]) {
        this.middlewares.push(...m);
    }

    set<T>(key: string, value: T) {
        this.props[key] = value;
        return value;
    }

    get(key: string) {
        return this.props[key];
    }

    on(event: "error", handler: (err: any, ctx: Server.Context) => Promise<void> | void): void;
    on(event: "beforeFinish", handler: (ctx: Server.Context) => Promise<void> | void): void;
    on(event: string, handler: (...args: any[]) => void | Promise<void>) {
        this.events[event] = handler;
    }

    emit(event: "error", err: any, ctx: Server.Context): Promise<void> | void | boolean;
    emit(event: "beforeFinish", ctx: Server.Context): Promise<void> | void | boolean;
    emit(event: string, ...args: any[]): Promise<void> | void | boolean {
        const evListener = this.events[event];

        if (evListener)
            return evListener(...args);

        return false;
    }

    icon(path: string) {
        this.ico = readFileSync(path).toString();
    }

    async cb(req: http.IncomingMessage, res: http.ServerResponse) {
        // Ignore favicon
        if (req.url === '/favicon.ico') {
            res.end(this.ico ?? "");
            return;
        }

        const ctx = await createContext(req, res, this);

        try {
            // Run middlewares
            const runMiddleware = async (i: number, ...a: any[]) => {
                // Run the next middleware
                if (i < this.middlewares.length)
                    return this.middlewares[i](
                        ctx,
                        async (...args: any[]) => runMiddleware(i + 1, ...args),
                        ...a
                    );
            }

            await runMiddleware(0);
        } catch (err) {
            const res = this.emit("error", err, ctx);
            if (res === false)
                throw err;
        }

        // Trigger beforeFinish event
        await this.emit("beforeFinish", ctx);

        // Finish the response
        const doFinish = ctx.options.finishResponse;

        if (doFinish === true)
            finishResponse(ctx);
        else if (typeof doFinish !== "function")
            return;
        else
            await doFinish(ctx);
    }

    ls(port?: number, hostname?: string, backlog?: number, listeningListener?: () => void): http.Server;
    ls(port?: number, hostname?: string, listeningListener?: () => void): http.Server;
    ls(port?: number, backlog?: number, listeningListener?: () => void): http.Server;
    ls(port?: number, listeningListener?: () => void): http.Server;
    ls(...args: any[]) {
        return http.createServer(this).listen(...args);
    }
}

export = Server;