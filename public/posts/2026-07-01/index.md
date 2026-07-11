---
title: I Stopped Paying Per Token by Routing Claude Code Through OpenRouter's Free Models
date: 2026-07-01
---

There's a moment that happens to almost every developer who starts using AI tools seriously.

You're a week in. Claude Code is wired into your workflow. You're shipping faster, debugging smarter, and genuinely feeling the productivity lift. Then you open your API dashboard and see a number you weren't quite expecting.

That was me.

I wasn't doing anything reckless — no runaway loops, no massive batch jobs. Just steady, daily use of Claude Code and Claude Desktop for real work. But "steady daily use" against a paid API endpoint adds up faster than it feels like it should.

So I started thinking about what I actually needed: a way to keep using the same tools, with the same workflows, without the mental overhead of watching usage costs on every session.

### The idea: route everything through a proxy

[LiteLLM](https://github.com/BerriAI/litellm) is a project that acts as a unified proxy for language model APIs. You point your clients at it, and it handles the routing under the hood — to whatever backend you configure. What caught my attention was that [OpenRouter](https://openrouter.ai) offers free-tier access to NVIDIA's Nemotron model family. These models are surprisingly capable, and the free tier is real — not a trial, not a 7-day window.

The catch is you need a small wallet deposit (~$10) to unlock the free-tier rate limits. That $10 buys you roughly 1,000 requests per day on free-tier models, effectively indefinitely. For daily Claude Code use, that's a genuinely good deal.

The other piece of the puzzle: Nemotron models come in three sizes — Nano (30B), Super (120B), and Ultra (550B) — which map naturally to the Haiku / Sonnet / Opus tier structure that Claude tools already understand. That made it possible to do something clean: keep using Claude Code exactly as-is, with the same model names, and have the proxy silently route to the right Nemotron tier behind the scenes.

### What I built

[litellm-compose](https://github.com/nishantapatil3/litellm-compose) is an opinionated Docker Compose setup with five services:

- **LiteLLM Proxy** — the gateway that handles all model routing and guardrails, running on port 4000
- **PostgreSQL** — stores LiteLLM configuration and virtual key state
- **Redis** — response caching with a 10-minute TTL, so repeated queries don't burn requests
- **Prometheus** — usage metrics so I can actually see what's happening
- **SearXNG** — a self-hosted metasearch engine on port 8081, available as a tool for agents

The model mapping is transparent by design. When Claude Code asks for `claude-sonnet-4-6`, the proxy routes to `openrouter/nvidia/llama-3.1-nemotron-super-70b-v1:free`. Same pattern for Haiku → Nano and Opus → Ultra. No client changes needed.

### The guardrail I added

One thing I learned early: the fastest way to burn through free-tier capacity is uploading large documents. A PDF with a long transcript, a big log file, a chunky data export — these chew through tokens fast and don't respect "free tier" semantics the way a normal chat turn does.

So I wrote a custom pre-call guardrail that blocks document and PDF uploads at the proxy level, before the request ever leaves your machine. Images still go through fine — routed to the Haiku/Nano tier which handles vision — but the file-upload path that burns through context budget gets cut off cleanly.

It's a small thing, but it's the kind of protection that makes a setup actually sustainable over months of daily use rather than just for a week.

### Getting it running

This is the part I'm most satisfied with. The whole setup comes down to three steps:

1. Copy `.env.example` to `.env` and drop in your OpenRouter API key and a master key you generate
2. Run `task up` (or `docker compose up -d` if you don't have Task installed)
3. Point Claude Code and Claude Desktop at `http://localhost:4000` with your master key

That's it. Everything else — PostgreSQL initialization, Redis startup, Prometheus scrape config, SearXNG — comes up automatically. Health checks run on all services. Data persists across restarts through named volumes so you don't lose your configuration state when you update a container.

The Claude Code configuration is literally three environment variables:

```json
"env": {
  "ANTHROPIC_BASE_URL": "http://localhost:4000",
  "ANTHROPIC_API_KEY": "your-master-key",
  "CLAUDE_CODE_MAX_OUTPUT_TOKENS": "16000"
}
```

And then Claude Code works exactly as you'd expect. Same commands, same model names, same experience. You just stop watching the API cost meter.

### Why I'm sharing this

I built this for myself, but the setup pattern felt broadly useful. A lot of developers hit the same wall I did — AI tools are genuinely worth using every day, but "genuinely worth using every day" and "Anthropic's production API pricing" can be an uncomfortable combination when you're not at a company footing the bill.

The free-tier Nemotron models aren't identical to Claude. There are tasks where you'll notice the difference. But for the large majority of coding assistance, explanation, and debugging sessions that make up daily AI-assisted development, they're more than capable. And the zero-friction deployment means there's no ongoing maintenance tax — no servers to manage, no bills to monitor, no quotas to manually track.

It runs on your laptop. It starts with your laptop. You mostly forget it's there.

### Try it

```bash
git clone https://github.com/nishantapatil3/litellm-compose
cd litellm-compose
cp .env.example .env
# add your OpenRouter key and a generated master key
task up
```

Project: [github.com/nishantapatil3/litellm-compose](https://github.com/nishantapatil3/litellm-compose)

If you've been looking for a sustainable way to use Claude Code daily without the billing anxiety, this was built for exactly that.