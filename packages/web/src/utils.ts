import { seal, defaults, unseal } from "@hapi/iron";
import cookie from "cookie";
import { IncomingMessage, ServerResponse } from "http";
import onFinished from "on-finished";
import parseurl from "parseurl";
import qs from "qs";
import send from "send";
import { Stream } from "stream";

import { SetCookieHeaderValueShouldNotBeANumber } from "../errors";
import {
  AlertMessage,
  GetServerSideCookiesParams,
  SetServerSideCookiesOptions,
} from "./typings/utils";

function setHeaders(
  response: ServerResponse,
  headers: Record<string, string>,
): void {
  Object.entries(headers).forEach(([key, value]) => {
    response.setHeader(key, value);
  });
}

function sendJSON(response: ServerResponse, json: unknown): void {
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(json));
}

function readBody(request: IncomingMessage): Promise<string> {
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

async function parseBodyAsJson<T = Record<string, unknown>>(
  request: IncomingMessage,
): Promise<T> {
  const stringifiedBody = await readBody(request);
  return JSON.parse(stringifiedBody) as T;
}

function redirect(
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

function query(request: IncomingMessage): qs.ParsedQs {
  const queryparse = qs.parse;

  const val = parseurl(request).query as string;
  return queryparse(val, { allowPrototypes: true });
}

function sendFile(
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

async function setServerSideCookies(
  response: ServerResponse,
  cookieName: string,
  cookieValue: string | Record<string, unknown>,
  options: SetServerSideCookiesOptions,
): Promise<void> {
  const { shouldCookieBeSealed, cookieSalt, ...setCookieOptions } = options;

  const currentSetCookieValue = response.getHeader("set-cookie");

  if (typeof currentSetCookieValue === "number") {
    throw new Error("Set-Cookie header's value should not be a number");
  }

  if (shouldCookieBeSealed) {
    const sealedCookieValue = await seal(
      JSON.stringify(cookieValue),
      cookieSalt,
      defaults,
    );

    const newCookie = cookie.serialize(
      cookieName,
      sealedCookieValue,
      setCookieOptions,
    );

    if (currentSetCookieValue) {
      let updatedSetCookieValue: string[];

      if (Array.isArray(currentSetCookieValue)) {
        updatedSetCookieValue = [...currentSetCookieValue, newCookie];
      } else {
        updatedSetCookieValue = [currentSetCookieValue, newCookie];
      }

      response.setHeader("Set-Cookie", updatedSetCookieValue);
      return;
    } else {
      response.setHeader("Set-Cookie", newCookie);
      return;
    }
  } else {
    const newCookie = cookie.serialize(
      cookieName,
      JSON.stringify(cookieValue),
      setCookieOptions,
    );

    if (currentSetCookieValue) {
      let updatedSetCookieValue: string[];

      if (Array.isArray(currentSetCookieValue)) {
        updatedSetCookieValue = [...currentSetCookieValue, newCookie];
      } else {
        updatedSetCookieValue = [currentSetCookieValue, newCookie];
      }

      response.setHeader("Set-Cookie", updatedSetCookieValue);
      return
    } else {
       response.setHeader("Set-Cookie", newCookie);
       return
    }
  }
}

async function getServerSideCookies<T = unknown>(
  request: IncomingMessage,
  cookieParams: GetServerSideCookiesParams,
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

async function deleteServerSideCookie(
  response: ServerResponse,
  cookieName: string,
): Promise<void> {
  const toDeleteCookie = cookie.serialize(cookieName, "", {
    maxAge: 0,
    path: "/",
  });

  response.setHeader("Set-Cookie", toDeleteCookie);
}

function setAlertMessagesCookie(
  response: ServerResponse,
  alertMessages: AlertMessage[],
): void {
  const newCookie = cookie.serialize(
    `alert-messages`,
    JSON.stringify(alertMessages),
    {
      maxAge: 24 * 60 * 60,
      path: "/",
    },
  );

  const currentSetCookieValue = response.getHeader("set-cookie");

  if (typeof currentSetCookieValue === "number") {
    throw SetCookieHeaderValueShouldNotBeANumber();
  }

  if (!currentSetCookieValue) {
    response.setHeader("Set-Cookie", newCookie);
    return;
  }

  let updatedSetCookieValue: string[];

  if (Array.isArray(currentSetCookieValue)) {
    updatedSetCookieValue = [...currentSetCookieValue, newCookie];
  } else {
    updatedSetCookieValue = [currentSetCookieValue, newCookie];
  }

  response.setHeader("Set-Cookie", updatedSetCookieValue);
  return;
}

export {
  setHeaders,
  sendJSON,
  readBody,
  parseBodyAsJson,
  redirect,
  query,
  sendFile,
  setServerSideCookies,
  getServerSideCookies,
  deleteServerSideCookie,
  setAlertMessagesCookie,
};
