import { IncomingMessage, ServerResponse } from "http";

import { HttpStatus } from "./http-statuses";
import { Handler } from "./typings/handler";

export class Endpoint {
  private handlers: {
    get?: Handler;
    post?: Handler;
    patch?: Handler;
    put?: Handler;
    delete?: Handler;
  };

  constructor() {
    this.handlers = {};
  }

  get(handler: Handler): this {
    this.handlers.get = handler;
    return this;
  }

  post(handler: Handler): this {
    this.handlers.post = handler;
    return this;
  }

  patch(handler: Handler): this {
    this.handlers.patch = handler;
    return this;
  }

  delete(handler: Handler): this {
    this.handlers.delete = handler;
    return this;
  }

  put(handler: Handler): this {
    this.handlers.put = handler;
    return this;
  }

  getHandler(): Handler {
    return (request: IncomingMessage, response: ServerResponse) => {
      if (!this.handlers[request.method.toLowerCase()]) {
        response.statusCode = HttpStatus.METHOD_NOT_ALLOWED;
        return response.end();
      }

      return this.handlers[request.method.toLowerCase()](request, response);
    };
  }
}
