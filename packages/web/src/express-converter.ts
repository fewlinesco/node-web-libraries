import { Application } from "express";

import { Router } from "./router.legacy";

export function createApp(
  expressApp: Application,
  routers: Router[],
  middlewares: unknown[],
): Application {
  return expressApp;
}
