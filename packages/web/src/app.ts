import express, { Application } from "express";

import { Router } from "./router";

export function createApp(router: Router, middlewares = []): Application {
  const app = express();

  middlewares.forEach((middleware) => app.use(middleware));
  app.use(router.getRouter());

  return app;
}
