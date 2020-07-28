import { Tracer } from "@fewlines/fwl-tracing";

import {
  HandlerPromise,
  HttpStatus,
  RejectFunction,
  ResolveFunction,
  UnmanagedError,
} from "../../index";

export type GetUsersByIdParams = any;

const users = [
  { id: "f55bce0a-a2d3-49a8-8fd6-5a6d2d5b3a18", name: "John Doe" },
  { id: "f15baea5-8134-4922-9691-afcfb7c0c1ca", name: "Jane Doe" },
];

export function getUserById() {
  return (
    tracer: Tracer,
    resolve: ResolveFunction,
    reject: RejectFunction,
    params: GetUsersByIdParams,
  ): HandlerPromise => {
    return tracer.span("get-user-by-id", async (span) => {
      span.setAttribute("user-id", params.id);

      const user = users.find((user) => user.id === params.id);

      if (!user) {
        // This is just for the example but it
        // should be a user defined error
        return reject(UnmanagedError());
      }

      return resolve(HttpStatus.OK, user);
    });
  };
}

export type CreateUserParams = Record<string, unknown>;
export interface CreateUserBody {
  name: string;
}

export function createUser() {
  return (
    tracer: Tracer,
    resolve: ResolveFunction,
    _reject: RejectFunction,
    _params: CreateUserParams,
    body: CreateUserBody,
  ): HandlerPromise => {
    return tracer.span("create-user", async () => {
      users.push({
        id: "86f57c73-4e2a-47aa-a050-d8b3c10705cf",
        name: body.name,
      });

      return resolve(HttpStatus.CREATED);
    });
  };
}
