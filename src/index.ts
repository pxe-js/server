import createContext from "./createContext";
import http from "http";
import finishResponse from "./finishResponse";
import { readFileSync } from "fs";

declare namespace Server {
    export type Extensible = Record<string | number | symbol, any>;

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
        readonly body: Promise<any>;
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

    export interface Middleware {
        (ctx: Context, next: NextFunction, ...args: any[]): Promise<void>;
    }

    export interface Context extends Extensible {
        readonly request: IncomingRequest;
        readonly response: ServerResponse;
        readonly cookie?: Cookie;
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

interface Server {
    (req: http.IncomingMessage, res: http.ServerResponse): Promise<void>;
};

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
        this.events = { finish: finishResponse };
        this.ico = Buffer.from("");

        return new Proxy(this, {
            apply(target, _, args) {
                // @ts-ignore
                return target.cb()(...args);
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
    on(event: "finish", handler: (ctx: Server.Context) => Promise<void> | void): void;
    on(event: string, handler: (...args: any[]) => void | Promise<void>) {
        this.events[event] = handler;
    }

    emit(event: "error", err: any, ctx: Server.Context): Promise<void> | void | boolean;
    emit(event: "finish", ctx: Server.Context): Promise<void> | void | boolean;
    emit(event: string, ...args: any[]): Promise<void> | void | boolean {
        const evListener = this.events[event];

        if (!evListener)
            return false;

        return evListener(...args);
    }

    icon(path: string) {
        this.ico = readFileSync(path);
    }

    async runMiddleware(ctx: Server.Context, i: number, ...a: any[]) {
        if (i < this.middlewares.length)
            return this.middlewares[i](
                ctx,
                async (...args: any[]) => this.runMiddleware(ctx, i + 1, ...args),
                ...a
            );
    }

    cb() {
        return async (req: http.IncomingMessage, res: http.ServerResponse) => {
            // End with the provided icon if request url is /favicon.ico
            if (req.url === '/favicon.ico')
                return res.end(this.ico);

            const ctx = createContext(req, res, this) as Server.Context;
            try {
                await this.runMiddleware(ctx, 0);
            } catch (err) {
                const errHandlerRes = this.emit("error", err, ctx);
                if (errHandlerRes === false)
                    throw err;
            }
            // Trigger finish event
            return this.emit("finish", ctx);
        }
    }

    ls(port?: number, hostname?: string, backlog?: number, listeningListener?: () => void): http.Server;
    ls(port?: number, hostname?: string, listeningListener?: () => void): http.Server;
    ls(port?: number, backlog?: number, listeningListener?: () => void): http.Server;
    ls(port?: number, listeningListener?: () => void): http.Server;
    ls(...args: any[]) {
        const cb = this.cb();

        return http.createServer((...args) =>
            setImmediate(cb, ...args)
        ).listen(...args);
    }
}

export = Server;