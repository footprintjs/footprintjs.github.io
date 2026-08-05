# footprintjs

### The flowchart pattern for software — systems that explain themselves.

**→ [footprintjs.github.io](https://footprintjs.github.io/)**

A flowchart is how a person draws a system: a box for each step, an arrow for what
happens next. footprintjs makes your code *be* that flowchart — so the thing that
runs is the thing you read, and every run records **why** it did what it did.

One pattern, all the way up the stack: from a backend pipeline to an AI agent.

---

## The ecosystem — as its own flowchart

The projects come in three groups: the **engine** that works behind the scenes, the
**interface** layer your users see, and the **monitoring** UIs you watch a run through.

```mermaid
flowchart TD
    subgraph ENG["Engine — works behind the scenes"]
        F["footprintjs<br/>core engine"]
        A["agentfootprint<br/>agentic framework"]
    end
    subgraph INT["Interface — what your users see"]
        TR(["The Footprint Trail<br/>a pattern, not a package"])
        H["HACI Footprint<br/>agent-operable apps"]
        V["VizFootprint<br/>visual analysis"]
    end
    subgraph MON["Monitoring — watch it run"]
        E["Explainable UI<br/>for footprintjs"]
        L["Lens<br/>for agentfootprint"]
        T["Thinking UI<br/>role replay"]
    end

    F -->|powers| A
    F -.->|same idea, zero shared code| TR
    TR --> H
    TR --> V
    F -->|renders| E
    A -->|renders| L
    A -->|replays| T
```

### Engine — works behind the scenes

| Project | Role | Links |
|---|---|---|
| **footprintjs** | the flowchart pattern for backend code | [home](https://footprintjs.github.io/footPrint/) · [repo](https://github.com/footprintjs/footPrint) · [npm](https://www.npmjs.com/package/footprintjs) |
| **agentfootprint** | AI agents that trace every LLM call back to its cause | [home](https://footprintjs.github.io/agentfootprint/) · [docs](https://footprintjs.github.io/agentfootprint/docs) · [repo](https://github.com/footprintjs/agentfootprint) · [npm](https://www.npmjs.com/package/agentfootprint) |

### Interface — what your users see

| Project | Role | Links |
|---|---|---|
| **HACI Footprint** *(beta)* | makes an app agent-operable — its real capabilities as a typed skill graph over MCP, with permissions and confirmation gates | [home](https://footprintjs.github.io/hcifootprint/) · [repo](https://github.com/footprintjs/hcifootprint) · [npm](https://www.npmjs.com/package/hcifootprint) · [37s demo](https://youtu.be/vx5amF94ipI) |
| **VizFootprint** *(alpha)* | keeps every branch of a visual analysis — human or agent — comparable and replayable | [repo](https://github.com/footprintjs/vizfootprint) · [the trail pattern](https://footprintjs.github.io/blog/the-trail-pattern/) |

### Monitoring — watch it run

| Project | Role | Links |
|---|---|---|
| **Explainable UI** | visualize a footprintjs run | [demo](https://footprintjs.github.io/explainable-ui/) · [repo](https://github.com/footprintjs/explainable-ui) · [npm](https://www.npmjs.com/package/footprint-explainable-ui) |
| **Lens** | debug an agentfootprint run | [repo](https://github.com/footprintjs/agentfootprint-lens) · [npm](https://www.npmjs.com/package/agentfootprint-lens) |
| **Thinking UI** | replay an agent run for non-developers | [demo](https://footprintjs.github.io/agentThinkingUI/) · [repo](https://github.com/footprintjs/agentThinkingUI) · [npm](https://www.npmjs.com/package/agentthinkingui) |

---

## Principles

1. **Collect at traversal time.** Reads, writes, and decisions are captured structurally as the run executes — no manual logging.
2. **One canonical footprint.** The trace *is* the execution record — built inline, never rebuilt after the fact.
3. **You choose the lens.** Metrics, narrative, visualization, agent debugging — every tool composes on the same record.

> Inline recording is truth. Post-processing is reconstruction.

---

## Built for agents

The hardest question in an agentic system is *why did it do that?* — which context,
which tool, which decision led to the output. The flowchart pattern answers it by
construction: **agentfootprint** is the pattern's first real implementation, and the
rest of the stack renders and replays that record for engineers and non-developers alike.

---

<sub>This repo is the source of **[footprintjs.github.io](https://footprintjs.github.io/)** — a static, no-build page. Edit, commit, push to `main`; GitHub Pages rebuilds.</sub>

<sub>open source · [MIT](https://github.com/footprintjs/footPrint/blob/main/LICENSE) · © 2024–present [Sanjay Krishna Anbalagan](https://github.com/sanjay1909)</sub>
