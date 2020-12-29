import { getTracer } from "@fwl/tracing";
import { sendJSON } from "@src/utils";
import { Request, Response } from "express";

import { HttpStatus, WebError } from "../../index";

export type GetUsersByIdParams = { id: string };

const users = [
  { id: "f55bce0a-a2d3-49a8-8fd6-5a6d2d5b3a18", name: "John Doe" },
  { id: "f15baea5-8134-4922-9691-afcfb7c0c1ca", name: "Jane Doe" },
];

export class UserNotFoundError extends WebError {}

export function getUserById() {
  return (request: Request, response: Response): Promise<void> => {
    const tracer = getTracer();
    return tracer.span("get-user-by-id", async (span) => {
      span.setAttribute("user-id", request.params.id);
      request.query;

      const user = users.find((user) => user.id === request.params.id);

      if (!user) {
        throw new UserNotFoundError({
          error: {
            code: "TST_201229_YNXL",
            message: "No user found",
          },
          httpStatus: HttpStatus.NOT_FOUND,
        });
      }

      response.statusCode = HttpStatus.OK;
      sendJSON(response, user);
    });
  };
}

export type CreateUserParams = Record<string, unknown>;
export interface CreateUserBody {
  name: string;
}

export class ParameterError extends WebError {}

export function createUser() {
  return (request: Request, response: Response): Promise<void> => {
    const tracer = getTracer();
    return tracer.span("create-user", async () => {
      if (request.body.name) {
        const user = {
          id: "86f57c73-4e2a-47aa-a050-d8b3c10705cf",
          name: request.body.name,
        };
        users.push(user);

        response.statusCode = HttpStatus.CREATED;
        response.json(user);
      } else {
        throw new ParameterError({
          error: {
            code: "TST_201229_GYFN",
            message: "No name provided",
          },
          httpStatus: HttpStatus.BAD_REQUEST,
        });
      }
    });
  };
}
