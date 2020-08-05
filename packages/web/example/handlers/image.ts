import { Tracer } from "@fwl/tracing";
import { resolve as pathResolve } from "path";

import { HandlerPromise, HttpStatus, ResolveFunction } from "../../index";

export function getLogo() {
  return (tracer: Tracer, resolve: ResolveFunction): HandlerPromise => {
    return tracer.span("image-handler", async () => {
      const imagePath = pathResolve(__dirname, "../static/logo.png");
      return resolve(HttpStatus.OK, imagePath, {}, { file: true });
    });
  };
}
