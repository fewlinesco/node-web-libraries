import express, { Application } from "express";

import { extendRequestMiddleware } from "./middlewares/extend-request";
import { Router } from "./router";

export function createApp(
  routers: Router[],
  globalMiddlewares = [],
): Application {
  const app = express();

  app.use(extendRequestMiddleware());
  globalMiddlewares.forEach((middleware) => app.use(middleware));
  routers.forEach((router) => app.use(router.getRouter()));

  return app;
}
