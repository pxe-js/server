import createContext from "./createContext";
import http from "http";
import finishResponse from "./finishResponse";
import * as types from "./declare";

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
     * The error handler
     */
    export interface ErrorHandler extends types.ErrorHandler { }

    export interface MiddlewareConstructor {
        new(): Middleware;
    }
}

interface Server {
    (req: http.IncomingMessage, res: http.ServerResponse): Promise<void>;
}

class Server extends Function {
    private readonly middlewares: Server.Middleware[];
    private errorHandler: Server.ErrorHandler;
    private readonly props: {
        [key: string]: any;
        port?: number | string;
        hostname?: string;
    }

    /**
     * Create the server
     */
    constructor() {
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
    use(...m: (Server.Middleware | Server.MiddlewareConstructor)[]) {
        for (const Md of m) {
            // If middleware is a class, create an instance
            if (Md.toString().startsWith("class")) {
                this.middlewares.push(
                    new (Md as Server.MiddlewareConstructor)()
                );
                continue;
            }

            // If middleware is a function, just add it
            this.middlewares.push(Md as Server.Middleware);
        }
    }

    /**
     * Set the target port
     * @param key 
     * @param value 
     */
    set(key: "port", value: number | string): void;

    /**
     * Set the target hostname
     * @param key 
     * @param value 
     */
    set(key: "hostname", value: string): void;

    /**
     * Set a property
     * @param key 
     * @param value 
     */
    set(key: string, value: any): void;

    // Set a property
    set(key: string, value: any) {
        this.props[key] = value;
    }

    /**
     * Get the target port
     */
    get(key: "port"): number | string;

    /**
     * Get the target hostname
     */
    get(key: "hostname"): string;

    /**
     * Get a property
     * @param key 
     */
    get(key: string): any;

    // Get props
    get(key: string) {
        return this.props[key];
    }

    /**
     * Set an error handler
     * @param handler 
     */
    onError(handler: Server.ErrorHandler) {
        this.errorHandler = handler;
    }

    /**
     * Server callback
     * @param req the request
     * @param res the response
     */
    async cb(req: http.IncomingMessage, res: http.ServerResponse) {
        try {
            const ctx = await createContext(req, res);
            ctx.app = this;

            // Run middlewares
            const runMiddleware = async (i: number, ...a: any[]) => {
                const currentMiddleware = this.middlewares[i];

                // Run the next middleware
                if (i < this.middlewares.length && typeof currentMiddleware === "function") {
                    const next = async (...args: any[]) => runMiddleware(i + 1, ...args);
                    // @ts-ignore
                    return currentMiddleware(ctx, next, ...a);
                }

                if (i === this.middlewares.length)
                    finishResponse(ctx);
            }

            await runMiddleware(0);
        } catch (err) {
            // Handle error
            if (this.errorHandler)
                await this.errorHandler(err, req, res);
            else
                throw err;
        }
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