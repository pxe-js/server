import http from "http";

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

    export interface IncomingRequest {
        readonly raw: http.IncomingMessage;
        readonly method: RequestMethod;
        readonly url: string;
        readonly headers: http.IncomingHttpHeaders;
        readonly body: any;
        readonly query: { [key: string]: string };
    }

    export interface ServerResponse {
        readonly raw: http.ServerResponse;
        body?: any;
        type?: MIMEType;
        readonly status: {
            code?: number;
            message?: string;
        }
        readonly headers: { [key: string]: string };
        redirect(url: string, permanent?: boolean): void;
    }

    export interface Middleware {
        (ctx: Context, next: NextFunction, ...args: any[]): Promise<void>;
    }

    export interface Context extends Record<string | number | symbol, any> {
        readonly request: IncomingRequest;
        readonly response: ServerResponse;
        readonly cookie: {
            options?: CookieOptions;
            value?: string;
            remove(): void;
            readonly removed: boolean;
        }
        readonly options: {
            finishResponse: boolean | ((ctx: Context) => Promise<void> | void);
            useDefaultCookie: boolean;
        }
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

export = Server;