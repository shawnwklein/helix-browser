# Helix

A Grok-native Chromium browser. One strand is the web. The other is Grok.

## Download for Windows

Get the latest `.exe` from **[Releases](https://github.com/shawnwklein/helix-browser/releases/latest)**:

- **[Helix-0.1.0-portable.exe](https://github.com/shawnwklein/helix-browser/releases/latest)** — no installer. Download and run.
- **Helix-Setup-0.1.0.exe** — optional installer (Start Menu + desktop shortcut).

Windows SmartScreen may warn because the build is unsigned. Choose **More info → Run anyway**.

Paste an [xAI API key](https://console.x.ai) in Settings (the **Demo orbit** pill) for live Grok. Without a key, Helix still opens in demo orbit.

Helix is not a search engine with a URL bar glued on, and it is not Chrome with a chat sidebar. It is a real Chromium shell (Electron `WebContentsView`) whose chrome is Grok throughout: the omnibox, the page, the session, and the argument you are in the middle of.

## The idea

Perplexity taught people to expect an answer with footnotes. That is a good habit. It is still a *visit*: you leave the web, you get a page of model-shaped text, you maybe click a source.

Helix inverts it.

- **Tabs are evidence.** Closing one should not close the thought.
- **The Continuum is the document.** A spine of the originating question, what holds, what fails, and the tensions still live.
- **Split Mind is two uses of Grok, not two mascots.** Scout extracts. Skeptic leaves the page and checks the load-bearing claims against the live web and X.
- **Fork is an honest opposing case.** If the original thesis is simply right, the fork is instructed to fail out loud. A browser that can always argue both sides is a debate club.
- **Echo remembers.** “You have seen this claim before.”
- **Mosaic lays the argument on a table** instead of hiding it in a tab strip.
- **X is a first-class plane**, not a social afterthought — Grok’s actual advantage.
- **Ghost Hands stay visible.** Scout / Skeptic / Numbers / Fork are actions you can see, not silent clicking.

The new-tab page is a Constellation, not a search box pretending to be a homepage. The omnibox is Ask-or-Go: a URL navigates Chromium; a thought runs grok-4.6 with `web_search` and `x_search`; a single ambiguous token offers both.

## Architecture

```
Renderer (React chrome)
  ├── Constellation / Answer / Helix Reader / Mosaic
  └── Omnibox, Continuum, Split Mind

Main process (Electron)
  └── WebContentsView per page tab  → real Chromium

Local API (Vite middleware, key never in the page world)
  └── xAI Responses API  grok-4.6 + web_search + x_search + code_interpreter
```

Web preview (`npm run web`) uses the same chrome. Live sites that refuse to be framed fall through to **Helix Reader** (Readability extract). Desktop (`npm run desktop`) is the real Chromium surface.

Grok is the only model. SpaceXAI / xAI, `XAI_API_KEY`, `https://api.x.ai/v1`.

## Run it

```bash
npm install
cp .env.example .env   # paste XAI_API_KEY from https://console.x.ai
npm run web            # chrome at http://localhost:5173
npm run desktop        # Electron wrapping Chromium
```

Without a key, Helix stays in **demo orbit**: the chrome is real, the fusion starter is a canned research object that does not pretend to be live, and Settings will take a key for the session.

### Shortcuts

| | |
| --- | --- |
| `⌘/Ctrl L` | Focus omnibox |
| `⌘/Ctrl Enter` | Force Ask |
| `⌘/Ctrl T` / `W` | New / close tab |
| `⌘/Ctrl K` | Command palette |
| `⌘/Ctrl Shift C` | Continuum |
| `⌘/Ctrl Shift M` | Split Mind |
| `/scout` `/skeptic` `/fork` `/mosaic` `/reader` | Omnibox commands |

## What “Grok throughout” actually means

| Surface | Grok |
| --- | --- |
| Omnibox | Intent: go / ask / command |
| Answer tab | grok-4.6 + live web + X, metadata spine, inline citations |
| Split Mind | Scout on the page; Skeptic with search tools |
| Fork | Opposing research tab, allowed to lose |
| Continuum | Findings and open questions lifted from each answer |
| Echo | Local memory of claims you have already met |
| Helix Reader | Clean document so the model has a page to hold |
| Mosaic | The continuum, spatial |
| Ghost Hands | Visible next moves, not a hidden agent |

Built as a workspace named `GrokBrowser`. The product is Helix.
