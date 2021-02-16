import { IncomingMessage, ServerResponse } from "http";

import { Handler } from "../typings/handler";
import { Middleware } from "../typings/middleware";

export const wrapMiddlewares = <
  T extends IncomingMessage,
  U extends ServerResponse
>(
  middlewares: Middleware<T, U>[],
  handler: Handler<T, U>,
  path?: string,
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

  const route = path ? path : handler["__route"];

  for (let i = middlewares.length - 1; i >= 0; i--) {
    const isNextJS = handler["__nextjs"];
    handler = middlewares[i](handler);

    if (isNextJS) {
      handler["__nextjs"] = true;
    }

    if (route) {
      handler["__route"] = route;
    }
  }

  return handler;
};
