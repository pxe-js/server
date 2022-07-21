import createContext from "./createContext";
import http from "http";
import finishResponse from "./finishResponse";
import * as types from "./declare";
import { readFileSync } from "fs";
import EventEmitter from "events";

declare namespace Server {
    /**
     * Request methods
     */
    export type RequestMethod = types.RequestMethod;

    /**
     * Common MIME types
     */
    export type MIMEType = types.MIMEType;

    /**
     * The Incoming request
     */
    export interface IncomingRequest extends types.IncomingRequest { }

    /**
     * Server response
     */
    export interface ServerResponse extends types.ServerResponse { }

    /**
     * A middleware
     */
    export interface Middleware {
        (ctx: Context, next: NextFunction, ...args: any[]): Promise<void>;
    }

    /**
     * A context of the request and response
     */
    export interface Context extends types.Context {
        /**
         * The current server
         */
        readonly app: Server;
    }

    /**
     * Next function
     */
    export interface NextFunction extends types.NextFunction { }

    /**
     * All cookie options
     */
    export interface CookieOptions extends types.CookieOptions { }
}

interface Server {
    (req: http.IncomingMessage, res: http.ServerResponse): Promise<void>;
}

class Server extends Function {
    private readonly middlewares: Server.Middleware[];
    private ico: string;
    private readonly props: Record<string, any>;
    

    /**
     * Create the server
     */
    constructor(public readonly events: { [ev: string]: (...args: any[]) => void | Promise<void> } = {}) {
        super();
        this.middlewares = [];
        this.props = {};

        // Make this callable
        return new Proxy(this, {
            apply(target, _, args) {
                // @ts-ignore
                return target.cb(...args);
            }
        });
    }

    /**
     * Add a middleware to the middleware stack
     * @param m the middleware
     */
    use(...m: Server.Middleware[]) {
        this.middlewares.push(...m);
    }

    /**
     * Set a property
     * @param key 
     * @param value 
     */
    set<T>(key: string, value: T) {
        this.props[key] = value;
        return value;
    }

    // Get props
    get(key: string) {
        return this.props[key];
    }

    /**
     * Set error handler
     * @param event 
     * @param handler 
     */
    on(event: "error", handler: (err: any, ctx: Server.Context) => Promise<void>): void;

    /**
     * Set a listener for a specific event
     * @param event
     * @param handler 
     */
    on(event: string, handler: (...args: any[]) => void) {
        this.events[event] = handler;
    }

    /**
     * Register an icon
     * @param path 
     */
    icon(path: string) {
        this.ico = readFileSync(path).toString();
    }

    /**
     * Server callback
     * @param req the request
     * @param res the response
     */
    async cb(req: http.IncomingMessage, res: http.ServerResponse) {
        // Ignore favicon
        if (req.url === '/favicon.ico') {
            res.end(this.ico ?? "");
            return;
        }

        const ctx = await createContext(req, res);

        ctx.app = this;

        try {
            // Run middlewares
            const runMiddleware = async (i: number, ...a: any[]) => {
                // Run the next middleware
                if (i < this.middlewares.length)
                    return this.middlewares[i](
                        // @ts-ignore
                        ctx,
                        async (...args: any[]) => runMiddleware(i + 1, ...args),
                        ...a
                    );
            }

            await runMiddleware(0);
        } catch (err) {
            const errorListener = this.events["error"];

            // Handle error
            if (typeof errorListener === "function")
                await errorListener(err, ctx);
            else
                throw err;
        }

        const doFinish = ctx.options.finishResponse;

        if (doFinish === true)
            finishResponse(ctx);
        else if (typeof doFinish !== "function")
            return;
        else 
            await doFinish(ctx);
    }

    /**
     * Start a server listening for connections.
     * 
     * An alias for 
     * 
     * ```js
     * http.createServer(this).listen(port, hostname, backlog, listeningListener);
     * ```
     */
    ls(port?: number | string, hostname?: string, backlog?: number, listeningListener?: () => void) {
        const server = http.createServer(this);
        server.listen(
            Number(this.props.port ?? port),
            this.props.hostname ?? hostname,
            backlog,
            listeningListener
        );
    }
}

export = Server;