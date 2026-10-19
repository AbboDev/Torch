// Syncs the version from package.json into the Tauri sidecar files
// (src-tauri/Cargo.toml and src-tauri/tauri.conf.json) before a Tauri build.
//
// Run it with: npm run tauri:version
//
// It is called automatically by `npm run tauri:dev`, `npm run tauri:build` and
// `npm run tauri:release`, so the Tauri binary always matches the npm version.
//
// Only the *version* is synced: the product name is a desktop-app name ("Torch"),
// not the npm package name ("torch-game"), so it stays pinned in tauri.conf.json.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const version = pkg.version;

// --- Cargo.toml -------------------------------------------------------------
const cargoPath = path.join(root, "src-tauri", "Cargo.toml");
let cargo = readFileSync(cargoPath, "utf8");
cargo = cargo.replace(/^version = "[^"]+"/m, `version = "${version}"`);
writeFileSync(cargoPath, cargo);

// --- tauri.conf.json --------------------------------------------------------
const confPath = path.join(root, "src-tauri", "tauri.conf.json");
let conf = readFileSync(confPath, "utf8");
conf = conf.replace(/"version": "[^"]+"/, `"version": "${version}"`);
writeFileSync(confPath, conf);

console.log(`Tauri version synced to ${version}`);
