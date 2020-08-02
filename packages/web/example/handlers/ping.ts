import { Tracer } from "@fwl/tracing";

import { HandlerPromise, HttpStatus, ResolveFunction } from "../../index";

export function pingHandler() {
  return (tracer: Tracer, resolve: ResolveFunction): HandlerPromise => {
    return tracer.span("ping-handler", async () => {
      return resolve(HttpStatus.OK, "OK");
    });
  };
}
