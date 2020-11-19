import { DatabaseConfig } from "@fwl/database";
import * as fs from "fs";
import * as path from "path";
import * as url from "url";

import { RunMigrationsConfig } from "../config/config";

export async function getConfig(
  configPath?: string,
): Promise<RunMigrationsConfig> {
  configPath = configPath ? configPath : "./config.json";

  const cleanConfigPath = path.isAbsolute ? configPath : path.join(
    process.cwd(),
    configPath
  );

  return fs.promises.readFile(cleanConfigPath, "utf8").then(JSON.parse);
}

export function parseDatabaseURL(databaseURL: string): DatabaseConfig {
  const parsedDatabaseURL = new url.URL(databaseURL)
  return {
    database: parsedDatabaseURL.pathname,
    host: parsedDatabaseURL.hostname,
    port: parseInt(parsedDatabaseURL.port),
    username: parsedDatabaseURL.username,
    password: parsedDatabaseURL.password
  }
}