import { getTracer } from "@fwl/tracing";
import { Request, Response } from "express";

import { HttpStatus } from "../../index";

export function getCsv() {
  const tracer = getTracer();

  return (request: Request, response: Response) => {
    return tracer.span("csv-handler", async () => {
      const csvData = "1,Frieda,Ewlines";

      response.setHeader("Content-Type", "text/csv");
      response.statusCode = HttpStatus.OK;
      response.end(csvData);
    });
  };
}
