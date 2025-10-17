#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ENV_PATH = path.resolve(process.cwd(), ".env");

function ensureEnvFile() {
  if (!fs.existsSync(ENV_PATH)) {
    fs.writeFileSync(ENV_PATH, "", "utf8");
  }
}

function setOrReplace(lines, key, value) {
  const formatted = `${key}=${value}`;
  let replaced = false;

  const updated = lines.map((line) => {
    if (line.trim().startsWith(`${key}=`)) {
      replaced = true;
      return formatted;
    }
    return line;
  });

  if (!replaced) {
    updated.push(formatted);
  }

  return updated;
}

function main() {
  const key = process.argv[2];
  if (!key) {
    console.error("Uso: npm run set:gemini -- <API_KEY>");
    process.exit(1);
  }

  ensureEnvFile();

  const raw = fs.readFileSync(ENV_PATH, "utf8");
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line, index, array) => !(line === "" && index === array.length - 1));

  let updated = setOrReplace(lines, "GEMINI_API_KEY", key);
  updated = setOrReplace(updated, "GEMINI_MODEL", "models/gemini-2.0-flash");

  fs.writeFileSync(ENV_PATH, `${updated.join("\n")}\n`, "utf8");
  console.log("GEMINI_API_KEY y GEMINI_MODEL actualizados en .env");
}

main();
