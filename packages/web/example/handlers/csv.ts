import { Tracer } from "@fwl/tracing";

import { HandlerPromise, HttpStatus, ResolveFunction } from "../../index";

export function getCsv() {
  return (tracer: Tracer, resolve: ResolveFunction): HandlerPromise => {
    return tracer.span("csv-handler", async () => {
      const csvData = "1,Frieda,Ewlines";
      return resolve(HttpStatus.OK, csvData, { "Content-Type": "text/csv" });
    });
  };
}
