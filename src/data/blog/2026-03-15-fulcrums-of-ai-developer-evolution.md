---
author: Pere Villega
pubDatetime: 2026-03-15
title: "A Practitioner's Guide to AI-Assisted Development"
draft: false
tags:
  - ai
  - opinion
  - software-engineering
  - productivity
description: The journey from AI-sceptic to agent-native isn't a smooth ramp — it's a series of uncomfortable jumps. This post maps the stages of AI-assisted development and identifies three critical fulcrums where developers get stuck.
series: "ai-developer-evolution"
seriesOrder: 1
seriesSection: "introduction"
---

If you've been anywhere near the developer discourse lately, you've probably noticed a pattern: half the industry is convinced AI agents will replace us all by next Tuesday, and the other half insists it's all hype and refuses to try Cursor. As usual, the truth is somewhere in the middle, and it's more interesting than either camp admits.

Over the past year or so, I've gone from sceptic to daily user of agentic coding tools. Not because I saw the light in some dramatic revelation, but because the tools quietly crossed a threshold where ignoring them started costing more than learning them. And along the way, I noticed something that I don't see discussed enough: the journey from "this is just autocomplete" to "I'm shipping with multiple agents in parallel" isn't a smooth ramp. It's a series of uncomfortable jumps.

This post is the introduction to a series where I'll break down that journey: what it actually looks like in practice, what the hard parts are, and what I wish someone had told me earlier.

## The Stages

The progression from AI-sceptic to agent-native follows a rough path that several people have mapped in different ways. Steve Yegge described it in his "Gas Town" essay, Geoffrey Huntley has been documenting his own journey through his ghuntley.com posts, and Justin Abrahms synthesised much of this into a clear stage model. Drawing from all of them (and from my own experience), it looks something like this:

1. **Dismissal.** "It's just hype." You tried it once, got a bad result, and moved on.
2. **Fear.** Someone on your team ships a feature in an afternoon using Cursor. You start wondering about job security.
3. **Tentative experimentation.** You install Copilot. Tab completions, the occasional chat question. It's fine, sometimes useful.
4. **Agent with training wheels.** You enable an IDE agent but approve every single action. You're still firmly in control.
5. **YOLO mode.** Permissions off. The agent fills the screen. You review diffs instead of writing code.
6. **Breaking out of the IDE.** CLI agents. The IDE becomes the bottleneck, not the workspace.
7. **Multi-agent.** Three to five parallel instances. You're managing a small fleet and shipping fast.
8. **Autonomous loops.** AFK coding. Agents iterate overnight against success criteria you defined earlier.
9. **Swarm management.** Ten or more agents, hand-managed. You spend more time coordinating than coding.
10. **Orchestrator builder.** You build (or adopt) tooling to manage the swarm. This is Yegge's Gas Town territory.
11. **"The Matrix" moment.** You can build anything. You just do things because it's faster than explaining why someone else should.

Now, listing stages is easy. What matters is understanding where people actually get stuck. And from what I've seen (both in my own experience and watching others), there are three critical transition points that trip people up. I'm calling them fulcrums.

## The Three Fulcrums

### Fulcrum 1: Letting Go of Control (Stages 4 → 5)

This is the trust barrier, and it's where most developers stall.

You've been approving every agent action, reading every line it produces. Then someone tells you to turn off permissions and let it run. Your gut screams no. And it screams no for a reason that has nothing to do with the agent's capabilities: it's your identity as "the person who writes code" that's under threat.

The shift here isn't technical. It's psychological. You go from "AI assists me" to "I supervise AI," and that reframing breaks something fundamental about how many of us think about our craft. Most developers I know got stuck at this fulcrum for weeks, sometimes months. It feels like giving up.

It isn't. But it feels like it.

### Fulcrum 2: One-to-Many (Stages 6 → 7)

This one is operational, not emotional. By now you've accepted that the agent does the work. The problem is that *you* are the bottleneck. You can't review everything a single agent produces, let alone multiple agents.

The shift is from code review to designing constraints: tests, lints, CI pipelines, success criteria that validate work without you reading every line. Huntley calls this "backpressure," and it's a good term. You're essentially becoming an engineering manager of machines. If you've never managed people, this feels alien. If you have, it feels eerily familiar.

### Fulcrum 3: Human Limits (Stages 9 → 10)

Hand-managing ten or more agents breaks down. Full stop. At this point you either build orchestration tooling or you hit a ceiling. This stops being a personal productivity technique and becomes a systems engineering problem.

You're no longer a developer using AI. You're building the factory that builds the software. The skill set flips from software engineering to operations and context engineering, and that's a fundamentally different discipline.

## The Pattern

Each fulcrum is about accepting a new constraint on human involvement. First you let go of writing. Then you let go of reviewing. Then you let go of coordinating. Stage 11 ("The Matrix" moment) is the emotional endgame once you've internalised all three.

Whether you find that exciting or terrifying probably says something about where you are in the progression right now.

## What This Series Covers

In the posts that follow, I'll walk through the practical side of this journey: how to set up your environment, how to write effective CLAUDE.md files, what context engineering actually means in practice, how to work with single and multiple agents, and what security looks like when your code is being written by something that doesn't understand the concept of "production database."

I'll be drawing from my own daily workflow with Claude Code, from the practitioners and writers who've been mapping this territory (Yegge, Huntley, Abrahms, among others), and from the mistakes I've made along the way. Because I've made plenty. That's kind of the point.

As with most things I write: most likely in a few months I'll revisit this and realise I was wrong about half of it. But, hey, learning.
