---
author: Pere Villega
pubDatetime: 2026-03-23
title: "The One File That Makes or Breaks Your AI Workflow"
draft: false
tags:
  - ai
  - claude-code
  - developer-tools
  - productivity
  - context-engineering
description: CLAUDE.md is the single file that determines whether your AI coding agent shines or flounders. Research shows auto-generated context files hurt performance — what works is a minimal, human-curated briefing containing only what the agent cannot discover on its own.
series: "ai-developer-evolution"
seriesOrder: 4
seriesSection: "working-with-agents"
---

A few months ago I spent the better part of an afternoon watching Claude Code rediscover, for the fourth session in a row, that my project uses `uv` instead of `pip`. Same wrong import. Same correction. Same wasted tokens.

The model was fine. My briefing was the problem.

I'd spent an embarrassing amount of time blaming the model before I figured this out. The difference between an agent that works and one that burns through context going in circles is, more often than not, CLAUDE.md.

## What CLAUDE.md Is

CLAUDE.md is a markdown file that contains instructions and context relevant to your project. Claude Code reads it at the start of every session. Think of it as the briefing document you'd give a new team member on their first day, except this team member has amnesia and needs the briefing every single morning.

You can generate a starting file by running `/init` on a new project. Claude will read your README, scan source files, and produce an initial CLAUDE.md.

What's not discussed that often: you should immediately edit what it generates. In fact, you might want to delete most of it.

## The Case Against Auto-Generated Context Files

