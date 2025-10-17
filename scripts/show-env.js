#!/usr/bin/env node

import fs from "fs";
import path from "path";

const ENV_PATH = path.resolve(process.cwd(), ".env");

if (!fs.existsSync(ENV_PATH)) {
  console.error("Archivo .env no encontrado en el directorio del proyecto.");
  process.exit(1);
}

try {
  const content = fs.readFileSync(ENV_PATH, "utf8");
  console.log(content);
} catch (error) {
  console.error("No se pudo leer el archivo .env:", error instanceof Error ? error.message : error);
  process.exit(1);
}
