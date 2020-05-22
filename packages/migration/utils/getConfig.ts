import * as fs from "fs";
import * as path from "path";

import { MigrateConfig } from "../index";

export async function getConfig(configPath: string): Promise<MigrateConfig> {
  const cleanConfigPath = path.join(process.cwd(), configPath);

  const config = await fs.promises.readFile(cleanConfigPath, "utf8");

  return JSON.parse(config);
}
