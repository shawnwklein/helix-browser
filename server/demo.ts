import type { HelixMeta, StreamHandlers } from "./grok";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function typeEssay(text: string, onDelta: (t: string) => void) {
  const words = text.split(/(\s+)/);
  let buf = "";
  for (const w of words) {
    buf += w;
    if (buf.length > 28) {
      onDelta(buf);
      buf = "";
      await sleep(18);
    }
  }
  if (buf) onDelta(buf);
}

export type DemoPack = {
  meta: HelixMeta;
  essay: string;
  citations: { n: number; url: string; title: string; kind: "web" | "x" }[];
};

const FUSION: DemoPack = {
  meta: {
    title: "Fusion is a real engineering program now. It is not a power company.",
    verdict:
      "In 2026 fusion is a capital-intensive hardware race with genuine scientific wins — and almost no evidence it is a commercial electricity business this decade.",
    holds: [
      "Net-gain shots and private high-field magnets moved fusion out of eternal '30 years away' standup comedy.",
      "The bottleneck is now materials, duty cycle, tritium, and grid interconnection — not whether plasma physics is a hoax.",
      "Most 'fusion startup' headlines are still fundraising documents wearing lab coats.",
    ],
    fails: [
      "The claim that commercial fusion power is 'here' or 'just around the corner' is a category error: a successful shot is not a plant.",
      "Q > 1 in a laser shot does not mean the wall-plug plant is energy-positive.",
      "Treating every SPARC / ITER / stellarator update as equivalent progress collapses three different machines into one myth.",
    ],
    tensions: [
      "High-field tokamaks can be small and fast; they also punish materials harder.",
      "Governments want a climate story; founders want a valuation story; physicists want another shot.",
      "Tritium supply and breeding are talked about less than plasma temperature, which is the tell.",
    ],
    followups: [
      "What is the honest earliest year a private device could put electrons on a real grid?",
      "Who actually has a tritium breeding plan that is not a slide?",
      "How much of 2024–2026 fusion capital is still sitting in money-market funds?",
      "What does the live argument on X get wrong that the papers do not?",
    ],
    nextTabs: [
      { title: "ITER — what the machine is for", url: "https://www.iter.org/" },
      { title: "CFS / SPARC", url: "https://cfs.energy/" },
      { title: "NIF ignition explainer", url: "https://lasers.llnl.gov/" },
      {
        title: "Wikipedia: Fusion power",
        url: "https://en.wikipedia.org/wiki/Fusion_power",
      },
    ],
  },
  essay: `Commercial fusion is having a real decade. It is not having a product.

The last few years produced things fusion never had: a laser facility that demonstrated target gain at NIF, private companies winding high-temperature superconducting magnets at fields the old national labs treated as science fiction, and a press corps that learned the word "tokamak." [[1]](https://lasers.llnl.gov/)[[2]](https://cfs.energy/) That is not nothing. It is also not a kilowatt-hour.

**What actually holds.** Plasma physics is no longer the cartoon bottleneck. Net-gain experiments, better magnets, and a generation of people who have shipped cryogenics and neutron diagnostics mean the field is an engineering program with a physics remainder — not a physics program with an engineering remainder. ITER is still the slow public cathedral; SPARC-class private machines are the bet that you can punish a smaller plasma harder and get to a Q that's interesting before your investors age out. [[3]](https://www.iter.org/)[[4]](https://en.wikipedia.org/wiki/Fusion_power)

**What the press-release industry sells.** "Ignition," "limitless energy," and "the sun in a bottle" are doing rhetorical work. NIF's gain is measured against the energy delivered to the target, not the wall plug of the facility. A startup "breaking ground" is often a lease, a render, and a Series B. If a company cannot tell you its assumed capacity factor, its first-wall material, and where the tritium comes from, it is not a power company. It is a story about a power company.

**The unfashionable constraints.** Tritium does not grow on supermarket shelves. A deuterium-tritium plant has to breed its own fuel in a blanket that also has to survive a neutron flux that makes structural steel remember it is mortal. Materials, not headlines, decide whether a device is a scientific instrument or a thermal plant. Duty cycle is the other silent killer: a beautiful pulse that happens twice a day is a strobe light, not a baseload.

**On X.** The live argument is mostly tribal — climate fatalism vs. techno-optimism vs. fission people who would like everyone to remember that boiling water with known physics still works. Useful signal exists (magnet photos, delayed first-plasma dates, people who have actually stood in a torus hall). The rest is engagement bait wearing a neutron.

The sharp remaining uncertainty is not "is fusion possible." It is whether the first device that looks like a plant is a 2030s science project with a visitor center, or a 2040s industrial artifact that a grid operator will put in a dispatch stack. Until someone publishes a breeding ratio, a real first wall, and a boring interconnection queue position, Helix's working stance is: take the science seriously, and take the electricity claims as a hypothesis that has not been run.
`,
  citations: [
    { n: 1, url: "https://lasers.llnl.gov/", title: "NIF / LLNL", kind: "web" },
    { n: 2, url: "https://cfs.energy/", title: "Commonwealth Fusion Systems", kind: "web" },
    { n: 3, url: "https://www.iter.org/", title: "ITER", kind: "web" },
    { n: 4, url: "https://en.wikipedia.org/wiki/Fusion_power", title: "Fusion power", kind: "web" },
    { n: 5, url: "https://x.com/search?q=fusion%20energy", title: "X · fusion energy", kind: "x" },
  ],
};

