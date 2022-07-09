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
    export interface ErrorHandler {
        (err: Error, ctx: Context): Promise<void>;
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
    use(...m: Server.Middleware[]) {
        this.middlewares.push(...m);
    }

    /**
     * Set the target port
     * @param key 
     * @param value 
     */
    set(key: "port", value: string): string;

    /**
     * Set the target port
     * @param key 
     * @param value 
     */
    set(key: "port", value: number): number;

    /**
     * Set the target hostname
     * @param key 
     * @param value 
     */
    set(key: "hostname", value: string): string;

    /**
     * Set a property
     * @param key 
     * @param value 
     */
    set<T>(key: string, value: T): T;

    // Set a property
    set(key: string, value: any) {
        this.props[key] = value;
        return value;
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
        if (req.url === '/favicon.ico')
            return;

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
            // Handle error
            if (this.errorHandler)
                // @ts-ignore
                await this.errorHandler(err, ctx);
            else
                throw err;
        }

        finishResponse(ctx);
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