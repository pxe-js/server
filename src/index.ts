import createContext from "./createContext";
import http from "http";
import finishResponse from "./finishResponse";
import { readFileSync } from "fs";

type Extensible = Record<string | number | symbol, any>;

declare namespace Server {
    export type RequestMethod = "GET" | "POST" | "PUT" | "DELETE" | "HEAD"
        | "OPTIONS" | "PATCH" | "CONNECT" | "TRACE";

    export type MIMEType = "audio/aac" | "application/x-abiword" | "application/x-freearc"
        | "image/avif" | "video/x-msvideo" | "application/vnd.amazon.ebook" | "application/octet-stream"
        | "image/bmp" | "application/x-bzip" | "application/x-bzip2" | "application/x-csh" | "application/x-cdf"
        | "text/css" | "text/csv" | "application/msword" | "application/vnd.ms-fontobject" | "application/gzip"
        | "application/vnd.openxmlformats-officedocument.wordprocessingml.document" | "application/epub+zip"
        | "image/gif" | "text/html" | "image/vnd.microsoft.icon" | "text/calendar" | "application/java-archive"
        | "image/jpeg" | "text/javascript" | "application/json" | "application/ld+json" | "audio/midi" | "audio/x-midi"
        | "audio/mpeg" | "video/mp4" | "application/vnd.apple.installer+xml" | "application/vnd.oasis.opendocument.presentation"
        | "application/vnd.oasis.opendocument.spreadsheet" | "application/vnd.oasis.opendocument.text" | "audio/ogg"
        | "video/ogg" | "application/ogg" | "audio/opus" | "font/otf" | "image/png" | "application/pdf" | "image/svg+xml"
        | "application/x-httpd-php" | "application/vnd.ms-powerpoint" | "application/vnd.rar" | "application/rtf"
        | "application/vnd.openxmlformats-officedocument.presentationml.presentation" | "application/x-sh"
        | "application/x-shockwave-flash" | "application/x-tar" | "image/tiff" | "font/ttf" | "video/mp2t" | "text/plain"
        | "application/vnd.visio" | "audio/wav" | "audio/webm" | "image/webp" | "font/woff" | "font/woff2" | "application/xhtml+xml"
        | "application/vnd.ms-excel" | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" | "application/xml"
        | "text/xml" | "application/atom+xml" | "application/vnd.mozilla.xul+xml" | "application/zip" | "video/3gpp"
        | "audio/3gpp" | "video/3gpp2" | "audio/3gpp2" | "application/x-7z-compressed" | "application/x-www-form-urlencoded";

    export interface IncomingRequest extends Extensible {
        readonly raw: http.IncomingMessage;
        readonly method: RequestMethod;
        readonly url: string;
        readonly headers: http.IncomingHttpHeaders;
        getBody(): Promise<any>;
        readonly query?: Record<string, string>;
    }

    export interface ServerResponse extends Extensible {
        readonly raw: http.ServerResponse;
        body?: any;
        type?: MIMEType;
        readonly status: {
            code?: number;
            message?: string;
        }
        readonly headers: Record<string, string | readonly string[] | number>;
        redirect(url: string, permanent?: boolean): void;
    }

    export interface Cookie extends Extensible {
        options?: CookieOptions;
        value?: string;
        remove(): void;
        readonly removed: boolean;
        readonly iv: Buffer,
        readonly key: string,
    }

    export interface RequestOptions extends Extensible {
        finishResponse: boolean | ((ctx: Context) => Promise<void> | void);
        useDefaultCookie: boolean;
    }

    export interface Middleware {
        (ctx: Context, next: NextFunction, ...args: any[]): Promise<void>;
    }

    export interface Context extends Extensible {
        readonly request: IncomingRequest;
        readonly response: ServerResponse;
        readonly cookie: Cookie;
        readonly options: RequestOptions;
        readonly app: Server;
    }

    export interface NextFunction {
        (...args: any[]): Promise<void>;
    }

    export interface CookieOptions {
        domain?: string | undefined;
        expires?: Date | undefined;
        httpOnly?: boolean | undefined;
        maxAge?: number | undefined;
        path?: string | undefined;
        priority?: 'low' | 'medium' | 'high' | undefined;
        sameSite?: true | false | 'lax' | 'strict' | 'none' | undefined;
        secure?: boolean | undefined;
    }
}

interface Server extends http.RequestListener { };

class Server extends Function {
    private readonly middlewares: Server.Middleware[];
    private ico: Buffer;
    private readonly props: Record<string, any>;
    private readonly events: {
        [ev: string]: (...args: any[]) => void | Promise<void>
    }

    constructor() {
        super();
        this.middlewares = [];
        this.props = {};
        this.events = {};
        this.ico = Buffer.from("");

        return new Proxy(this, {
            apply(target, _, args) {
                const cb = target.cb();
                const [req, res] = args;
                setImmediate(cb, req, res);
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

        if (!evListener)
            return false;

        return evListener(...args);
    }

    icon(path: string) {
        this.ico = readFileSync(path);
    }

    cb() {
        return async (req: http.IncomingMessage, res: http.ServerResponse) => {
            // Ignore favicon
            if (req.url === '/favicon.ico') {
                res.end(this.ico);
                return;
            }

            const ctx = createContext(req, res, this) as Server.Context;

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
                const errHandlerRes = this.emit("error", err, ctx);
                if (errHandlerRes === false)
                    throw err;
            }

            // Trigger beforeFinish event
            await this.emit("beforeFinish", ctx);

            // Finish the response
            const doFinish = ctx.options.finishResponse;

            if (!doFinish)
                return;
            if (typeof doFinish === "function")
                return doFinish(ctx);

            finishResponse(ctx);
        }
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