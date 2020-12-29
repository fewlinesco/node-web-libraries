import { Middleware } from "@src/typings/middleware";
import { IncomingMessage, ServerResponse } from "http";

import { Handler } from "../typings/handler";

export const wrapMiddlewares = <
  T extends IncomingMessage,
  U extends ServerResponse
>(
  middlewares: Middleware<T, U>[],
  handler: Handler<T, U>,
): Handler<T, U> => {
  for (const middleware of middlewares.reverse()) {
    handler = middleware(handler);
  }

  return handler;
};
