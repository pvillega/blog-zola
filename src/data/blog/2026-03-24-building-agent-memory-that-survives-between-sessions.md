---
author: Pere Villega
pubDatetime: 2026-03-24
title: "Building Agent Memory That Survives Between Sessions"
draft: false
tags:
  - ai
  - claude-code
  - developer-tools
  - productivity
  - context-engineering
  - knowledge-management
description: Every Claude Code session starts from scratch. Teresa Torres's three-layer context system and Patrick Zandl's claudecode-kb offer two practical approaches to the same insight -- memory is a design problem, not a tooling problem. The key habit is stop and capture, turning every repeated explanation into a reusable context file.
series: "ai-developer-evolution"
seriesOrder: 5
seriesSection: "working-with-agents"
---

Every Claude Code session starts from scratch. Yesterday's decisions, solved bugs, chosen frameworks, architectural reasoning: all gone. You explain the same context again. And again. And again.

If you're working on a single project, this is annoying. With 50+ projects, it's unsustainable. Knowledge gained in one project would be useful in another but there's no transfer mechanism. It's like having an extremely capable colleague who gets amnesia every evening.

Sound familiar? This post is about fixing that, or at least discussing how some people are trying to work around this issue.

I've been digging into how practitioners actually solve this problem. Not the theoretical "just use RAG" handwaving, but what people running real businesses and managing real codebases do every day. Two approaches stood out, and they converge on the same insight: memory is a design problem, not a tooling problem.

## Teresa Torres's Three-Layer Context System

