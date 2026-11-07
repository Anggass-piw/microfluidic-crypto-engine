const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const androidDir = path.join(root, "android");
const copy = spawnSync(process.execPath, [path.join(__dirname, "copy-assets.cjs")], { stdio: "inherit" });
if (copy.status !== 0) process.exit(copy.status || 1);

let command;
let args;
if (process.platform === "win32") {
  command = path.join(androidDir, "gradlew.bat");
  args = ["assembleDebug"];
} else {
  command = path.join(androidDir, "gradlew");
  if (!fs.existsSync(command)) {
    const gradle = process.env.GRADLE_BIN || "gradle";
    command = gradle;
    args = ["-p", androidDir, "assembleDebug"];
  } else {
    args = ["assembleDebug"];
  }
}
const result = spawnSync(command, args, { cwd: androidDir, stdio: "inherit", shell: process.platform === "win32" });
if (result.error) {
  console.error(`Unable to launch Gradle: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
