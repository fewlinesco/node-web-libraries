import { seal, defaults, unseal } from "@hapi/iron";
import cookie from "cookie";
import { IncomingMessage, ServerResponse } from "http";
import onFinished from "on-finished";
import parseurl from "parseurl";
import qs from "qs";
import send from "send";
import { Stream } from "stream";

export function setHeaders(
  response: ServerResponse,
  headers: Record<string, string>,
): void {
  Object.entries(headers).forEach(([key, value]) => {
    response.setHeader(key, value);
  });
}

export function sendJSON(response: ServerResponse, json: unknown): void {
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(json));
}

export function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = "";
    request.on("data", function (chunk) {
      body += chunk;
    });
    request.on("end", function () {
      resolve(body);
    });
  });
}

export async function parseBodyAsJson<T = Record<string, unknown>>(
  request: IncomingMessage,
): Promise<T> {
  const stringifiedBody = await readBody(request);
  return JSON.parse(stringifiedBody) as T;
}

export function redirect(
  response: ServerResponse,
  status: number,
  path: string,
): void {
  response.statusCode = status;
  response.setHeader("Location", path);
}

function isAbsolute(path: string): boolean {
  if ("/" === path[0]) {
    return true;
  }
  if (":" === path[1] && ("\\" === path[2] || "/" === path[2])) {
    return true;
  } // Windows device path
  if ("\\\\" === path.substring(0, 2)) {
    return true;
  } // Microsoft Azure absolute path
  return false;
}

export function query(request: IncomingMessage): qs.ParsedQs {
  const queryparse = qs.parse;

  const val = parseurl(request).query as string;
  return queryparse(val, { allowPrototypes: true });
}

export function sendFile(
  request: IncomingMessage,
  response: ServerResponse,
  path: string,
  options: Record<string, string>,
): Promise<void> {
  const opts = options || {};

  if (!isAbsolute(path)) {
    throw new TypeError(
      "path must be absolute or specify root to res.sendFile",
    );
  }

  // create file stream
  const pathname = encodeURI(path);
  const file = send(request, pathname, opts);

  return new Promise((resolve, reject) => {
    // transfer
    _sendfile(response, file, opts, function (err) {
      if (err && err.code === "EISDIR") {
        return resolve();
      }

      if (err && err.code !== "ECONNABORTED" && err.syscall !== "write") {
        reject(err);
      }
    });
  });
}

class WithCodeError extends Error {
  public code: string;
  public syscall: string;
}

// pipe the send file stream
function _sendfile(
  response: ServerResponse,
  file: Stream,
  options: Record<string, string>,
  callback: (error?: WithCodeError) => void,
): void {
  let done = false;
  let streaming;

  // request aborted
  function onaborted(): void {
    if (done) {
      return;
    }
    done = true;

    const err = new WithCodeError("Request aborted");
    err.code = "ECONNABORTED";
    callback(err);
  }

  // directory
  function ondirectory(): void {
    if (done) {
      return;
    }
    done = true;

    const err = new WithCodeError("EISDIR, read");
    err.code = "EISDIR";
    callback(err);
  }

  // errors
  function onerror(err): void {
    if (done) {
      return;
    }
    done = true;
    callback(err);
  }

  // ended
  function onend(): void {
    if (done) {
      return;
    }
    done = true;
    callback();
  }

  // file
  function onfile(): void {
    streaming = false;
  }

  // finished
  function onfinish(err): void {
    if (err && err.code === "ECONNRESET") {
      return onaborted();
    }
    if (err) {
      return onerror(err);
    }
    if (done) {
      return;
    }

    setImmediate(function () {
      if (streaming !== false && !done) {
        onaborted();
        return;
      }

      if (done) {
        return;
      }
      done = true;
      callback();
    });
  }

  // streaming
  function onstream(): void {
    streaming = true;
  }

  file.on("directory", ondirectory);
  file.on("end", onend);
  file.on("error", onerror);
  file.on("file", onfile);
  file.on("stream", onstream);
  onFinished(response, onfinish);

  if (options.headers) {
    // set headers on successful transfer
    file.on("headers", function headers(res) {
      const obj = options.headers;
      const keys = Object.keys(obj);

      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        res.setHeader(k, obj[k]);
      }
    });
  }

  // pipe
  file.pipe(response);
}

export async function setServerSideCookies(
  response: ServerResponse,
  cookieName: string,
  cookieValue: string | Record<string, unknown>,
  options: {
    shouldCookieBeSealed: boolean;
    cookieSalt?: string;
  } & cookie.CookieSerializeOptions,
): Promise<void> {
  const { shouldCookieBeSealed, cookieSalt, ...setCookieOptions } = options;

  if (shouldCookieBeSealed) {
    const sealedCookieValue = await seal(
      JSON.stringify(cookieValue),
      cookieSalt,
      defaults,
    );

    response.setHeader(
      "Set-Cookie",
      cookie.serialize(cookieName, sealedCookieValue, setCookieOptions),
    );
  } else {
    response.setHeader(
      "Set-Cookie",
      cookie.serialize(
        cookieName,
        JSON.stringify(cookieValue),
        setCookieOptions,
      ),
    );
  }
}

export async function getServerSideCookies<T = unknown>(
  request: IncomingMessage,
  cookieParams: {
    cookieName: string;
    isCookieSealed: boolean;
    cookieSalt?: string;
  },
): Promise<T | undefined> {
  const { cookieName, isCookieSealed, cookieSalt } = cookieParams;
  const cookies = cookie.parse(request.headers.cookie || "");
  const targetedCookie = cookies[cookieName];

  if (!targetedCookie) {
    return undefined;
  }

  if (isCookieSealed) {
    const unsealedCookie = await unseal(targetedCookie, cookieSalt, defaults);

    return JSON.parse(unsealedCookie);
  }

  return JSON.parse(targetedCookie);
}

export function setAlertMessagesCookie(
  response: ServerResponse,
  alertMessages: string | string[],
): void {
  const cookieValue =
    typeof alertMessages === "string" ? [alertMessages] : alertMessages;

  response.setHeader(
    "Set-Cookie",
    cookie.serialize(`alert-messages`, JSON.stringify(cookieValue), {
      maxAge: 24 * 60 * 60,
      path: "/",
    }),
  );
}
