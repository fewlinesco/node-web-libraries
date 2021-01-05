import { IncomingMessage, ServerResponse } from "http";

export type Handler<
  T extends IncomingMessage = IncomingMessage,
  U extends ServerResponse = ServerResponse
> = (request: T, response: U) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
