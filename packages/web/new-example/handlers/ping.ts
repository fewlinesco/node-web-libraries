import { getTracer } from "@fwl/tracing";
import { Request, Response } from "express";

import { HttpStatus } from "../../index";

export function pingHandler() {
  const tracer = getTracer();
  return (request: Request, response: Response): Promise<void> => {
    return tracer.span("ping-handler", async () => {
      response.statusCode = HttpStatus.OK;
      response.end("OK");
    });
  };
}
