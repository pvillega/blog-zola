---
author: Pere Villega
pubDatetime: 2026-03-06
title: "LLMs Are Already Useful"
draft: false
tags:
  - ai
  - devtools
  - golang
description: "How I used Claude Code to build a GitHub backup tool I'd been putting off for years, and why LLMs are most valuable for the small internal tools you never get around to writing."
---

A few weeks ago I found myself thinking about something that I suspect many developers have thought about and then promptly ignored: what happens to all my repositories if I lose access to my GitHub account?

Maybe it's a compromised password. Maybe it's a billing issue. Maybe GitHub has an incident that corrupts data. Maybe I just fat-finger a deletion on a private repo that I care about. The scenarios are varied, but the outcome is the same: years of work, personal projects, client code references, config repos, all potentially gone.

I know, I know. Git is distributed. If I have local clones, I have copies. But let's be honest with ourselves: how many of your repos do you actually have cloned locally right now? All of them? Including that utility you wrote three years ago? That fork you contributed to? I certainly don't.

## The Problem Is Clear, the Time Is Not

The solution is straightforward enough: periodically mirror-clone all your repositories, zip them up, store them somewhere safe. Maybe on your NAS, maybe in a cloud bucket, whatever works for your paranoia level. This isn't rocket science.

And that's precisely why I'd never done it. It's one of those tasks that sits in the "important but not urgent" quadrant of your to-do list forever. The kind of thing you'd get to "next weekend" for about fifty weekends in a row. I know how to write the code. I know the GitHub API. I could absolutely build this myself. But between client work and everything else, it just never happened.

## Enter Claude Code

This is where I think the real story is.

I opened [Claude Code](https://docs.anthropic.com/en/docs/claude-code/overview), and described what I wanted: a CLI tool that mirror-clones all my GitHub repos, zips them, and only re-downloads repos that have changed since the last backup. Then I answered a handful of clarifying questions. What language? Go seemed like a good fit for a self-contained CLI binary. How should it detect changes? Compare HEAD SHAs. Parallel cloning? Sure, with configurable concurrency.

A few rounds of back-and-forth to nail down the spec, and Claude went ahead and built the whole thing. The result is [git-backup](https://github.com/pvillega/git-backup), a Go CLI that does exactly what it says: backs up all your GitHub repositories as zipped mirror clones. It handles personal repos, org repos, forks. It does smart sync via SHA comparison so subsequent runs are fast. It writes atomically so you don't end up with half-baked backups. It even has a dry-run mode.

Is this a complex project? Not at all. It's the kind of thing an experienced developer could knock out in a day or two. But that's exactly the point. I wouldn't have done it. Not because I couldn't, but because the opportunity cost of spending a Saturday on internal tooling when you have a family (or paying clients) is hard to justify.

With Claude Code, the total investment on my end was maybe thirty minutes of thinking through requirements and reviewing the output. The planning docs are still in the repo under `docs/plans` if you're curious.

## The Bigger Picture

There's a crowd that says "I can rebuild any SaaS in a weekend with AI." I suspect those folks haven't fully considered the domain complexity most SaaS products cover, the integration ecosystem they plug into, the compliance requirements, the support burden, the edge cases that only surface at scale. Building a Trello clone over a weekend doesn't mean you've replaced Trello. That's a much harder problem than just typing code into an editor.

But here's what LLMs are genuinely brilliant at: all those small internal tools and scripts that would make your life better but that you never build because the effort-to-value ratio doesn't justify it for a human. The backup script you keep meaning to write. The data migration tool for that one-off task. The monitoring dashboard that pulls from three different APIs. The formatter that converts your Obsidian notes into a specific format.

These are projects where the spec fits in your head, the requirements are clear, and the main bottleneck was always "I don't have two spare hours." LLMs obliterate that bottleneck. And this alone makes them worthwhile.

I'm not saying that LLMs can't do daily work or that they can't be used for big projects. They certainly can. But this type of solution, like the one I built, is overlooked in the conversation too often. And, oh boy, do LLMs bring value here.

## What Comes Next

Something I find worth noting: the gap between open-source models and frontier models keeps shrinking. If you look at how models like Llama, Qwen, or DeepSeek compare to frontier offerings today versus a year ago, the trajectory is clear. It may not be long before a locally-hosted open model can handle this kind of task just as well.

And that's genuinely good for the industry. It means the ability to generate internal tooling cheaply will become universally accessible, not gated behind API costs or subscriptions.

The flip side, of course, is that if your primary value as an engineer is typing code into an editor — the mechanical act of translating well-understood specs into working code — you have a problem. That's the part that's getting commoditised fastest. The thinking, the architecture decisions, the domain understanding, knowing *what* to build and *why*. That's where the value concentrates.

But I suspect most readers of this blog already know that.

The tool is open source at [github.com/pvillega/git-backup](https://github.com/pvillega/git-backup) if you want to use it or adapt it. Run it via cron, point it at a backup directory, and sleep a little better knowing your repos are safe somewhere that isn't solely dependent on GitHub's continued goodwill toward your account.
