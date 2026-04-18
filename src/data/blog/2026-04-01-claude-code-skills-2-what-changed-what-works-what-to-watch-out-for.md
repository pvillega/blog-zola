---
author: Pere Villega
pubDatetime: 2026-04-01
title: "What's New in Claude Code Skills 2.0"
draft: false
tags:
  - ai
  - claude-code
  - developer-tools
  - skills
  - ai-developer-evolution
  - automation
description: "Skills 2.0 unifies custom commands and skills, adds subagents, evals, and a growing ecosystem. Here's what actually changed, what works in practice, and the security and quality pitfalls to watch for."
---

I have to confess something slightly embarrassing. When I first saw "skills" (the old version) mentioned in the Claude Code docs, I spent a good ten minutes convinced it was just a rebrand of custom commands. Marketing polish on something I'd already been using. I had my `.claude/commands/` folder, my `/deploy` shortcut, my `/commit-msg` that wrote conventional commits. They worked. Why would I care what Anthropic decided to call them this week?

I was wrong. The gap between "commands" and "skills" is worth understanding, more so with the recent changes (dubbed Skills 2.0 by the community), along with the deprecation of Commands. Anthropic has been quietly [rearchitecting how all of this works](https://www.anthropic.com/news/skills), and the result is more nuanced than a rename.

## From Commands to Skills

Custom commands and skills have been unified. That's the TL;DR. A file at `.claude/commands/deploy.md` and a skill at `.claude/skills/deploy/SKILL.md` now both create `/deploy` and work the same way. Don't panic, your existing commands keep working, no need to migrate them now. But any future additions should be added as skills.

Skills add things commands never had. A skill is a _folder_, not just a markdown file. That folder can contain scripts, reference documents, templates, example files, config, whatever Claude needs to do the job well. And skills support [YAML frontmatter](https://code.claude.com/docs/en/skills) that controls behaviour: when the skill triggers, which tools Claude can use, whether Claude can invoke it autonomously or only when you type the slash command, and even which model to use.

Commands were user-invoked shortcuts. You typed `/deploy` and something happened. Skills are _model-invoked capabilities_. Claude reads the descriptions of all available skills at session start and decides when to load one based on your request. You can still invoke them manually, but the real shift is when Claude decides on its own that a skill is relevant and loads it without you asking. Think of it like the difference between a cookbook you open yourself and a sous-chef who knows which recipe to grab when you say "something with the leftover chicken."

The other big addition is subagent support. Skills can now spawn isolated subagents with their own context windows. Not only that, you can use shell commands to inject live data into skill prompts before Claude sees them. Skills can also restrict which tools Claude uses, override the model, hook into lifecycle events, and run in forked contexts.

That is **a lot** of changes compared to commands. You do not need to use them all from the start, but they enable workflows that commands couldn't, and can even replace some MCP servers, saving tokens.

## Progressive Disclosure

One of the cleverer design decisions, and one I didn't fully appreciate until I hit its limits, is how skills handle context. In a regular session, only skill _descriptions_ are loaded into context. Claude knows what's available but doesn't burn tokens on the full instructions until a skill is actually invoked. Anthropic calls this "progressive disclosure," and it directly affects how you should design skills.

One thing worth flagging: the description field isn't a summary for humans. It's a trigger for Claude. The model scans that list to decide whether a skill matches your request. Vague description? Won't trigger. Too narrow? Won't trigger for variations. There's also a character budget (roughly 1–2% of the context window) shared across all your skills, so if you install too many, descriptions get truncated and Claude loses the keywords it needs to match.

This creates a constraint I suspect many people hit before they understand why: install too many skills and they start interfering with each other. A Monkey's Paw situation. You wished for more capabilities, you got them, and now none of them fire reliably. A reasonable starting point, in my experience, is 5–8 active skills per project. Past that and you're into territory where debugging why a skill didn't fire takes longer than doing the task manually.

Remember you can still have skills that are configured to only trigger when you call them. You can use this to strike a balance between automatic skills for common tasks, and specialised skills for less-common tasks.

## Skill Creator

Anthropic ships a `skill-creator` meta-skill. A skill that builds other skills. It's genuinely useful, especially for people who aren't engineers (and Anthropic explicitly calls this out, the tool is designed for subject-matter experts, not just developers).

The March 2026 update to skill-creator added capabilities that bring real software-engineering rigour to what's essentially prompt authoring. The skill creator now includes the capability to test evals on your skill.

Evals let Claude run your skill on test prompts and grade the output against criteria you define, both with and without the skill loaded. A/B testing uses a separate comparator agent that judges outputs blind: it doesn't know which came from the skill and which is the baseline. And there's a trigger-description optimisation loop that rewrites your skill's description and tests different versions against sample prompts to find the one that fires most reliably. The benchmark mode tracks eval pass rate, elapsed time, and token usage across runs, so you can measure the impact of changes instead of guessing.

I've been building a benchmarking harness for comparing Claude Code configurations, so I have some sympathy for what this is trying to do, and some opinions on the caveats.

First, test prompts must be realistic. The skill-creator docs say this explicitly, and I'd argue it's the single most important piece of advice in the whole skills space. Clean, abstract test prompts don't reflect reality. Real users make typos, use casual abbreviations, forget file names. I tested a few skills with polished prompts and they looked great. Then I used them in actual work, with my usual half-formed requests and missing context, and they fell apart. The recommended approach is to include messy, detailed queries with file paths, personal context, abbreviations, and edge cases. I'd go further: copy-paste actual prompts from your history. If you can't find five real examples, you probably don't need the skill yet.

Second, Claude rarely triggers skills for short, simple requests. If your eval set is full of one-liners like "format this data" or "read this PDF," the skill won't fire even if the description matches perfectly. Claude only consults skills for tasks it can't easily handle on its own, so your test prompts need enough complexity to cross that threshold. This bit me when I tried to build a skill for a task that turned out to be simple enough that Claude just... did it without the skill.

Third, the description budget problem. The trigger optimisation loop helps, but it's fighting a fundamental constraint that can truncate your skill description. Front-load the key use case, because anything past that limit gets truncated.

And one more gotcha that cost me an annoying hour of debugging: multi-line YAML descriptions in the frontmatter. Some formatters (Prettier, for instance) will wrap a single-line description into multiple lines. Claude Code's YAML parser doesn't handle this well. Skills silently stop appearing in the available skills list. The fix is trivial (keep descriptions on a single line). The failure mode is invisible enough to make you question your sanity.

## Two Kinds of Skills

[Anthropic's engineering blog](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) draws a useful distinction between capability uplift skills and encoded preference skills, and I think this framing is worth internalising because it changes how you test them.

Capability uplift skills teach Claude to do something the base model can't do well. The PDF form-filling skill is the canonical example: placing text at exact coordinates in non-fillable forms requires techniques that prompting alone doesn't cover. The risk is that as models improve, these skills become redundant. Like writing a skill to teach Claude to count correctly, only to have the next model release make it unnecessary. The eval framework helps you detect when that happens: if the base model starts passing your evals without the skill loaded, the skill's techniques may have been absorbed into the model's default behaviour.

Encoded preference skills document workflows where Claude can already do each piece, but the skill sequences them according to your team's process. NDA review against set criteria, weekly updates pulling data from specific sources, commit messages in your team's format. These are more durable as the model won't spontaneously learn your org's conventions, but they're only as valuable as their fidelity to your actual workflow. I'd argue these are where most teams should start, because the failure mode is gentle (the process is slightly wrong) rather than catastrophic (the capability doesn't exist).

Capability skills need evals that detect model progress. Preference skills need evals that verify process fidelity. Test accordingly.

## The skills.sh Ecosystem

The community side of skills has grown fast. Maybe too fast for its own good. [skills.sh](https://skills.sh/) is the main open directory, run by [Vercel Labs](https://vercel.com/changelog/introducing-skills-the-open-agent-skills-ecosystem), and it tracks install counts across skills from various repos. The leaderboard shows hundreds of skills. The `find-skills` meta-skill from Vercel is the most installed at ~787K (it helps discover other skills), followed by Vercel's own React best practices and Anthropic's `frontend-design` skill.

Installation is a one-liner (`npx skills add <owner/repo>`) and the SKILL.md format is an open standard that works across Claude Code, Cursor, Codex CLI, Gemini CLI, GitHub Copilot, and others. Cross-agent compatibility is probably the most significant aspect of the format: you write the skill once and it works wherever SKILL.md is supported.

Now the part where I urge caution. This has all the hallmarks of early npm: fast growth, zero quality control, and a security model that amounts to "trust me, bro." There are competing directories: skillsmp.com (claiming 700K+ skills), skillsdirectory.com (which adds security scanning), and mcpmarket.com. Skills can include executable scripts and instruct Claude to install packages, so reviewing any third-party skill before enabling it is not optional. This is especially true for skills that connect to external network sources or include code dependencies. I've been reading through every SKILL.md before installing, and I'd strongly recommend you do the same. You can even ask Claude to evaluate a skill, providing it with the URL of the skill code, to flag potential dangers before you enable it.

Anthropic's own official skills live at [github.com/anthropics/skills](https://github.com/anthropics/skills) and can be installed as Claude Code plugins via their marketplace. If you're looking for a safe starting point, start there.

## Skills vs. AGENTS.md

Speaking of Vercel and skill marketplaces. [Vercel ran an interesting eval](https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals) comparing skills against a compressed docs index embedded directly in `AGENTS.md` (Claude Code's equivalent is `CLAUDE.md`). The context was Next.js 16 APIs that aren't in model training data, so they were testing whether agents could learn new framework knowledge.

The results are worth sitting with for a moment. With skills available but no explicit instructions to use them, the skill was never invoked in 56% of cases, producing zero improvement over baseline. Even with explicit instructions telling the agent to use the skill, the pass rate topped out at 79%. Meanwhile, an 8KB compressed docs index embedded in `AGENTS.md` achieved 100% across build, lint, and test.

I suspect this surprises no one who's spent time watching agents make decisions. The fundamental issue is the decision point: with `AGENTS.md`, there's no moment where the agent must decide whether to look something up. The information is just there, like a cheat sheet taped to your monitor versus a reference book on a shelf across the room. You'd think rational agents would walk to the shelf when needed but, in practice, the cheat sheet wins every time.

The takeaway isn't that skills are useless. Vercel themselves note that skills work better for vertical, action-specific workflows that users explicitly trigger. But for general knowledge the agent should always have access to, passive context currently beats on-demand retrieval. This maps to what Thariq from Anthropic describes in [his post about skill design](https://x.com/trq212/status/2033949937936085378): skills work best for _repeatable workflows_ with clear trigger conditions, not as a replacement for persistent project context. Encoding your org's deployment process or your team's code review checklist? Good skill. Trying to teach Claude about your framework's API surface? You're probably better off putting a compressed reference in your `CLAUDE.md`.

## What I've Learned Building Skills

[Thariq's post](https://x.com/trq212/status/2033949937936085378) on how Anthropic uses skills internally is probably the most valuable resource for anyone building skills seriously, and I'd recommend reading it in full. I want to highlight the bits that match, and in some cases contradict, what I've found in my own tinkering.

The gotchas section of any skill is the highest-signal content. Build it from actual failure points you observe, and keep updating it over time. This is the section that pushes Claude away from its default behaviour and toward what actually works in your context. I've started keeping a running log of "Claude did X when I wanted Y" moments and feeding them directly into my skill's gotchas. It's tedious but it compounds.

Don't state the obvious. Claude already knows a lot about coding and about your codebase. Focus your skill content on information that pushes Claude out of its normal way of thinking. The `frontend-design` skill is a good example. It works precisely because it encodes opinionated design taste that counters Claude's tendency toward safe, average choices. You know the aesthetic: Inter font, purple gradients, the visual equivalent of stock photography. The skill says "no, do this instead," and it actually works.

Use the file system as context engineering. Split detailed references, API signatures, and templates into separate files within the skill folder. Claude will read them when needed, and it's cheaper than cramming everything into the SKILL.md file. This is something I wish I'd understood earlier, my first few skills were enormous single files that burned through context for no good reason.

Don't railroad Claude. Skills are reusable across many situations, so being too specific in instructions will break edge cases. Give Claude the information it needs but the flexibility to adapt. I think of it like writing good documentation for a human colleague: you want to convey intent and constraints, not dictate every keystroke.

And one that I found surprisingly useful: skills can include memory. Store data within the skill directory: a log file, JSON, even a SQLite database. A standup-posting skill that keeps a `standups.log` lets Claude read its own history and know what changed since yesterday. Note that plugin upgrades may delete skill directory contents, so store persistent data in `${CLAUDE_PLUGIN_DATA}`.

## Is This Actually Worth It?

It depends on your workflow, and I'm only partly joking when I say that's the answer to every question in software engineering. If you're doing the same multi-step task more than a few times and expect to do it regularly, building a skill makes sense. If you're writing a skill for a one-off task or a hypothetical future need: don't. [Anthropic's own docs](https://code.claude.com/docs/en/skills) say this explicitly, and I've learned that speculative skills are where good intentions go to gather dust.

The eval infrastructure is, I believe, a genuine step forward. Before Skills 2.0, there was no good way to test whether a skill actually worked. You'd build one, try it a few times, decide it seemed fine, and move on. If something broke after a model update, you wouldn't find out until some output came out wrong. Evals turn intuition into measurement, and that's unambiguously valuable, even if the tooling still has rough edges.

The unification with commands is a welcome simplification. The skill space is growing fast. Maybe too fast, given the quality and security concerns. And the simplification may not be enough: the interplay between skills, `CLAUDE.md`, subagents, and MCP servers creates a powerful but complex configuration surface that rewards careful architecture and punishes the "install everything and hope for the best" approach.

Skills are useful. The people who'll get the most value are the ones who test first, verify always, and resist the urge to automate things they don't yet understand. Build processes and tools as you notice you need them. YAGNI applies here too.
