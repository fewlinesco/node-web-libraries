import * as fs from "fs";
import * as path from "path";

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
