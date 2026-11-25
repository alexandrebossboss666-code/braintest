const { app, BrowserWindow, shell, dialog, ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");

let loginWin = null, mainWin = null;
const icon = path.join(__dirname, "icon.png");
const prefs = () => ({ contextIsolation: true, nodeIntegration: false, sandbox: true, preload: path.join(__dirname, "preload.js") });

function lockWindow(win){
  win.removeMenu();
  // Les liens externes s'ouvrent dans le navigateur, jamais dans le logiciel
  win.webContents.setWindowOpenHandler(({ url }) => {
    if(/^https?:/.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => { if(!url.startsWith("file:")) e.preventDefault(); });
}

function openLogin(){
  loginWin = new BrowserWindow({
    width: 440, height: 640, resizable: false, maximizable: false, show: false,
    backgroundColor: "#ffffff", icon, autoHideMenuBar: true, webPreferences: prefs()
  });
  lockWindow(loginWin);
  loginWin.loadFile(path.join(__dirname, "login.html"));
  loginWin.on("closed", () => { loginWin = null; });
}

function openMain(){
  mainWin = new BrowserWindow({
    width: 1180, height: 780, minWidth: 760, minHeight: 560,
    backgroundColor: "#ffffff", icon, autoHideMenuBar: true, webPreferences: prefs()
  });
  lockWindow(mainWin);
  mainWin.loadFile(path.join(__dirname, "editeur.html"));
  mainWin.on("closed", () => { mainWin = null; });
}

// La fenêtre de connexion reste cachée tant qu'elle ne sait pas si une session existe déjà
ipcMain.on("show-login", () => { if(loginWin) loginWin.show(); });
ipcMain.on("logged-in", () => { if(!mainWin) openMain(); if(loginWin) loginWin.close(); });
ipcMain.on("logout", () => { if(!loginWin) openLogin(); if(mainWin) mainWin.close(); });

function setupUpdates(){
  // Mises à jour automatiques (uniquement dans le logiciel installé)
  if(!app.isPackaged) return;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on("update-downloaded", () => {
    const opts = {
      type: "info",
      buttons: ["Redémarrer maintenant", "Plus tard"],
      defaultId: 0, cancelId: 1,
      title: "Mise à jour",
      message: "Une nouvelle version de l’éditeur est prête.",
      detail: "Redémarre le logiciel pour l’installer. Tes tests sont conservés."
    };
    const parent = mainWin || loginWin;
    const r = parent ? dialog.showMessageBoxSync(parent, opts) : dialog.showMessageBoxSync(opts);
    if(r === 0) autoUpdater.quitAndInstall();
  });
  autoUpdater.on("error", () => {});
  autoUpdater.checkForUpdates().catch(() => {});
}

app.whenReady().then(() => {
  openLogin();
  setupUpdates();
});
app.on("window-all-closed", () => { if(process.platform !== "darwin") app.quit(); });
