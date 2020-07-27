import express, { Application } from "express";

export function createApp(router: any, middlewares = []): Application {
  const app = express();

  middlewares.forEach((middleware) => app.use(middleware));
  app.use(router.getRouter());

  return app;
}