const HELIX_ITSELF: DemoPack = {
  meta: {
    title: "Helix is a second reader, not a nicer address bar.",
    verdict:
      "The point of this browser is not to search. It is to keep a spine of argument while Chromium does what Chromium is for.",
    holds: [
      "Grok is the only model in Helix — research, page reading, doubt, forks, and X pulse.",
      "Tabs are evidence. The Continuum is the actual document you are writing with your attention.",
      "Scout and Skeptic are two uses of Grok, not two personalities for decoration.",
    ],
    fails: [
      "A chat sidebar bolted onto Chrome is not an AI browser. It is a browser with a chat sidebar.",
      "Citations without an opposing case are a bibliography, not a judgment.",
    ],
    tensions: [
      "Live Chromium pages fight being embedded; Helix Reader is the honest fallback, not a compromise of taste.",
      "An agent that clicks for you is powerful and easy to make unaccountable — Ghost Hands stay visible.",
    ],
    followups: [
      "Open a live page and run Skeptic on its load-bearing claim.",
      "Fork this thesis and see if Helix will refuse to invent a controversy.",
      "Add an xAI key and rerun a question against the real web and X.",
    ],
    nextTabs: [
      { title: "xAI docs", url: "https://docs.x.ai" },
      { title: "xAI console", url: "https://console.x.ai" },
      { title: "Grok", url: "https://grok.com" },
    ],
  },
  essay: `Helix is a Chromium browser whose chrome is Grok.

Perplexity taught people to expect an answer with footnotes. That is a good habit. It is also still a search engine: you leave the web, you get a page of Grok-shaped text, you maybe click a source. Helix inverts it. You stay in a real browser — Electron wrapping Chromium, with a WebContentsView for the actual site — and Grok is the other strand of the helix: reading with you, marking what holds, forking what shouldn't be allowed to pass unchallenged, and remembering that you have seen this claim before.

**Continuum.** Closing a tab should not close the thought. The spine on the left is the research document Helix keeps while you wander: originating question, findings, tensions, echoes.

**Split Mind.** Scout extracts. Skeptic stress-tests, and is allowed to use the live web and X to do it. If they agree, that's information. If they don't, that's the job.

**Fork.** Any thesis can be inverted on purpose. If the original is simply right, the fork should fail out loud.

This demo orbit is running without a live key, so the fusion starter is canned. Paste an xAI key in Settings and Helix will use grok-4.6 with web_search and x_search on every research tab.
`,
  citations: [
    { n: 1, url: "https://docs.x.ai", title: "xAI docs", kind: "web" },
    { n: 2, url: "https://x.ai", title: "xAI", kind: "web" },
    { n: 3, url: "https://grok.com", title: "Grok", kind: "web" },
  ],
};

export function matchDemo(query: string): DemoPack {
  const q = query.toLowerCase();
  if (
    q.includes("fusion") ||
    q.includes("tokamak") ||
    q.includes("sparc") ||
    q.includes("iter")
  ) {
    return FUSION;
  }
  if (
    q.includes("helix") ||
    q.includes("this browser") ||
    q.includes("what is grok")
  ) {
    return HELIX_ITSELF;
  }
  return {
    meta: {
      title: "Demo orbit — live Grok is one key away",
      verdict:
        "Helix can shape this question, but it will not invent a researched answer without grok-4.6 on the live web.",
      holds: [
        "The chrome, Continuum, Split Mind, Fork, Mosaic, and Reader all work in demo orbit.",
        "With an xAI key, this same query would run grok-4.6 with web_search and x_search.",
      ],
      fails: [
        "A fluent fake brief would be the opposite of the product.",
      ],
      tensions: [
        "Demo orbit must feel like Helix without lying about the world.",
      ],
      followups: [
        "Try the fusion starter to see a full Split Mind answer.",
        "Open Wikipedia and run Scout / Skeptic on the page.",
        "Add a key in Settings, then ask this again.",
      ],
      nextTabs: [
        { title: "xAI console", url: "https://console.x.ai" },
        {
          title: "Wikipedia",
          url: "https://en.wikipedia.org/wiki/Main_Page",
        },
      ],
    },
    essay: `You asked: **${query.trim()}**

Helix is in demo orbit. There is no xAI key in this process, so I will not pretend to have searched the web or X for that.

What would happen with a key:

1. The omnibox treats this as an *ask*, not a URL.
2. grok-4.6 runs with \`web_search\` and \`x_search\`.
3. A metadata spine arrives first — title, verdict, what holds, what fails, tensions.
4. The essay streams with inline citations. X is a first-class section, not a footnote.
5. You can Fork the verdict, open sources as Chromium tabs, or pin findings onto the Continuum.

Open **Settings**, paste a key from [console.x.ai](https://console.x.ai), and rerun. Or launch the fusion starter to walk the full interface on canned research that is honest about being canned.
`,
    citations: [
      { n: 1, url: "https://console.x.ai", title: "xAI console", kind: "web" },
      { n: 2, url: "https://docs.x.ai", title: "xAI docs", kind: "web" },
    ],
  };
}

