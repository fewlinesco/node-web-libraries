import { IncomingMessage, ServerResponse } from "http";

type Handler<
  T extends IncomingMessage = IncomingMessage,
  U extends ServerResponse = ServerResponse
> = (request: T, response: U) => any; // eslint-disable-line @typescript-eslint/no-explicit-any

export type { Handler };
