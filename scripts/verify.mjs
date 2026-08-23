import { app, BrowserWindow, session } from "electron";
import fs from "node:fs";
import path from "node:path";

app.disableHardwareAcceleration();
app.commandLine.appendSwitch("no-sandbox");
app.commandLine.appendSwitch("disable-gpu");

const out = path.resolve("scripts/shots");
fs.mkdirSync(out, { recursive: true });
const log = [];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function shot(win, name) {
  const img = await win.webContents.capturePage();
  const dest = path.join(out, `${name}.png`);
  fs.writeFileSync(dest, img.toPNG());
  log.push(`shot ${name} ${img.getSize().width}x${img.getSize().height}`);
  return dest;
}

async function evalJs(win, code) {
  return win.webContents.executeJavaScript(code, true);
}

app.whenReady().then(async () => {
  const errors = [];
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    show: false,
    backgroundColor: "#0B0A09",
    webPreferences: { sandbox: true, contextIsolation: true },
  });
  win.webContents.on("console-message", (_e, level, message) => {
    if (level >= 2) errors.push(message);
  });
  win.webContents.on("did-fail-load", (_e, code, desc, url) => {
    errors.push(`fail-load ${code} ${desc} ${url}`);
  });

  await session.defaultSession.clearStorageData();
  await win.loadURL("http://127.0.0.1:5173/");
  await sleep(1400);
  const homeText = await evalJs(win, "document.body.innerText");
  const home = homeText.toLowerCase();
  if (!home.includes("read the web")) {
    throw new Error("home missing hero: " + homeText.slice(0, 500));
  }
  if (!home.includes("demo orbit") && !home.includes("grok live")) {
    throw new Error("home missing chrome: " + homeText.slice(0, 500));
  }
  if (!home.includes("with a spine")) throw new Error("home missing lede");
  await shot(win, "01-constellation");

  const starterClicked = await evalJs(
    win,
    `(() => {
      const b = [...document.querySelectorAll('.starter')].find(el => el.innerText.includes('fusion'));
      if (!b) return false;
      b.click();
      return true;
    })()`,
  );
  if (!starterClicked) throw new Error("fusion starter not found");
  await sleep(2200);
  let answer = "";
  for (let i = 0; i < 20; i++) {
    answer = await evalJs(win, "document.body.innerText");
    if (answer.includes("What holds") && answer.includes("engineering program")) break;
    await sleep(250);
  }
  if (!answer.toLowerCase().includes("what holds")) {
    throw new Error("answer missing split board: " + answer.slice(0, 400));
  }
  await shot(win, "02-answer-fusion");

  await evalJs(
    win,
    `document.querySelector('.btn.fork')?.click()`,
  );
  await sleep(1800);
  const forkText = await evalJs(win, "document.body.innerText");
  if (!forkText.toLowerCase().includes("fork")) throw new Error("fork did not open");
  await shot(win, "03-fork");

  await evalJs(win, `document.querySelector('.tab-add')?.click()`);
  await sleep(400);
  const urlTyped = await evalJs(
    win,
    `(() => {
      const input = document.querySelector('.omnibox input');
      const native = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      native.call(input, 'https://example.com');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('.omnibox')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      const form = document.querySelector('.omnibox');
      form.requestSubmit?.();
      return input.value;
    })()`,
  );
  log.push(`omnibox ${urlTyped}`);
  await sleep(1800);
  const pageText = await evalJs(win, "document.body.innerText");
  await shot(win, "04-page-live");

  const reader = await evalJs(
    win,
    `(() => {
      const b = [...document.querySelectorAll('.seg button')].find(el => el.innerText.includes('Reader'));
      if (!b) return 'no-reader';
      b.click();
      return 'clicked';
    })()`,
  );
  log.push(`reader ${reader}`);
  await sleep(1200);
  const readerText = await evalJs(win, "document.body.innerText");
  if (!readerText.includes("Helix Reader") && !readerText.includes("Example Domain")) {
    log.push("reader text missing example — may still be extracting");
  }
  await shot(win, "05-reader");

  await evalJs(win, `document.querySelector('[title="Mosaic"]')?.click()`);
  await sleep(500);
  const mosaic = await evalJs(win, "document.body.innerText");
  if (!mosaic.includes("Mosaic") && !mosaic.includes("Lay the argument")) {
    log.push("mosaic label missing");
  }
  await shot(win, "06-mosaic");

  await evalJs(win, `document.querySelector('.demo-pill, .live-pill')?.click()`);
  await sleep(400);
  const settings = await evalJs(win, "document.body.innerText");
  if (!settings.toLowerCase().includes("give helix a grok key")) {
    throw new Error("settings missing: " + settings.slice(0, 400));
  }
  await shot(win, "07-settings");
  await evalJs(win, `document.querySelector('.modal .btn')?.click()`);
  await sleep(250);

  await evalJs(win, `document.querySelector('.ico[title="Split Mind"]')?.click()`);
  await sleep(350);
  await evalJs(
    win,
    `[...document.querySelectorAll('button')].find(b => /run scout/i.test(b.innerText))?.click()`,
  );
  await sleep(900);
  await shot(win, "08-split-mind");

  win.setSize(390, 844);
  await sleep(200);
  await evalJs(win, `document.querySelector('.tab-add')?.click()`);
  await sleep(600);
  await shot(win, "09-mobile");

  const report = {
    homeHasHero: home.includes("with a spine"),
    answerHasHolds: answer.toLowerCase().includes("what holds"),
    answerHasFails:
      answer.includes("What doesn’t") || answer.toLowerCase().includes("what doesn't"),
    forkOpened: forkText.toLowerCase().includes("fork"),
    pageBar: pageText.toLowerCase().includes("live chromium"),
    settings: settings.toLowerCase().includes("console.x.ai"),
    errors,
    log,
  };
  fs.writeFileSync(path.join(out, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (!report.homeHasHero || !report.answerHasHolds || !report.settings) {
    app.exit(1);
    return;
  }
  app.exit(0);
}).catch((err) => {
  console.error(err);
  app.exit(1);
});
