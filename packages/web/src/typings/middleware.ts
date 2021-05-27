import { IncomingMessage, ServerResponse } from "http";

import { Handler } from "./handler";

type Middleware<
  T extends IncomingMessage = IncomingMessage,
  U extends ServerResponse = ServerResponse,
> = (handler: Handler<T, U>) => Handler<T, U>;

export type { Middleware };
