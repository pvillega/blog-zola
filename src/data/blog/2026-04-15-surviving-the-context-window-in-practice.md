---
author: Pere Villega
pubDatetime: 2026-04-15
title: "Surviving the Context Window in Practice"
draft: false
tags:
  - ai
  - ai-developer-evolution
  - context-engineering
  - agents
  - claude-code
  - productivity
  - software-engineering
description: "The context window is a budget, not a feature. Auto-compaction hides the bill until the agent starts hallucinating. Practical tactics for staying under budget: scope per session, offload to disk, dispatch subagents for research, and clear aggressively between phases. The goal isn't a bigger window; it's needing less of it."
series: "ai-developer-evolution"
seriesOrder: 8
seriesSection: "working-with-agents"
---

A few weeks back I watched an agent cheerfully forget a CLAUDE.md instruction it had loaded forty minutes earlier. Not ignored. Forgotten. Autocompact had quietly decided the rule wasn't relevant to the task at hand and summarised it out of existence. The resulting refactor broke three conventions I'd spent a week establishing.

In the [previous post on context engineering](./2026-04-08-context-engineering-the-skill-that-replaced-prompt-engineering), I argued that the real skill isn't prompt engineering but curating the information your agent operates in. Then in [The Only Workflow That Works](./2026-04-13-the-only-workflow-that-works), we walked through the discipline of separating planning from execution, of treating the spec as the core artefact. There's a gap between understanding these principles and surviving a full working session with them. You know that context matters. You know that plans should live in files. The question is what happens when the context window fights back.

