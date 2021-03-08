import { IncomingMessage, ServerResponse } from "http";

import { wrapMiddlewares } from "./middlewares/wrapper";
import { Handler } from "./typings/handler";
import { Middleware } from "./typings/middleware";

type pathHandlers<T extends IncomingMessage, U extends ServerResponse> = {
  get?: Handler<T, U>;
  post?: Handler<T, U>;
  patch?: Handler<T, U>;
  put?: Handler<T, U>;
  delete?: Handler<T, U>;
};

class Router<
  T extends IncomingMessage = IncomingMessage,
  U extends ServerResponse = ServerResponse
> {
  private middlewares: Middleware<T, U>[];
  private paths: Record<string, pathHandlers<T, U>>;

  constructor(middlewares: Middleware<T, U>[]) {
    this.middlewares = middlewares;
    this.paths = {};
  }

  private addRoute(
    path: string,
    method: "get" | "post" | "patch" | "put" | "delete",
    handler: Handler<T, U>,
  ): this {
    if (!this.paths[path]) {
      this.paths[path] = {};
    }
    this.paths[path][method] = wrapMiddlewares<T, U>(
      this.middlewares,
      handler,
      path,
    );
    return this;
  }

  get(path: string, handler: Handler<T, U>): this {
    return this.addRoute(path, "get", handler);
  }

  post(path: string, handler: Handler<T, U>): this {
    return this.addRoute(path, "post", handler);
  }

  patch(path: string, handler: Handler<T, U>): this {
    return this.addRoute(path, "patch", handler);
  }

  delete(path: string, handler: Handler<T, U>): this {
    return this.addRoute(path, "delete", handler);
  }

  put(path: string, handler: Handler<T, U>): this {
    return this.addRoute(path, "put", handler);
  }

  getRoutes(): Record<string, pathHandlers<T, U>> {
    return this.paths;
  }
}

export { Router };
