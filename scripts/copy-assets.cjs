const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const source = path.join(root, "web");
const destination = path.join(root, "android", "app", "src", "main", "assets", "web");

fs.rmSync(destination, { recursive: true, force: true });
fs.mkdirSync(destination, { recursive: true });
fs.cpSync(source, destination, { recursive: true });
console.log(`Copied offline UI assets to ${path.relative(root, destination)}`);
