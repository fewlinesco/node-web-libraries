import express, { Application } from "express";

import { extendRequestMiddleware } from "./middlewares/extend-request";
import { Router } from "./router";

export function createApp(router: Router, middlewares = []): Application {
  const app = express();

  app.use(extendRequestMiddleware());
  middlewares.forEach((middleware) => app.use(middleware));
  app.use(router.getRouter());

  return app;
}