export async function playDemo(
  pack: DemoPack,
  h: StreamHandlers,
  signal?: AbortSignal,
) {
  const aborted = () => signal?.aborted;
  h.onStatus("searching_web", "Searching the live web…");
  await sleep(320);
  if (aborted()) return;
  h.onStatus("searching_x", "Listening to X…");
  await sleep(280);
  if (aborted()) return;
  h.onStatus("reading", "Reading sources…");
  await sleep(240);
  if (aborted()) return;
  h.onStatus("writing", "Weighing the argument…");
  h.onMeta(pack.meta);
  for (const c of pack.citations) h.onCitation(c);
  await typeEssay(pack.essay, (t) => {
    if (!aborted()) h.onDelta(t);
  });
  if (!aborted()) h.onDone({ responseId: "demo" });
}

export const DEMO_MIND: Record<string, string> = {
  scout: `**Thesis.** The page is doing one job: convince you of a single frame, then furnish just enough furniture that it feels researched.

**Load-bearing bits.** Dates, named institutions, and figures that would hurt if they were wrong. Everything else is mood.

**Novel vs recycled.** If you have been on the web for more than a week, you have seen this structure. The novelty, if any, is in the numbers and the unforced admissions.

**Who it's for.** People who want to feel informed at the speed of a scroll.

**Next.** Run Skeptic on the strongest number. Fork the thesis. Check whether your Continuum already contains this claim — Echo will say so.`,
  skeptic: `**Weakest claim.** The one that does the most moral work with the least measurement. If a sentence could survive swapping its subject for the opposite subject, it is rhetoric.

**Missing.** Base rates, comparison classes, who paid for the work, and the outcome that would make the author look foolish.

**Counter-case.** Assume the author is sincere and still wrong in the way their incentives predict. That is usually cleaner than assuming a conspiracy.

**Falsifier.** A number from a disinterested primary source that does not fit the frame.

Demo orbit: Skeptic is showing you the *shape* of doubt. Give Helix a key and this voice will actually leave the page.`,
  numbers: `| Figure | Unit | Date | Who | What it actually measures |
| --- | --- | --- | --- | --- |
| — | — | — | this page | Demo orbit cannot certify figures without Grok on the live document |

If a number has no date and no measurer, treat it as a gesture.`,
  compare: `**Agree.** All open tabs want you to believe the frame is settled.

**Contradict.** They quietly disagree on dates, denominators, and who counts as an expert.

**Closest to primary evidence.** The tab that links to a document you can open, not a recap of a recap.

**Settling question.** What would a bored specialist say is the actual bottleneck?

Demo orbit comparison — live Grok will read the real extracts.`,
};

export function demoFork(claim: string): DemoPack {
  return {
    meta: {
      title: `Fork: ${claim.slice(0, 72) || "the opposing case"}`,
      verdict:
        "A fork is only honest if it can lose. In demo orbit, this is the shape of an opposing case — not a researched rebuttal.",
      holds: [
        "The original claim may be carrying more certainty than the evidence.",
        "There is usually a comparison class the original author declined to mention.",
      ],
      fails: [
        "Manufacturing a controversy when the claim is simply correct.",
        "Attacking the speaker instead of the measurement.",
      ],
      tensions: [
        "Is the disagreement about facts, frames, or incentives?",
      ],
      followups: [
        "What measurement would make this fork collapse?",
        "Which primary source does the original quietly ignore?",
        "Add a key and rerun the fork on the live web.",
      ],
      nextTabs: [{ title: "xAI console", url: "https://console.x.ai" }],
    },
    essay: `**Original claim.** ${claim || "—"}

The strongest honest opposition is not "nuh-uh." It is: the claim smuggles a frame (time horizon, denominator, who counts) and then wins inside that frame.

In demo orbit Helix will not fabricate sources against it. With a key, Fork runs grok-4.6 with web_search and x_search and is instructed to *fail the fork* if the original is simply right.

That failure mode is the product. A browser that can always argue both sides is a debate club. A browser that sometimes refuses is a reader.
`,
    citations: [
      { n: 1, url: "https://docs.x.ai", title: "xAI docs", kind: "web" },
    ],
  };
}