Teresa Torres, the product discovery coach behind [Product Talk](https://www.producttalk.org/), developed a system for Claude Code that I think is the most practical approach to this problem. She described it in detail in her blog post ["Stop Repeating Yourself: Give Claude Code a Memory"](https://www.producttalk.org/give-claude-code-a-memory/) and in [Peter Yang's interview](https://creatoreconomy.so/p/automate-your-life-with-claude-code-teresa-torres) from December 2025. The system works because it's built around a principle that's easy to state and hard to internalise: every conversation starts from scratch, so you have to create memory deliberately.

### Layer 1: Global CLAUDE.md

This lives in `~/.claude/CLAUDE.md` and loads into every single session, regardless of what you're working on. Torres keeps it extremely short: personal working preferences (always plan before doing anything, never just act), planning at multiple levels, feedback preferences, and an index of reference context files.

The critical design decision: keep it short. This file loads even when she asks Claude if her dog can eat a particular food or when brainstorming Christmas gifts. None of that needs business context. If you've ever wondered why your Claude sessions feel sluggish despite a modest CLAUDE.md, this might be why. Everything in that file competes for attention on every single task.

What does NOT go here: business details, product descriptions, team information, audience profiles. All of that belongs in reference files loaded on demand.

### Layer 2: Project CLAUDE.md

Each project folder has its own CLAUDE.md with project-specific rules. Torres treats each folder as a separate Claude "project"; launching Claude inside that folder gives it that folder's context.

Her tasks folder CLAUDE.md explains how the task system works, how tagging works, how Obsidian front matter is structured. Her writing folder CLAUDE.md says "Claude is a thought partner, not a writer. You're acting as an editor." It also includes: "At the start of every session, read my writing style guide."

The separation matters more than you'd think. Different folders have completely different rules. The tasks CLAUDE.md doesn't know about writing workflows. The writing CLAUDE.md doesn't know about the task system. This prevents context contamination, a problem I suspect most of us have encountered without realising what caused it.

### Layer 3: Reference Context Files

A folder of small, focused markdown files, each covering one topic. Business profile. Target audience. Marketing profile. Differentiators. Company overview. Business model. Personal profile. Individual product files.

These are NOT loaded automatically. The global CLAUDE.md contains an index telling Claude where to find them and to only load what's relevant. If Torres says "let's work on the landing page for my story-based customer interview course," Claude already knows where to find details about the course, the company, and the target audience without being told.

The key: small and many. Torres deliberately creates many small files rather than few large ones, so she can mix and match. Claude loads only what the current task needs. This is progressive disclosure applied to agent context, and it's the same principle that makes well-designed APIs pleasant to work with.

## The Stop and Capture Rule

This is Torres's simplest and most actionable advice, and the one that changed how I think about context:

Whenever you find yourself explaining context to Claude, stop. Ask: "Am I going to explain this again?" If yes, and it usually is, don't just explain it for this session. Pause and capture it in a file.

She never sat down to create all her context files in one session. Instead, whenever she felt the need to explain context, she'd stop: "Claude, you need to know about my differentiators. Maybe interview me." Claude asks questions, she answers, Claude writes the file. Over time, the collection grew organically. Every conversation became a context-building opportunity.

Before I encountered this, I kept meaning to "properly document" my context and never finding the time. The stop-and-capture approach reframes it entirely. You're not carving out dedicated setup time; you're capturing context as a natural byproduct of working.

## The End-of-Session Ritual

At the end of every working session, Torres asks: "What did you learn about working with me? What should we add to the context files?"

This creates a conversation about where new information should go. Information about preferences and working style goes in CLAUDE.md. Information about business, products, or audience goes in a reference file. She actively resists Claude's tendency to jam everything into CLAUDE.md. Business information gets redirected to the appropriate reference file, keeping the global file lean.

There's a nice maintenance trick here too: Torres never manually updates the index of context files. Every time she has Claude add a new file, she says "What index needs to be updated?" Claude figures it out. The profile/index file was entirely maintained by Claude over time. Delegation done right.

## The claudecode-kb Implementation

Patrick Zandl took these principles and built a pragmatic, developer-focused implementation called [claudecode-kb](https://github.com/tangero/claudecode-kb) (he wrote about the reasoning [in this blog post](https://github.com/tangero/claudecode-kb/blob/main/blog-post-en.md)). It's file-based, git-versioned, no database, no API, no build step. Just files and conventions, which is exactly the right level of complexity for this problem.

The architecture is clean:

```
my-knowledgebase/
├── preferences/          # Coding style, tools, stack
├── patterns/             # Reusable architectural patterns
├── snippets/             # Reusable code pieces
├── troubleshooting/      # Solved problems
├── projects/             # Per-project notes + session logs
├── memory/               # Decisions with reasoning
└── scripts/              # Helper scripts
```

Zandl's key insight: his original 170-line CLAUDE.md had Claude ignoring instructions in the middle. This isn't a quirk, it's a well-documented phenomenon. Liu et al.'s ["Lost in the Middle"](https://arxiv.org/abs/2307.03172) (TACL 2024) showed that LLMs perform best when relevant information is at the beginning or end of the input context, with significant degradation for information placed in the middle. The U-shaped attention curve is real, and your 200-line CLAUDE.md is suffering from it.

Zandl cut to 40 lines: just routing, pointing to where detailed instructions live. Performance improved immediately.

This is the router pattern. Your CLAUDE.md is a table of contents, not an encyclopaedia.

### JSONL Session Logs

Each project has a human-readable overview file and a machine-readable session log in JSONL format. JSONL is append-only, Claude can add lines but can't accidentally overwrite months of history.

This matters more than it sounds. Zandl actually lost data when using a Markdown log. Claude rewrote the entire file instead of appending. JSONL makes this structurally impossible. A schema line at the top defines the format. Claude reads the last 5 lines for recent context. It's a small design decision that prevents a very real failure mode (and one that, I'd wager, most people discover the hard way).

### Episodic Memory

The `memory/decisions.jsonl` file captures major technical decisions with date, the decision itself, context, options considered, reasoning, and outcome. Not just "we use Next.js" but _why_. So Claude can reference past reasoning for similar decisions instead of giving generic advice unsuitable to a scenario.

## Getting Started Without Overwhelm

Torres offers three tips for people who want to start but feel overwhelmed. I find the first one is the most important:

**You don't have to get here overnight.** Start with the stop and capture rule. Build context files incrementally, not all at once. The worst thing you can do is spend a weekend building an elaborate system and then never maintain it.

**Minimum viable structure.** At a minimum, separate work and personal folders. That's it. Add more structure as you go.

**Think like a delegator.** For every task you do, ask: "How can Claude help?" Some tasks you want augmented: Claude as research assistant while you write. Some you want automated: pushing receipts to your finance system. The distinction drives what context Claude needs.

Torres notes she has 10 years of experience delegating to a human admin, which made her naturally good at identifying what to delegate and writing standard operating procedures. The same skill transfers directly: if you wouldn't hand a task to a new employee without explaining the process, don't hand it to Claude without context.

## The Weekly Review

Zandl recommends 15 minutes every Friday to review the knowledge base. Check what's stale, what's missing, what needs updating. Without this, the system rots. Stale context is arguably worse than no context, because it gives Claude confident-sounding but outdated guidance.

This is maintenance, and maintenance isn't glamorous. But the alternative is explaining the same context to Claude from scratch every Monday morning. The 15 minutes compound.

## So What Now?

The systems, all of them, are built on one insight: memory is a design problem. Every Claude Code session starts from scratch by default. The question isn't whether to build memory, but how deliberately you do it.

If you take away one thing from this post, let it be the stop-and-capture rule. Next time you find yourself explaining something to Claude that you've explained before, stop. Capture it. Future you, the one who doesn't have to explain it again next Tuesday, will thank you.
