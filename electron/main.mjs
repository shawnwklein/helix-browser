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

function activeView() {
  return visibleTab ? pages.get(visibleTab) : null;
}

function layout() {
  if (!win) return;
  const view = activeView();
  for (const [id, v] of pages) {
    const show = Boolean(view && id === visibleTab && bounds && bounds.width > 4);
    const children = win.contentView.children || [];
    const attached = children.includes(v);
    if (show && !attached) win.contentView.addChildView(v);
    if (!show && attached) win.contentView.removeChildView(v);
    if (show) v.setBounds(bounds);
  }
}

function viewFor(tabId) {
  let view = pages.get(tabId);
  if (view) return view;
  view = new WebContentsView({
    webPreferences: {
      sandbox: true,
      partition: "persist:helix",
      backgroundThrottling: false,
    },
  });
  const ua = view.webContents
    .getUserAgent()
    .replace(/Electron\/\S+/, "Helix/0.1");
  view.webContents.setUserAgent(ua);
  view.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
  view.webContents.on("did-navigate", () => sendMeta(tabId, view));
  view.webContents.on("did-navigate-in-page", () => sendMeta(tabId, view));
  view.webContents.on("page-title-updated", () => sendMeta(tabId, view));
  view.webContents.on("did-finish-load", () => sendMeta(tabId, view));
  pages.set(tabId, view);
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
  ipcMain.on("helix:show", (_e, { tabId, url }) => {
    const view = viewFor(tabId);
    if (url) view.webContents.loadURL(url);
    visibleTab = tabId;
    layout();
  });
  ipcMain.on("helix:close", (_e, tabId) => {
    const view = pages.get(tabId);
    if (view && win) {
      try {
        win.contentView.removeChildView(view);
      } catch {
        /* already detached */
      }
      view.webContents.close();
    }
    pages.delete(tabId);
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
