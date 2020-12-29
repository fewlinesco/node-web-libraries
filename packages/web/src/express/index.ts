import { Application, Response, Request } from "express";

import { Router } from "../router";

export function createApp(
  newApplication: Application,
  routers: Router<Request, Response>[],
): Application {
  routers.forEach((router) => {
    const routes = router.getRoutes();
    Object.entries(routes).forEach(([path, pathHandlers]) => {
      Object.entries(pathHandlers).forEach(([method, handler]) => {
        newApplication[method](path, handler);
      });
    });
  });
  return newApplication;
}
