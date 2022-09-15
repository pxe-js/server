import createContext from "./createContext";
import http from "http";
import finishResponse from "./finishResponse";
import { readFile } from "fs/promises";

const events = Symbol("events");

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
        readonly body?: Promise<any>;
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
    }

    export interface Middleware {
        (ctx: Context, next: NextFunction, ...args: any[]): Promise<void>;
    }

    export interface Context extends Extensible {
        readonly request: IncomingRequest;
        readonly response: ServerResponse;
        readonly app: Server;
    }

    export interface NextFunction {
        (...args: any[]): Promise<void>;
    }

    export namespace Events {
        export interface Finish {
            (ctx: Server.Context): Promise<void> | void;
        }

        export interface Error {
            (err: any, ctx: Server.Context): Promise<void> | void;
        }

        export interface Handler<T extends any[] = any[]> {
            (...args: T): void | Promise<void>
        }
    }
}

interface Server {
    (req: http.IncomingMessage, res: http.ServerResponse): Promise<void>;
};

class Server extends Function {
    private readonly middlewares: Server.Middleware[];
    private ico: Buffer | string;
    private readonly props: {
        [key: string | number | symbol]: any,
    };
    private readonly [events]: {
        finish: Server.Events.Finish,
        error: Server.Events.Error,
        [key: string]: Server.Events.Handler;
    }
    constructor() {
        super();
        this.middlewares = [];
        this.props = {};
        this[events] = {
            finish: finishResponse,
            error: err => {
                throw err;
            }
        };
        this.ico = "";

        return new Proxy(this, {
            apply(target, _, args) {
                return target.callback(...args as Parameters<Server>);
            }
        });
    }

    use(...m: Server.Middleware[]) {
        this.middlewares.push(...m);
    }

    set<T>(key: string | number | symbol, value: T) {
        this.props[key] = value;
        return value;
    }

    get(key: string | number | symbol) {
        return this.props[key];
    }

    // Set an event handler
    on(event: "error", handler: Server.Events.Error): void;
    on(event: "finish", handler: Server.Events.Finish): void;
    on(event: string, handler: Server.Events.Handler): void;
    on(event: string, handler: Server.Events.Handler) {
        this[events][event] = handler;
    }

    // Run an event handler
    emit(event: "error", ...args: Parameters<Server.Events.Error>): Promise<void> | void | boolean;
    emit(event: "finish", ...args: Parameters<Server.Events.Finish>): Promise<void> | void | boolean;
    emit(event: string, ...args: Parameters<Server.Events.Handler>): Promise<void> | void | boolean;
    emit(event: string, ...args: any[]): Promise<void> | void | boolean {
        return this.event(event)(...args);
    }

    // Get the event handler
    event(event: "error"): Server.Events.Error;
    event(event: "finish"): Server.Events.Finish;
    event(event: string): Server.Events.Handler;
    event(event: string) {
        return this[events][event];
    }

    async icon(path: string) {
        this.ico = await readFile(path);
    }

    private async runMiddleware(ctx: Server.Context, i: number, ...a: any[]) {
        if (i < this.middlewares.length)
            return this.middlewares[i](
                ctx,
                async (...args: any[]) => this.runMiddleware(ctx, i + 1, ...args),
                ...a
            );
    }

    async callback(...[req, res]: Parameters<Server>) {
        // End with the provided icon if request url is /favicon.ico
        if (req.url === '/favicon.ico')
            return res.end(this.ico);

        const ctx = createContext(req, res, this) as Server.Context;
        try {
            await this.runMiddleware(ctx, 0);
        } catch (err) {
            await this.emit("error", err, ctx);
        }
        // Trigger finish event
        return this.emit("finish", ctx);
    }

    ls(port?: number, hostname?: string, backlog?: number, listeningListener?: () => void): http.Server;
    ls(port?: number, hostname?: string, listeningListener?: () => void): http.Server;
    ls(port?: number, backlog?: number, listeningListener?: () => void): http.Server;
    ls(port?: number, listeningListener?: () => void): http.Server;
    ls(...args: any[]) {
        const callback = this.callback.bind(this);

        return http.createServer((...a) =>
            setImmediate(callback, ...a)
        ).listen(...args);
    }
}

export = Server;