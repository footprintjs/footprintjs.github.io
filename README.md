# footprintjs ecosystem

**Connected runtime evidence for people and coding agents.**

→ [footprintjs.github.io](https://footprintjs.github.io/)

This repository hosts the static ecosystem homepage. Its **Product**, **Technical** and **Business** views describe the same libraries for different readers. Switching views changes the wording, not package links, dependencies or release status.

## Start with the question

An application can run without an LLM and still keep a useful execution record. Build a workflow from named stages, tracked state and explicit decisions; enable the required recorders before it runs. A developer or coding agent can then inspect the recorded dependencies behind an unexpected outcome, test a hypothesis and verify the repair with a regression test and another run.

FootPrint captures configured execution evidence. Foottrace queries supported records. An LLM can explain established findings; it does not invent the execution history or fill missing links. Capture gaps, unsupported scope and unknown outcomes remain visible. Recorded dependencies alone do not prove correctness, compliance or real-world cause.

## Two ways in, one kind of record

The home page is built round one idea. A record is notes with edges between them, so you can walk back from a result to only the notes behind it. There are two ways to get those edges.

- **Stitched by default.** Software built in the pattern keeps its edges as it runs.
- **Stitched in code.** You cannot rebuild React, a trainer or a device fleet, so you stitch programmatically and give every gap its reason. HACI Footprint and VizFootprint bind a framework's events into actions. Datapipeline does the same at the collector level on on-prem devices. footprintjs-ml is a hybrid: FootPrint coordinates the workflow and your trainer stays yours.

Either way you get a stitched record you can walk back and replay. A side effect is an audit trail for security monitoring. Default stitching can still have gaps, and record formats and capture limits differ by library.

The last shot of the film draws this as a solar system. Every planet is a library, and the rings carry the two categories.

## Libraries

| Category | Libraries | Role |
| --- | --- | --- |
| Foundations | [FootPrint](https://github.com/footprintjs/footPrint), [Foottrace](https://github.com/footprintjs/foottrace) | Named stages, tracked scope, explicit decisions and recorders; record primitives, deterministic readers, replay, cause and impact queries, optional W3C PROV-O export in JSON-LD. |
| Stitched by default | [AgentFootprint](https://github.com/footprintjs/agentfootprint), [Blueprint](https://www.npmjs.com/package/footprint-blueprint), [Smallbusiness](https://www.npmjs.com/package/smallbusiness-footprint), [StoryReel](https://github.com/footprintjs/storyreel) | Agents, platform capabilities, commerce and teaching films, all on FootPrint. |
| Stitched in code | [HACI Footprint](https://github.com/footprintjs/hcifootprint), [VizFootprint](https://github.com/footprintjs/vizfootprint) (Alpha), [Datapipeline](https://www.npmjs.com/package/footprintjs-datapipeline), [footprintjs-ml](https://github.com/footprintjs/footprintjs-ml) (Beta, hybrid) | Framework apps, visual exploration, device collectors and orchestrated ML workflows, with their own contracts. |
| Walk back and replay | [Flow Lens](https://github.com/footprintjs/explainable-ui), [Why Lens](https://github.com/footprintjs/agentfootprint-lens), [Story Lens](https://github.com/footprintjs/agentThinkingUI) | Views over supported workflow and agent records. |
| Also in the family | [StoryDeck](https://github.com/footprintjs/storydeck), [ContextFootprint](https://github.com/footprintjs/contextfootprint) | Structured content views; assertion identity and conflicts. |

These are different libraries, with different dependencies and maturity. They do not all require AgentFootprint. A shared design principle does not imply interchangeable record formats or automatic evidence across library boundaries.

## Editing and previewing

There is no build step or framework dependency.

- `film.js` is the film: motion graphics written as code on one canvas. `draw(t, clock)` is a pure function of the cursor, so scrolling is scrubbing. It has two tracks that take turns on a split screen: on the left a flowchart runs and writes its notes, on the right a pile stays a pile and is stitched in code. They join for the walk back, and the scrubber draws the same shape. Timing lives in `T`, layout in `Film.layout()`, the caption schedule in `CHAPTERS` and the scrubber's stops in `RAIL`.
- `ecosystem-views.json` owns the words: the three views, the film's captions and node labels, the library tiles, links and the orbit's rings.
- `ecosystem-view-v4.js` renders the tiles, the working loop and the limits line, and owns the view switch.
- `index.html` keeps the accessible fallback text, metadata and structure. Every caption is real text. Without JavaScript the film section is ordinary reading order, and with reduced motion each caption holds one still frame from the same film.
- `styles-v4.css` owns the layout and the light and dark tokens, including the `--f-*` colours the film reads.
- `assets/logo.svg` is the source of the mark. The favicons and the PNG logo copies, including those in `blog/`, `primer/` and `storydeck/`, are rendered from it. `assets/og.png` is drawn by the film engine on the joined record, just after the gap appears.

What crawlers read is written into the static files, because many of them do not run JavaScript. Each view's `hero.line` splits its title into the parts that light as the film plays, and the script fails if they stop matching. After changing `ecosystem-views.json`, run `node scripts/seo-sync.mjs`. It writes the library list, the questions and the structured data into `index.html`, and regenerates `llms.txt`. Update `sitemap.xml` when a page is added, and list only real pages there, not redirects.

Keep the fallback text and metadata consistent with the default Product view. New tiles need copy in all three views. Switching views changes the wording, not links, dependencies, positions or release status. Show missing evidence as unknown, and do not claim measured savings without reproducible evidence. The film's numbers describe its illustrative example and nothing else. Do not advertise unreleased features: a planet goes in the solar system only when its library is public.

Preview with a local static server, for example `python3 -m http.server 8123`. Check all three views, both themes, a narrow viewport, keyboard navigation and reduced motion. `FootprintFilm.seek(t)` in the console jumps to any frame. Syntax can be checked with `node --check film.js`.

Open a feature PR and complete the owner's review gate before merging. GitHub Pages deploys the merged site; check the deployment and live content before reporting it updated.
