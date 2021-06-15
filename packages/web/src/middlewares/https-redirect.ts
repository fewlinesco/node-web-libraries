import { Tracer } from "@fwl/tracing";
import { IncomingMessage, ServerResponse } from "http";
import { TLSSocket } from "tls";

import { HttpStatus } from "../http-statuses";
import { Handler } from "../typings/handler";
import { redirect } from "../utils";

const httpsRedirectMiddleware =
  <T extends IncomingMessage, U extends ServerResponse>(tracer: Tracer) =>
  (handler: Handler<T, U>) =>
  (request: T, response: U): Promise<void> => {
    return tracer.span("https-redirect-middleware", async () => {
      const host = request.headers["host"];
      const isLocalServer =
        host.includes("localhost") || host.includes("127.0.0.1");
      const isHttps =
        request.headers["x-forwarded-proto"] === "https" ||
        (request.socket as TLSSocket).encrypted === true;

      if (!isLocalServer && !isHttps) {
        redirect(
          response,
          HttpStatus.PERMANENT_REDIRECT,
          `https://${request.headers["host"]}${request.url}`,
        );
      } else {
        return handler(request, response);
      }
    });
  };

export { httpsRedirectMiddleware };
