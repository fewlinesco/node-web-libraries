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
  if (process.env.NODE_ENV !== "production") {
    const middlewaresOrder = middlewares.map((func) => func.name);
    const logging = middlewaresOrder.findIndex(
      (middleware) => middleware === "withFwlLoggingHandler",
    );
    const error = middlewaresOrder.findIndex(
      (middleware) => middleware === "withFwlErrorHandler",
    );
    const recovery = middlewaresOrder.findIndex(
      (middleware) => middleware === "withFwlRecoveryErrorHandler",
    );
    if (logging > -1 && error > -1 && error > logging) {
      console.warn(
        "Warning: You're using the FWL Logging and Error middlewares but in the wrong order. The Error middleware should come before the Logging one.",
      );
    }
    if (logging > -1 && recovery > -1 && recovery > logging) {
      console.warn(
        "Warning: You're using the FWL Logging and Recovery middlewares but in the wrong order. The Recovery middleware should come before the Logging one.",
      );
    }
    if (error > -1 && recovery > -1 && recovery > error) {
      console.warn(
        "Warning: You're using the FWL Error and Recovery middlewares but in the wrong order. The Recovery middleware should come before the Error one.",
      );
    }
  }
  for (const middleware of middlewares.reverse()) {
    handler = middleware(handler);
  }

  return handler;
};
