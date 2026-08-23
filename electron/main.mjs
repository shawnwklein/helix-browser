import {
  app,
  BrowserWindow,
  WebContentsView,
  ipcMain,
  shell,
} from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startHelixHost } from "./host.mjs";

app.commandLine.appendSwitch("no-sandbox");
app.disableHardwareAcceleration();
app.setName("Helix");
app.setAppUserModelId("com.helix.browser");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** @type {Map<string, { view: WebContentsView, partition: string }>} */
const pages = new Map();
let win = null;
let visibleTab = null;
let bounds = null;
let host = null;

function sendMeta(tabId, view) {
  if (!win) return;
  win.webContents.send("helix:page", {
    type: "navigate",
    tabId,
    url: view.webContents.getURL(),
    title: view.webContents.getTitle(),
    canGoBack: view.webContents.canGoBack(),
    canGoForward: view.webContents.canGoForward(),
  });
}

function destroyView(tabId) {
  const rec = pages.get(tabId);
  if (!rec) return;
  if (win) {
    try {
      win.contentView.removeChildView(rec.view);
    } catch {
      /* already detached */
    }
  }
  try {
    rec.view.webContents.close();
  } catch {
    /* gone */
  }
  pages.delete(tabId);
}

function activeView() {
  return visibleTab ? pages.get(visibleTab)?.view : null;
}

function layout() {
  if (!win) return;
  const rec = visibleTab ? pages.get(visibleTab) : null;
  const view = rec?.view;
  for (const [id, r] of pages) {
    const show = Boolean(view && id === visibleTab && bounds && bounds.width > 4);
    const children = win.contentView.children || [];
    const attached = children.includes(r.view);
    if (show && !attached) win.contentView.addChildView(r.view);
    if (!show && attached) win.contentView.removeChildView(r.view);
    if (show) r.view.setBounds(bounds);
  }
}

function viewFor(tabId, partition) {
  const part = partition || "persist:helix-face-personal";
  let rec = pages.get(tabId);
  if (rec && rec.partition !== part) {
    destroyView(tabId);
    rec = undefined;
  }
  if (rec) return rec.view;
  const view = new WebContentsView({
    webPreferences: {
      sandbox: true,
      partition: part,
      backgroundThrottling: false,
    },
  });
  const ua = view.webContents
    .getUserAgent()
    .replace(/Electron\/\S+/, "Helix/0.2");
  view.webContents.setUserAgent(ua);
  view.webContents.setWindowOpenHandler(({ url }) => {
    const dest = url || "";
    if (!dest || dest === "about:blank") {
      return {
        action: "allow",
        overrideBrowserWindowOptions: {
          width: 980,
          height: 760,
          backgroundColor: "#0B0A09",
          autoHideMenuBar: true,
          webPreferences: { sandbox: true, partition: part },
        },
      };
    }
    if (/^https?:/i.test(dest)) {
      if (win) {
        win.webContents.send("helix:open-in-face", {
          url: dest,
          partition: part,
        });
      }
      return { action: "deny" };
    }
    shell.openExternal(dest);
    return { action: "deny" };
  });
  view.webContents.on("did-navigate", () => sendMeta(tabId, view));
  view.webContents.on("did-navigate-in-page", () => sendMeta(tabId, view));
  view.webContents.on("page-title-updated", () => sendMeta(tabId, view));
  view.webContents.on("did-finish-load", () => sendMeta(tabId, view));
  pages.set(tabId, { view, partition: part });
  return view;
}

async function resolveChromeUrl() {
  if (!app.isPackaged) {
    return process.env.HELIX_URL || "http://127.0.0.1:5173";
  }
  const { handleApi } = await import("./helix-api.mjs");
  host = await startHelixHost({
    distDir: path.join(__dirname, "../dist"),
    handleApi,
  });
  return host.url;
}

async function createWindow() {
  const chromeUrl = await resolveChromeUrl();
  win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 980,
    minHeight: 640,
    backgroundColor: "#0B0A09",
    title: "Helix",
    icon: path.join(__dirname, "../build/icon.png"),
    autoHideMenuBar: true,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "hidden",
    trafficLightPosition: { x: 14, y: 12 },
    frame: process.platform === "darwin",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.on("resize", layout);
  win.on("closed", () => {
    win = null;
    pages.clear();
  });

  await win.loadURL(chromeUrl);
}

app.whenReady().then(async () => {
  ipcMain.on("helix:bounds", (_e, rect) => {
    bounds = rect;
    layout();
  });
  ipcMain.on("helix:hide", () => {
    visibleTab = null;
    layout();
  });
  ipcMain.on("helix:show", (_e, { tabId, url, partition, force }) => {
    const view = viewFor(tabId, partition);
    const current = view.webContents.getURL();
    const empty = !current || current === "about:blank";
    if (url && (force || empty)) view.webContents.loadURL(url);
    visibleTab = tabId;
    layout();
  });
  ipcMain.on("helix:close", (_e, tabId) => {
    destroyView(tabId);
    if (visibleTab === tabId) visibleTab = null;
  });
  ipcMain.on("helix:back", () => {
    const v = activeView();
    if (v?.webContents.canGoBack()) v.webContents.goBack();
  });
  ipcMain.on("helix:forward", () => {
    const v = activeView();
    if (v?.webContents.canGoForward()) v.webContents.goForward();
  });
  ipcMain.on("helix:reload", () => activeView()?.webContents.reload());
  ipcMain.on("helix:stop", () => activeView()?.webContents.stop());
  ipcMain.handle("helix:extract", async () => {
    const v = activeView();
    if (!v) return "";
    return v.webContents.executeJavaScript(
      "document.body && document.body.innerText ? document.body.innerText.slice(0, 24000) : ''",
    );
  });

  await createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) void createWindow();
  });
});

app.on("window-all-closed", () => {
  host?.server.close();
  if (process.platform !== "darwin") app.quit();
});
