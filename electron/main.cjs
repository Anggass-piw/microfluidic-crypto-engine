const { app, BrowserWindow, shell } = require("electron");
const path = require("node:path");

function createWindow() {
  const window = new BrowserWindow({
    width: 1380,
    height: 920,
    minWidth: 900,
    minHeight: 650,
    backgroundColor: "#07131f",
    title: "Microfluidic Crypto-Engine Simulator",
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://") || url.startsWith("http://")) shell.openExternal(url);
    return { action: "deny" };
  });

  window.webContents.on("will-navigate", (event, url) => {
    const expected = `file://${path.join(__dirname, "..", "web", "index.html")}`;
    if (url.split("#")[0] !== expected) event.preventDefault();
  });

  window.loadFile(path.join(__dirname, "..", "web", "index.html"));
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