[Addy Osmani](https://addyosmani.com/blog/agents-md/) (a name most web developers will recognise) published in February 2026 an analysis on some papers that I think Claude Code users should read. The core thesis: auto-generated AGENTS.md files from `/init` hurt agent performance and inflate costs by roughly 20%.

The research backing this is solid. An [ETH Zurich study](https://arxiv.org/abs/2602.11988) tested four agents across SWE-bench and custom benchmarks. LLM-generated context files reduced task success by 2–3% while increasing cost by over 20%. Developer-written files improved success by about 4%, but also increased cost by up to 19%. A separate study by [Lulla et al.](https://arxiv.org/abs/2601.20404) found that human-authored AGENTS.md files reduced median wall-clock runtime by nearly 29% and output token consumption by about 17%. Though that study measured efficiency, not correctness.

The critical finding from ETH Zurich was when they stripped all documentation from repos and *then* tested with LLM-generated context files. Those files improved performance by 2.7%. The auto-generated content isn't useless; it's redundant. The agent could discover all of it by reading the repo. Handing it the same information twice adds noise.

Human-written files perform better because they contain things the agent genuinely cannot discover on its own.

## The Minimalism Principle

Every line in your CLAUDE.md must pass one test: can the agent discover this on its own by reading the code?

If yes, delete it.

Here are some examples of things that should be in your CLAUDE.md:

- "`uv` for package management instead of `pip`" to fight the default tendency of the models to use `pip`. Operationally significant to avoid the model wasting tokens rediscovering you use `uv`, not `pip`.
- "Always run tests with `--no-cache` or you'll get false positives from fixture setup" to ensure the model doesn't try to fix non-existent failures
- "The auth module uses a custom middleware pattern — do not refactor to standard Express middleware" to avoid Claude assuming you use a common library and rewriting things
- "The `legacy/` directory is deprecated but imported by three production modules — don't delete anything in it" to avoid dead-code cleanup removing this important package.

Here are examples of things you may see in many CLAUDE.md files that shouldn't be in there:
- "This project uses a monorepo structure with packages in /packages." The agent finds this in the first directory listing.
- "The following commands are used to run tests, linting, etc" Claude can read your `package.json` (or equivalent) and knows how to run tests in most programming languages.

When you give an agent a 500-line spec, it treats it as a compliance checklist instead of a conceptual framework. It tries to satisfy every requirement simultaneously rather than focusing on the task at hand. We've all done this. I certainly did, crafting elaborate CLAUDE.md files that kept growing as the agent kept disappointing. The ETH Zurich findings match the bitter experience: the more instructions, the worse the performance. Their framing is useful: context pollution. The agent's attention gets spread equally across all listed requirements, unable to distinguish universal constraints from task-specific guidance.

The practical threshold they propose is 200–300 lines. Performance drops steeply beyond that. Osmani's analysis focuses on a different filter of "discoverable vs non-discoverable", but both converge on the same conclusion: less is more, as long as what remains is the right less.

## The Hierarchy

CLAUDE.md isn't a single file. It's a hierarchy of files with the same name:

**Global** (`~/.claude/CLAUDE.md`): Loaded in every session, regardless of project. Keep this extremely short: personal preferences, working style, and an index of reference files. [Teresa Torres](https://www.producttalk.org/), whose three-layer context system I'll discuss in the next chapter, keeps her global file to just a few lines. Her reasoning is worth internalising: "If I'm using Claude to brainstorm Christmas gifts for my husband, Claude does not need to know about Product Talk."

**Project** (CLAUDE.md in your repo root): Project-specific details. Architecture decisions the agent can't discover, known gotchas, bash commands that should be run after a task.

**Subdirectory** (CLAUDE.md in subdirectories): Loaded lazily when Claude accesses that directory. Useful for folder-specific rules like an integration testing folder with its own conventions, for example. Just beware, these are the files that tend to duplicate most of the details that the agent can discover by itself.

Claude Code recurses up from the current working directory to root, loading CLAUDE.md files found along the way. Subtree files are loaded only when Claude enters those directories. This also means that the context receives all this content, another reason to keep it short and restricted to things the model can't find. Three big files can start cluttering your context window with details that are redundant for the agent.

## What to Actually Put in CLAUDE.md

Based on months of iteration and the collective experience of the community, here's what consistently helps:

**Non-standard commands.** The exact commands to run — `cargo clippy`, `pnpm lint`, `ruff check` — **if** they are not discoverable, because they are not the standard. The ETH Zurich data backs this up: when a developer-written file mentioned `uv`, agents used it 1.6 times per task on average; when not mentioned, fewer than 0.01 times as it defaulted to `pip`.

**Steps on task completion.** What Claude should do when it thinks it's done: run tests, run the linter, check types. Having a single executable (like `runAll.sh`) that executes all these steps in sequence (returning any errors found) helps, as it is a single entry for the CLAUDE.md that ensures no step is missed.

**Files Claude should NOT read.** Large doc folders, generated files, vendor directories. Saves context.

**How to read logs.** If you have a combined logging setup, tell Claude how to access the last 20 lines. Better yet: set up a `tail-logs` command.

**Non-obvious conventions.** Anything that would trip up a new team member who's good but doesn't know your codebase.

**Workflows with Graphviz/dot.** `dot` is a graph notation that Claude is particularly good at following. Less ambiguous than prose for describing workflows.

## Team Practices

[Boris Cherny](https://x.com/bcherny/status/2017742741636321619), creator of Claude Code and Staff Engineer at Anthropic, shared how his team uses CLAUDE.md in a series of posts about his workflow (aggregated at [howborisusesclaudecode.com](https://howborisusesclaudecode.com)). One example:

> Our team shares a single CLAUDE.md for the Claude Code repo. We check it into git, and the whole team contributes multiple times a week. Anytime we see Claude do something incorrectly we add it to the CLAUDE.md, so Claude knows not to do it next time.

This is compounding engineering. Each correction improves every future session for every team member. The mistake rate drops, session by session.

The CLAUDE.md is your team's accumulated memory.

Let's say that during review, someone spots an anti-pattern and adds it to CLAUDE.md as part of the PR. Future sessions avoid the issue automatically. The example he gives: `never use enums, always prefer literal unions`. That's a correction that, once made, never needs to be made again, and it can cover scenarios where a linter is not enough to specify the rule.

## CLAUDE.md as Forcing Function

Your CLAUDE.md can also be an indicator of the health of your codebase and processes.

If your CLAUDE.md instructions are getting complex, with too many steps, that's a signal to simplify the tools, not expand the documentation. Provide scripts that run those steps at once, in a single execution.

If models are struggling to find something in the codebase, it may be in the wrong place. The codebase structure itself is the primary documentation: fix the structure rather than adding more CLAUDE.md instructions.

If agents can't use a tool, the tool may be the wrong fit. Find an alternative. Giving agents the tools to unblock themselves is more useful than adding workarounds to CLAUDE.md.

Think of CLAUDE.md as a diagnostic tool. Every line signals something in the codebase confusing enough to trip an AI agent, which means it probably trips human contributors too. The right response is to fix the actual problem, not grow the context file.

Agent keeps putting utilities in the wrong directory? Reorganise the structure. Agent reaching for a deprecated dependency? Fix the import structure. Agent forgetting type checks? Automate it in the build pipeline.

Martin Fowler made this point directly in a [February 2026 blog fragment](https://martinfowler.com/fragments/2026-02-13.html), titling one section "The Venn Diagram of Developer Experience and Agent Experience is a circle." The practices that make a codebase easier for humans to read — clear modularity, descriptive naming, well-organised directories — are the same practices that make it easier for agents. Every time you fix a CLAUDE.md instruction by improving the codebase instead, you're simultaneously improving both the human and agent experience.

The code might be fine. The humans might not understand it. The agent might be confused for the same reasons the humans are confused. The fix, more often than not, isn't better documentation; it's a better codebase.

The ideal CLAUDE.md is nearly empty, not because you haven't invested in it, but because you've fixed the underlying issues it was compensating for.

## Getting Started

If you're starting from scratch, my recommendation: begin with a nearly empty CLAUDE.md containing one instruction: "If you encounter something surprising or confusing in this project, flag it as a comment." Run a few sessions. See what Claude flags. Fix what you can in the codebase. Add the rest to CLAUDE.md.

Most agent-proposed additions are indicators of where the codebase is unclear. Use them as a diagnostic, not just an instruction manual.

Invest in curating this file. It's the same as investing in your developer tooling. The return compounds with every session, starting with the next one.

The model was fine. The briefing was the problem.
