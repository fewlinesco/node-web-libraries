import { Logger } from "@fewlines/fwl-logging";
import { Tracer } from "@fwl/tracing";
import { Application } from "express";

import { createApp, loggingMiddleware, Router } from "../index";
import * as csvHandler from "./handlers/csv";
import * as imageHandler from "./handlers/image";
import { pingHandler } from "./handlers/ping";
import * as userHandler from "./handlers/users";
import { authMiddleware } from "./middlewares/auth";

export function start(tracer: Tracer, logger: Logger): Application {
  const router = new Router(tracer, logger);

  router.get("/ping", pingHandler());
  router.get<userHandler.GetUsersByIdParams>(
    "/users/:id",
    userHandler.getUserById(),
  );

  router.post<userHandler.CreateUserParams, userHandler.CreateUserBody>(
    "/users",
    userHandler.createUser(),
  );

  router.get("/logo-image", imageHandler.getLogo());

  router.get("/csv", csvHandler.getCsv());

  const authRouter = new Router(tracer, logger, [authMiddleware(tracer)]);

  authRouter.get("/auth-ping", pingHandler());

  return createApp([authRouter, router], [loggingMiddleware(tracer, logger)]);
}
