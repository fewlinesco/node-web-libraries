import { Endpoint, HttpStatus } from "@fwl/web";
import { WebError } from "@fwl/web/dist/errors";
import {
  loggingMiddleware,
  wrapMiddlewares,
  tracingMiddleware,
  errorMiddleware,
  recoveryMiddleware,
} from "@fwl/web/dist/middlewares";
import fetch from "cross-fetch";
import { NextApiRequest, NextApiResponse } from "next";

import logger from "../../logger";
import getTracer from "../../tracer";

const tracer = getTracer();

const handler = (
  request: NextApiRequest,
  response: NextApiResponse,
): Promise<void> => {
  return tracer.span("test-handler", async (span) => {
    if (request.query.someQueryParam) {
      span.setDisclosedAttribute(
        "someQueryParam",
        request.query.someQueryParam,
      );
      throw new WebError({
        error: {
          code: "1",
          message: "oups",
        },
        httpStatus: HttpStatus.NOT_ACCEPTABLE,
      });
    }

    if (request.query.error) {
      throw new Error("youho");
    }

    const result = await fetch("https://api.chucknorris.io/jokes/random");
    await result.json();

    response.statusCode = 200;
    response.json({ name: "John Doe" });
  });
};

const wrappedHandler = wrapMiddlewares(
  [
    tracingMiddleware(tracer),
    recoveryMiddleware(tracer),
    errorMiddleware(tracer),
    loggingMiddleware(tracer, logger),
  ],
  handler,
  "api/hello",
);
export default new Endpoint<NextApiRequest, NextApiResponse>()
  .get(wrappedHandler)
  .getHandler();
