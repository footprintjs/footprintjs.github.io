# footprintjs ecosystem

**Connected runtime evidence for people and coding agents.**

→ [footprintjs.github.io](https://footprintjs.github.io/)

This repository hosts the static ecosystem homepage. Its **Product**, **Technical** and **Business** views describe the same libraries for different readers. Switching views changes the wording, not package links, dependencies or release status.

## Start with the question

An application can run without an LLM and still keep a useful execution record. Build a workflow from named stages, tracked state and explicit decisions; enable the required recorders before it runs. A developer or coding agent can then inspect the recorded dependencies behind an unexpected outcome, test a hypothesis and verify the repair with a regression test and another run.

FootPrint captures configured execution evidence. Foottrace queries supported records. An LLM can explain established findings; it does not invent the execution history or fill missing links. Capture gaps, unsupported scope and unknown outcomes remain visible. Recorded dependencies alone do not prove correctness, compliance or real-world cause.

## Libraries

| Layer | Libraries | Role |
| --- | --- | --- |
| Execution | [FootPrint](https://github.com/footprintjs/footPrint) | Named workflow stages, tracked scope, explicit decisions and runtime recorders. |
| Records | [Foottrace](https://github.com/footprintjs/foottrace) | Record primitives, deterministic readers, replay, cause/impact queries and optional W3C PROV-O export in JSON-LD. |
| Agents | [AgentFootprint](https://github.com/footprintjs/agentfootprint) | Agent execution with context, model-call and tool evidence. |
| Content | [StoryDeck](https://github.com/footprintjs/storydeck) | Article, scroll and presentation views; FootPrint integration is optional. |
| Media | [StoryReel](https://github.com/footprintjs/storyreel) | A FootPrint production pipeline and making-of record for teaching films. |
| Platform | [Blueprint](https://www.npmjs.com/package/footprint-blueprint) | Modular platform capabilities with shared execution evidence. |
| Commerce | [Smallbusiness](https://www.npmjs.com/package/smallbusiness-footprint) | Configurable commerce workflows built on Blueprint. |
| Data | [Datapipeline](https://www.npmjs.com/package/footprintjs-datapipeline) | Collection and derivation flows using FootPrint and Foottrace. |
| Interaction | [HACI Footprint](https://github.com/footprintjs/hcifootprint), [VizFootprint](https://github.com/footprintjs/vizfootprint) | Application capabilities and recorded visual exploration, with their own contracts. |
| Viewers | [Flow Lens](https://github.com/footprintjs/explainable-ui), [Why Lens](https://github.com/footprintjs/agentfootprint-lens), [Story Lens](https://github.com/footprintjs/agentThinkingUI) | Views over supported workflow and agent records. |

These are different libraries, with different dependencies and maturity. They do not all require AgentFootprint. A shared design principle does not imply interchangeable record formats or automatic evidence across library boundaries.

## Editing and previewing

There is no build step or framework dependency.

- `ecosystem-views.json` owns the three views, library cards, links and solar-system labels.
- `ecosystem-view-v3.js` renders the cards, selected core map and development loop using that data.
- `index.html` keeps the accessible fallback text, metadata, navigation and optional workflow demo.
- `styles-v3.css` owns the shared layout and light/dark theme.
- `hero-orrery.js` and the vendored Three.js module provide the existing decorative hero.

Keep the fallback text and metadata consistent with the default Product view. New cards need copy in all three views. Show missing evidence as unknown; do not claim measured savings without reproducible evidence, or advertise unreleased features.

Preview with a local static server, for example `python3 -m http.server 8080`, and check all three views, keyboard navigation, light/dark themes, a narrow viewport and the expanded demo. JavaScript syntax can be checked with `node --check ecosystem-view-v3.js`.

Open a feature PR and complete the owner's review gate before merging. GitHub Pages deploys the merged site; check the deployment and live content before reporting it updated.
