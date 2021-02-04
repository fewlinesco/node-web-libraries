import { IncomingMessage, ServerResponse } from "http";

import { HttpStatus } from "./http-statuses";
import { Handler } from "./typings/handler";

export class Endpoint<
  T extends IncomingMessage = IncomingMessage,
  U extends ServerResponse = ServerResponse
> {
  private handlers: {
    get?: Handler<T, U>;
    post?: Handler<T, U>;
    patch?: Handler<T, U>;
    put?: Handler<T, U>;
    delete?: Handler<T, U>;
  };

  constructor() {
    this.handlers = {};
  }

  get(handler: Handler<T, U>): this {
    this.handlers.get = handler;
    return this;
  }

  post(handler: Handler<T, U>): this {
    this.handlers.post = handler;
    return this;
  }

  patch(handler: Handler<T, U>): this {
    this.handlers.patch = handler;
    return this;
  }

  delete(handler: Handler<T, U>): this {
    this.handlers.delete = handler;
    return this;
  }

  put(handler: Handler<T, U>): this {
    this.handlers.put = handler;
    return this;
  }

  getHandler(): Handler<T, U> {
    return (request, response) => {
      if (!this.handlers[request.method.toLowerCase()]) {
        response.statusCode = HttpStatus.METHOD_NOT_ALLOWED;
        return response.end();
      }

      return this.handlers[request.method.toLowerCase()](request, response);
    };
  }
}
