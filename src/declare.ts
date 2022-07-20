import http from "http";

export type RequestMethod =
    "GET" | "POST" | "PUT" | "DELETE" | "HEAD"
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
    /**
     * Raw request.
     */
    readonly raw: http.IncomingMessage;

    /**
     * The request method.
     */
    readonly method: RequestMethod;

    /**
     * The request URL.
     */
    readonly url: string;

    /**
     * The request headers.
     */
    readonly headers: http.IncomingHttpHeaders;

    /**
     * The request body.
     */
    readonly body: any;

    /**
     * The request query parameters.
     */
    readonly query: { [key: string]: string };
}

/**
* Next function.
*/
export interface NextFunction {
    (...args: any[]): Promise<void>;
}

export interface ServerResponse {
    /**
     * Raw response.
     */
    readonly raw: http.ServerResponse;

    /**
     * Response body
     */
    body?: any;

    /**
     * Response body type
     */
    type?: MIMEType;

    /**
     * The status
     */
    readonly status: {
        code?: number;
        message?: string;
    }

    /**
     * The response headers
     */
    readonly headers: { [key: string]: string };

    /**
     * Redirect to another URL
     * @param url the new url
     */
    redirect(url: string, permanent?: boolean): void;
}

export interface CookieOptions {
    /**
     * Specifies the value for the {@link https://tools.ietf.org/html/rfc6265#section-5.2.3|Domain Set-Cookie attribute}. By default, no
     * domain is set, and most clients will consider the cookie to apply to only
     * the current domain.
     */
    domain?: string | undefined;

    /**
     * Specifies the `Date` object to be the value for the {@link https://tools.ietf.org/html/rfc6265#section-5.2.1|`Expires` `Set-Cookie` attribute}. By default,
     * no expiration is set, and most clients will consider this a "non-persistent cookie" and will delete
     * it on a condition like exiting a web browser application.
     *
     * *Note* the {@link https://tools.ietf.org/html/rfc6265#section-5.3|cookie storage model specification}
     * states that if both `expires` and `maxAge` are set, then `maxAge` takes precedence, but it is
     * possible not all clients by obey this, so if both are set, they should
     * point to the same date and time.
     */
    expires?: Date | undefined;
    /**
     * Specifies the boolean value for the {@link https://tools.ietf.org/html/rfc6265#section-5.2.6|`HttpOnly` `Set-Cookie` attribute}.
     * When truthy, the `HttpOnly` attribute is set, otherwise it is not. By
     * default, the `HttpOnly` attribute is not set.
     *
     * *Note* be careful when setting this to true, as compliant clients will
     * not allow client-side JavaScript to see the cookie in `document.cookie`.
     */
    httpOnly?: boolean | undefined;
    /**
     * Specifies the number (in seconds) to be the value for the `Max-Age`
     * `Set-Cookie` attribute. The given number will be converted to an integer
     * by rounding down. By default, no maximum age is set.
     *
     * *Note* the {@link https://tools.ietf.org/html/rfc6265#section-5.3|cookie storage model specification}
     * states that if both `expires` and `maxAge` are set, then `maxAge` takes precedence, but it is
     * possible not all clients by obey this, so if both are set, they should
     * point to the same date and time.
     */
    maxAge?: number | undefined;
    /**
     * Specifies the value for the {@link https://tools.ietf.org/html/rfc6265#section-5.2.4|`Path` `Set-Cookie` attribute}.
     * By default, the path is considered the "default path".
     */
    path?: string | undefined;
    /**
     * Specifies the `string` to be the value for the [`Priority` `Set-Cookie` attribute][rfc-west-cookie-priority-00-4.1].
     *
     * - `'low'` will set the `Priority` attribute to `Low`.
     * - `'medium'` will set the `Priority` attribute to `Medium`, the default priority when not set.
     * - `'high'` will set the `Priority` attribute to `High`.
     *
     * More information about the different priority levels can be found in
     * [the specification][rfc-west-cookie-priority-00-4.1].
     *
     * **note** This is an attribute that has not yet been fully standardized, and may change in the future.
     * This also means many clients may ignore this attribute until they understand it.
     */
    priority?: 'low' | 'medium' | 'high' | undefined;
    /**
     * Specifies the boolean or string to be the value for the {@link https://tools.ietf.org/html/draft-ietf-httpbis-rfc6265bis-03#section-4.1.2.7|`SameSite` `Set-Cookie` attribute}.
     *
     * - `true` will set the `SameSite` attribute to `Strict` for strict same
     * site enforcement.
     * - `false` will not set the `SameSite` attribute.
     * - `'lax'` will set the `SameSite` attribute to Lax for lax same site
     * enforcement.
     * - `'strict'` will set the `SameSite` attribute to Strict for strict same
     * site enforcement.
     *  - `'none'` will set the SameSite attribute to None for an explicit
     *  cross-site cookie.
     *
     * More information about the different enforcement levels can be found in {@link https://tools.ietf.org/html/draft-ietf-httpbis-rfc6265bis-03#section-4.1.2.7|the specification}.
     *
     * *note* This is an attribute that has not yet been fully standardized, and may change in the future. This also means many clients may ignore this attribute until they understand it.
     */
    sameSite?: true | false | 'lax' | 'strict' | 'none' | undefined;
    /**
     * Specifies the boolean value for the {@link https://tools.ietf.org/html/rfc6265#section-5.2.5|`Secure` `Set-Cookie` attribute}. When truthy, the
     * `Secure` attribute is set, otherwise it is not. By default, the `Secure` attribute is not set.
     *
     * *Note* be careful when setting this to `true`, as the server will not set the 'Set-Cookie' header if the browser does not have an HTTPS connection.
     */
    secure?: boolean | undefined;
}

/**
* The request and response context.
*/
export interface Context extends Record<string | number | symbol, any> {
    /**
     * The incoming request.
     */
    readonly request: IncomingRequest;

    /**
     * The response.
     */
    readonly response: ServerResponse;

    /**
     * The cookie 
     */
    readonly cookie: {
        /**
         * The cookie options
         */
        options?: CookieOptions;

        /**
         * The cookie value
         */
        value?: string;

        /**
         * Delete the cookie
         */
        remove(): void;

        /**
         * Check whether the cookie is removed
         */
        readonly removed: boolean;
    }

    /**
     * Application options
     */
    readonly options: {
        /**
         * Specify the way the app will finish the response. Defaults to true
         * 
         * If set to false the app will not response to the request
         */
        finishResponse: boolean | ((ctx: Context) => Promise<void> | void);

        /**
         * Whether to use the default cookie implementation or not. Defaults to true
         */
        useDefaultCookie: boolean;
    }
}