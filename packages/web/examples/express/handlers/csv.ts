import { Tracer } from "@fwl/tracing";
import { HttpStatus, Handler } from "@fwl/web";
import { Request, Response } from "express";

export function getCsv(tracer: Tracer): Handler<Request, Response> {
  return (request: Request, response: Response) => {
    return tracer.span("csv-handler", async () => {
      const csvData = "1,Frieda,Ewlines";

      response.setHeader("Content-Type", "text/csv");
      response.statusCode = HttpStatus.OK;
      response.end(csvData);
    });
  };
}
