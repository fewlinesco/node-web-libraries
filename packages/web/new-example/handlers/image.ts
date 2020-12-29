import { Tracer } from "@fwl/tracing";
import { Request, Response } from "express";
import { resolve as pathResolve } from "path";

import { HttpStatus } from "../../index";

export function getLogo(tracer: Tracer) {
  return (request: Request, response: Response): Promise<void> => {
    return tracer.span("image-handler", async () => {
      const imagePath = pathResolve(__dirname, "../static/logo.png");
      response.status(HttpStatus.OK);
      response.sendFile(imagePath);
    });
  };
}
