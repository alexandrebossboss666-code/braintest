const { app, BrowserWindow, shell } = require("electron");
const path = require("path");

function createWindow(){
  const win = new BrowserWindow({
    width: 1180, height: 780, minWidth: 760, minHeight: 560,
    backgroundColor: "#ffffff",
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  win.removeMenu();
  win.loadFile(path.join(__dirname, "editeur.html"));
  // Les liens externes s'ouvrent dans le navigateur, jamais dans le logiciel
  win.webContents.setWindowOpenHandler(({ url }) => {
    if(/^https?:/.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => { if(!url.startsWith("file:")) e.preventDefault(); });
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => { if(BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if(process.platform !== "darwin") app.quit(); });
