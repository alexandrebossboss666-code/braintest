const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("api", {
  loggedIn: () => ipcRenderer.send("logged-in"),
  showLogin: () => ipcRenderer.send("show-login"),
  logout: () => ipcRenderer.send("logout")
});
