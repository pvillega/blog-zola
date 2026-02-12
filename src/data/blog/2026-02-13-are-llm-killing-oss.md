---
author: Pere Villega
pubDatetime: 2026-02-13
title: Are LLMs killing Open Source
draft: false
tags:
  - ai
  - open source
  - skills
  - hiring
description: "How LLM-generated slop PRs and shrinking small libraries are reshaping open source, eroding hiring signals, and making deep domain expertise the most defensible way for developers to stand out."
---


Some early morning thoughts on OSS, triggered by the growing number of reports about projects closing PRs due to AI slop. Mitchell Hashimoto [considering closing external PRs](https://x.com/mitchellh/status/2018458123632283679) to his open source projects. Greenhouse's [2025 AI in Hiring Report](https://www.greenhouse.com/blog/greenhouse-2025-workforce-hiring-report) documenting a full-blown trust crisis in recruitment. These feel like two sides of the same shift, and I wanted to think through where that leaves developers who've relied on OSS contributions as a way to stand out.

## The shrinking long tail

Open source used to be one of the clearest ways for a developer to stand out: ship code in public, let people verify your work, build reputation over time. LLMs are changing that equation, but not by making OSS irrelevant. By redefining what's valuable.

The long tail of small libraries is shrinking. When a team can generate a utility in-house with an LLM instead of pulling in a dependency, fewer projects justify existing. And this is going to happen more and more, due to all the issues related to supply-chain attacks. Why take on the risk of an external dependency when you can generate and own the code yourself? Fewer projects means fewer opportunities to build a reputation through contributions.

Additionally, maintainers of the projects that remain are overwhelmed. AI-generated "slop PRs" are flooding repositories. Some prominent maintainers are considering closing external contributions altogether. The casual contribution that once showed initiative now gets lost in noise. This dynamic also means fewer opportunities to build a reputation through contributions.

## The trust crisis makes signal scarce

This matters more because hiring is in a trust crisis. Abundant reports of recruiters who have spotted candidate deception. Companies have reintroduced onsite interviews specifically to combat AI-assisted cheating. Traditional signals are breaking down across the board.

Thus, a question presents itself: what may still work? How can a developer showcase they are a good hire even before sending the CV? Which signal has value?

I don't think there's one clean answer, but some signals hold up better than others.

## What still works

Sustained, verifiable OSS history is important. Not just commits, but code reviews, architectural discussions, issue triage, participation in events, etc. These remain one of the few signals that's genuinely hard to fake. For those who can build and maintain tools others depend on, the differentiation value has actually increased. The fact a lot of these interactions happen in silos like Discord and Slack is not ideal, but the signal will still reach people inside the communities, as they are already part of those walled gardens.

But we should be honest: that path just got much harder and more competitive. For many developers, alternative differentiation strategies will matter more than ever. Deep domain expertise, technical writing, demonstrable shipped products, conference speaking.

## The case for depth over breadth

Of those alternatives, deep domain expertise may be the most defensible signal. Many ICs (me included) have jumped often across industries, building a broad but shallow understanding of the domains. Fintech for a while, then e-commerce, then data platforms, picking up enough context to be effective and moving on. That worked when the scarce resource was general technical ability. An LLM can't replace someone who understands distributed systems or knows how to design a reliable API.

But in a world where LLMs commoditise the general-purpose coding layer, the person who deeply understands *the domain* (the regulatory constraints, the business edge cases, the reasons why the obvious solution doesn't work) becomes much harder to replace. Breadth got you hired when the bottleneck was "can you code." Depth gets you hired when the bottleneck is "do you understand what to build and why."

I'm starting to think the era of the generalist IC hopping across industries every couple of years might be closing. Not entirely, but the calculus has changed.

## The emerging skill hierarchy

The skill hierarchy is shifting. "Can use an LLM" is table stakes. "Can use it with judgment" is the baseline. "Can build things others depend on" is where real signal lives, as that mixes technical capabilities with understanding of what's needed.

OSS isn't dying. But the version of it that was accessible to everyone as a career shortcut might be. The bar for what counts as meaningful contribution has gone up, and for those who can clear it, the signal is worth more than ever. For everyone else, it's worth asking: where does your differentiation actually come from, and how defensible is it against the next generation of AI tools?
