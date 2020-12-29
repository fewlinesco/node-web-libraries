import { Tracer } from "@fwl/tracing";
import { HttpStatus } from "@fwl/web";
import { Request, Response } from "express";

export function pingHandler(tracer: Tracer) {
  return (request: Request, response: Response): Promise<void> => {
    return tracer.span("ping-handler", async () => {
      response.statusCode = HttpStatus.OK;
      response.end("OK");
    });
  };
}
