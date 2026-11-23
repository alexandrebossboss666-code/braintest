const { app, BrowserWindow, shell, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");

let mainWin = null;

function createWindow(){
  mainWin = new BrowserWindow({
    width: 1180, height: 780, minWidth: 760, minHeight: 560,
    backgroundColor: "#ffffff",
    icon: path.join(__dirname, "icon.png"),
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  mainWin.removeMenu();
  mainWin.loadFile(path.join(__dirname, "editeur.html"));
  // Les liens externes s'ouvrent dans le navigateur, jamais dans le logiciel
  mainWin.webContents.setWindowOpenHandler(({ url }) => {
    if(/^https?:/.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  mainWin.webContents.on("will-navigate", (e, url) => { if(!url.startsWith("file:")) e.preventDefault(); });
}

function setupUpdates(){
  // Mises à jour automatiques (uniquement dans le logiciel installé)
  if(!app.isPackaged) return;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on("update-downloaded", () => {
    const r = dialog.showMessageBoxSync(mainWin, {
      type: "info",
      buttons: ["Redémarrer maintenant", "Plus tard"],
      defaultId: 0, cancelId: 1,
      title: "Mise à jour",
      message: "Une nouvelle version de l’éditeur est prête.",
      detail: "Redémarre le logiciel pour l’installer. Tes tests sont conservés."
    });
    if(r === 0) autoUpdater.quitAndInstall();
  });
  autoUpdater.on("error", () => {});
  autoUpdater.checkForUpdates().catch(() => {});
}

app.whenReady().then(() => {
  createWindow();
  setupUpdates();
  app.on("activate", () => { if(BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if(process.platform !== "darwin") app.quit(); });
