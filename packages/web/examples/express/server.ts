import { Logger } from "@fewlines/fwl-logging";
import { Tracer } from "@fwl/tracing";
import { Router } from "@fwl/web";
import { createApp } from "@fwl/web/dist/express-converter";
import { withLogging } from "@fwl/web/dist/middlewares";
import express, { Application, Request, Response } from "express";

import * as csvHandler from "./handlers/csv";
import * as imageHandler from "./handlers/image";
import { pingHandler } from "./handlers/ping";
import * as userHandler from "./handlers/users";
import { authMiddleware } from "./middlewares/auth";
import { errorMiddleware } from "./middlewares/error";

export function start(tracer: Tracer, logger: Logger): Application {
  const router = new Router<Request, Response>([
    withLogging(tracer, logger),
    errorMiddleware(tracer),
  ]);

  router.get("/ping", pingHandler(tracer));
  router.get("/users/:id", userHandler.getUserById(tracer));

  router.post("/users", userHandler.createUser(tracer));

  router.get("/logo-image", imageHandler.getLogo(tracer));

  router.get("/csv", csvHandler.getCsv(tracer));

  const authRouter = new Router<Request, Response>([
    withLogging(tracer, logger),
    errorMiddleware(tracer),
    authMiddleware(tracer),
  ]);

  authRouter.get("/auth-ping", pingHandler(tracer));

  return createApp(express(), [authRouter, router]);
}