You get 1,000,000 tokens in theory. That sounds generous, and when the jump from 200K to 1M landed many people loudly declared the context management problem solved. I'd argue they are wrong. Run `/context` right now in a session and see how much is actually free. If you've loaded a few MCPs, some skills, a CLAUDE.md hierarchy, and had a conversation of any length, you might be surprised at how much is already in use. Then there is the stark reality that [models degrade when the context window goes over a certain threshold](https://research.trychroma.com/context-rot), becoming dumber.

A million tokens is generous, but the usable part isn't infinite, and the economics of how context gets consumed haven't changed.

## The Economics of Context

Every interaction with Claude Code has a hidden cost structure that many people don't realise. Each time you send a new request, the entire previous conversation is sent along with it. Caching and other optimisations exist, but in general: you don't just send a query of 10 tokens. You send a query of 10 tokens, then get a response of 30 tokens. The next query is again 10 tokens, plus the 40 tokens from the previous exchange. And so on. The cost accelerates, not linearly but quadratically.

Tool use compounds this. Every web search result, every file read, every MCP output lands in your context window and stays there. [Mert Köseoğlu's analysis of Context Mode](https://mksg.lu/blog/context-mode) puts concrete numbers on this: a single Playwright snapshot costs 56 KB. One access log: 45 KB. After 30 minutes with 81+ tools active, a considerable percentage of your context can be gone. With a 1M window that's more catastrophic than it was at 200K: the cost acceleration is identical, over a window five times bigger, on a cost curve that grows quadratically. You're hitting the wall later, not avoiding it, and draining your account much faster to get there.

## Why Autocompact Is Dangerous

Claude Code's autocompact kicks in at about 95% of your context window. It summarises the conversation using an LLM, which is lossy compression. And the summary decides what's relevant to your CURRENT task.

This creates the failure mode from the opening paragraph (and I suspect it catches most people at least once): Claude forgetting the CLAUDE.md context it loaded at the start of the session because compaction decided it wasn't relevant to the task at hand. Your carefully crafted instructions, your architectural constraints, your "never do X" rules, all summarised away. Gone. With a 1M window you'll hit autocompact later, sure, but when it does fire, the amnesia is just as total.

Once autocompacted, reliability drops. [Trail of Bits](https://github.com/trailofbits/claude-code-config) puts it bluntly in their Claude Code configuration guide: compaction is a sign the task was too large. Scope work to fit a single context window.

My recommendation: disable autocompact. Use `/clear` instead. It's more manual, but at least you control what gets lost. Is it annoying? Absolutely. Is it better than your agent silently forgetting your architecture decisions mid-refactor? Also absolutely.

## Context Length equals Performance

One might argue that with a 1M context window, the need to compact at all, or `/clear`, has evaporated. Seems reasonable at first glance: load all the relevant information, do the task in one shot, there's enough room, so why worry.

Thankfully [Anthropic itself](https://claude.com/blog/1m-context-ga) answers that question in their post announcing the 1M context window in General Availability. Scroll down to the section titled "Long context that holds up" (I don't seem to be able to link to it directly). Per their own tests, Opus 4.6 has a 91.9% chance of finding relevant data in its context when it has used 256k tokens. Notice that this isn't 100%; there's a chance (barely 8%) of it not finding relevant context at that point.

With 1M tokens in context, the chance is 78.3%. That's a 13.6% drop between the two points, drawn as linear on the chart but with no guarantee that it behaves like that in practice. And that's Opus. Sonnet drops from 90.6% to 65.1%. A 25.5% drop. Even trusting that the degradation is linear, if you fill half the context window in Sonnet, you have a 20% chance of it not finding the data you need to work.

Given how many people complain about Claude Code forgetting instructions in `CLAUDE.md`, and their context windows aren't close to 200k tokens: do you want to risk it? The complaints happen when, in theory, you "only" have around a 10% chance of not finding the relevant context. I'd argue this all points towards regularly clearing the context window, instead of trusting compacting steps. Better performance, lower cost.

## The Research → Plan → Implement Split

This is the most important context management technique, and it's deceptively simple: save your work to files before clearing.

Research fills context with tool results, file reads, web searches. By the time you have a solid plan, you might have only a fraction of context remaining. If you then ask Claude to implement in the same session, the implementation happens in a cramped, degraded context. This was painful at 200K. At 1M it's more forgiving, but the principle hasn't changed, especially for complex tasks that involve reading dozens of files and searching the web extensively.

The miss rates compound. Parts of your spec won't be seen. Implementation gaps get filled with whatever the training set suggests instead. And you'll be resending the research-phase tokens on every turn, paying for them twice. Don't. Save the plan to a file. `/clear`. Load the plan. Implement fresh.

Store things to disk religiously. Plans, research findings, intermediate results. The benefits compound, and it isn't just about costs: you can restart if the agent crashes, you can recover from tangents and weird agent loops, you can stop and resume work on a task from any point. The plan file is your save game. I've started treating this as non-negotiable, and the tooling I favour (the [superpowers plugin](https://github.com/obra/superpowers)) also uses files for each phase. The five seconds it takes to save a plan has saved me from restarting from scratch more times than I can count. And yes, "just save your work" sounds like advice from 1995. Some lessons are timeless.

## Subagents: Fresh Context as a Resource

So you've saved your plan and cleared context. What about tasks that are inherently context-hungry, such as web research, documentation reading, or test running? You can't avoid the work. But you can isolate it.

Each subagent gets a new context window, minus MCP tools, the prompt, and any tool definitions. It does the work and returns just the result. Your main thread stays clean. I'd argue this is an underused feature in Claude Code right now. Many people coming from other providers don't realise that Claude can do this, as it wasn't supported in those environments until recently.

The pattern is straightforward: main agent as orchestrator, subagents as workers. Delegate context-heavy tasks (web research, documentation reading, test running) and the main conversation accumulates only the results, not the intermediate work. You can even run subagents in parallel: the main thread kicks off multiple tasks and waits. It's not unlike having a small team of specialists, each with their own area and their own clean desk.

Practitioners who've embraced this pattern keep focused subagent files in `~/.claude/agents/`: planner, architect, tdd-guide, code-reviewer, security-reviewer, doc-updater, and so on. Each agent is scoped with specific tool permissions, as limited tools equal a more focused execution. Personally, I prefer fewer "personas", as I trust in the underlying capabilities of Opus/Sonnet. But this is a preference and, arguably, not a good practice.

The main constraint of this approach is that subagents can't call other subagents. One level deep only; no matryoshka possible. But that's enough for most workflows, and if you really need such structures you can rely on [agentic teams](https://code.claude.com/docs/en/agent-teams) instead. Something for a later chapter.

## LSP as Context Saver

I covered LSP setup in [the environment post](./2026-03-18-your-first-day-with-claude-code), but it deserves emphasis here for its context management impact. [Karan Bansal's analysis](https://karanbansal.in/blog/claude-code-lsp/) quantifies the results.

Without LSP, "Where is this function?" becomes grep across 847 matches, Claude reads dozens of files to narrow down, and this turns into massive context consumption. With an LSP: exact file and line obtained in 50ms, Claude reads one file. The context savings are enormous for any navigation-heavy task.

Self-correcting edits amplify this. After every file edit, LSP pushes diagnostics. Claude fixes type errors and missing imports in the same turn. Without LSP, each fix is a round trip that consumes extra context as the agent locates the relevant code. With LSP, it's one step.

For refactoring: `findReferences` finds every reference semantically, not just text matches. No more "grep found 47 of 52 actual usages" situations. So you get better context management, and fewer bugs due to missed usages.

If you haven't set this up yet for your programming language, you should. It's probably one of the highest-ROI improvements you can make to your Claude Code workflow. I'm not exaggerating.

## Context Mode MCP

One of the main culprits, traditionally, when it comes to context hoarding has been MCP. Recent "just in time" loading optimisations help, but an issue remains: once an MCP is loaded, all its tools are loaded. The GitHub MCP is 5,000 tokens. Doesn't feel like a lot, except they're sent on every turn. And that's just one MCP. Hence the trend to move towards Skills instead.

What if you could keep using MCP tools but dramatically reduce their context footprint? Turns out, someone built exactly that.

Mert Köseoğlu built [Context Mode](https://github.com/mksglu/claude-context-mode), an MCP server that sits between Claude Code and tool outputs, compressing results. The approach works by spawning an isolated subprocess for each `execute` call. Scripts run code, capture stdout, and only stdout enters the conversation. Raw data never leaves the sandbox.

[Cloudflare's Code Mode](https://blog.cloudflare.com/code-mode-mcp/) is a similar kind of utility, which compresses tool definitions by replacing entire tool catalogues with a `search()` and `execute()` pattern, reducing definition overhead from tens of thousands of tokens to roughly 1,000 regardless of API surface.

As mentioned, the majority opinion seems to be that Skills are preferable to MCPs, but I've also read well-argued counterarguments about why we should still use MCPs. Including (but not limited to) the fact that MCPs are called more reliably than Skills, at least for now. So these tools may be of interest, to slow down the rate at which you approach a context window size that forgets the data you care about.


## The Practical Reality

So what does all this add up to in daily practice? A handful of habits.

Disable autocompact and use `/clear` instead, but save your plan to a file first. Don't use the `/compact` command either. You can't be sure it preserves the context you want, and you have a double chance of error: the chance of compaction missing data plus the standard chance of the agent not finding the data when needed. Rely on files instead.

Be deliberate about which MCPs you load per task: don't load Playwright when you're doing backend work, don't load database MCPs when you're working on the frontend. Use `@` to toggle them. [Eric Holmes makes a compelling case](https://ejholmes.github.io/2026/02/28/mcp-is-dead-long-live-the-cli.html) that for many tasks, CLIs are the better choice: cheaper, debuggable, and composable via pipes. Prefer CLI where possible. The output is typically more concise, and you control what's returned. Tools like [RTK](https://www.rtk-ai.app) improve on that CLI output.


Kill contaminated context aggressively: one mission, one session. If things go sideways, press Esc twice to rollback to a previous prompt, or `/clear` and start fresh.

Beware what you install. Run `/context` after adding any new skill, MCP, or configuration. I've seen popular tool collections consume over 50% of a 200K context window before you've typed your first prompt. In the new 1M environment, that's still 10% gone. That's not an environment; that's a trap.

When recovery is needed: Esc Esc to rollback, `/rewind` to go back to a previous state, `/clear` when context is truly contaminated. Try to avoid `/compact` at all costs, unless there's no other choice (when you've really filled that window and want to save a summary to a file).

## The Bigger Picture

The context window is your most precious resource, even at 1M tokens. Every technique in this post exists because context is finite and every token matters. But this isn't really about tokens; it's about attention. The agent's attention budget works exactly like yours and mine: the more noise in the environment, the worse the signal. A 1M window full of irrelevant tool outputs isn't five times better than a 200K window full of irrelevant tool outputs. Same mess, just bigger.

The developers I see getting the best results aren't the ones with the fanciest setups. They're the ones who treat context like a finite budget, who clear aggressively, who save to disk compulsively, who ask "does the agent actually need this information right now?" before providing it.

That discipline transfers, incidentally, to how you write specs, how you structure repositories, and how you communicate with humans. Being deliberate about what you put in front of a thinker is a universally useful skill. The agent just made the bill visible.
