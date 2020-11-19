#!/usr/bin/env node

import { runCLI } from "./cli";

try {
  runCLI();
} catch (err) {
  console.error(err);
  process.exit(1);
}
