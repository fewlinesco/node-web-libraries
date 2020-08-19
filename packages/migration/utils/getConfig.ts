import * as fs from "fs";
import * as path from "path";

import { RunMigrationsConfig } from "../config/config";

export async function getConfig(
  configPath?: string,
): Promise<RunMigrationsConfig> {
  const cleanConfigPath = path.join(
    process.cwd(),
    configPath ? configPath : "./config.json",
  );

  return fs.promises.readFile(cleanConfigPath, "utf8").then(JSON.parse);
}
