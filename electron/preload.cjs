const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("helix", {
  isDesktop: true,
  navigate: (url) => ipcRenderer.send("helix:navigate", url),
  goBack: () => ipcRenderer.send("helix:back"),
  goForward: () => ipcRenderer.send("helix:forward"),
  reload: () => ipcRenderer.send("helix:reload"),
  stop: () => ipcRenderer.send("helix:stop"),
  setContentBounds: (rect) => ipcRenderer.send("helix:bounds", rect),
  showPage: (tabId, url) => ipcRenderer.send("helix:show", { tabId, url }),
  hidePage: () => ipcRenderer.send("helix:hide"),
  closePage: (tabId) => ipcRenderer.send("helix:close", tabId),
  extractText: () => ipcRenderer.invoke("helix:extract"),
  onPageEvent: (cb) => {
    const fn = (_e, ev) => cb(ev);
    ipcRenderer.on("helix:page", fn);
    return () => ipcRenderer.removeListener("helix:page", fn);
  },
});
