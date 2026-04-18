---
author: Pere Villega
pubDatetime: 2026-03-16
title: "Code Is Cheap Now, And That Changes Everything"
draft: false
tags:
  - ai
  - opinion
  - software-engineering
  - productivity
description: AI coding agents have made code production nearly free. Drawing on insights from Kent Beck, Paul Ford, and Simon Willison, this post argues that the value has shifted from writing code to defining systems — contracts, invariants, SLAs, and verification.
series: "ai-developer-evolution"
seriesOrder: 1
seriesSection: "working-with-agents"
---

[Kent Beck](https://tidyfirst.substack.com/), the person who gave us Extreme Programming and popularised Test-Driven Development, tweeted something in April 2023 that should have been a wake-up call for every developer alive:

> 90% of my skills just went to zero dollars. 10% of my skills just went up 1000x.

Two years later, in a November 2025 podcast appearance, he expanded on what that 10% actually looks like: "Having a vision, being able to set milestones towards that vision, keeping track of a design to maintain or control the levels of complexity as you go forward. Those are hugely leveraged skills now compared to knowing where to put the ampersands and the stars and the brackets in Rust."

If you've been paying attention, you already know what the 90% is. And if you haven't, well, this post is for you.

## The $350K Weekend Project

Paul Ford, former CEO of Postlight and one of the sharpest observers of the technology industry, described what happened when [Anthropic](https://www.anthropic.com/) gave Pro plan subscribers $1,000 in free [Claude Code](https://www.claude.com/product/claude-code) credits in November 2025. Ford, a self-described "reasonably effective coder and horrific dilettante", set out to burn $100 a day on side projects that had been sitting in folders for a decade.

Ford can put real numbers on this because he spent years as a professional software cost estimator. He knows exactly what things cost to build. Claude Code itself would estimate project costs and those estimates were, in Ford's words, "extremely on the nose — for 2022." But in 2025, one can type "do all of that; sounds like a bargain" and it gets done in fifteen minutes for maybe 50 cents.

Over the weekend, he ported his old blog from a custom, "incredibly obscure, disturbing data format" he first created in 1999 to a tidy new CMS. He built a timeline visualisation project with a new TypeScript frontend and backend. He created a functional clone of OwnCast. Total spend: about $150.

Ford's description of the experience is worth lingering on: "Programming in Claude Code is like playing with a Tamagotchi, if a Tamagotchi was a forty-person engineering and product team, and instead of producing little digital poops, it could instead deploy database-backed web applications with type-safe API interfaces and React frontends."

At 2021 retail rates, the dataset conversion alone would have been $350,000: a product manager, a designer, two engineers including one senior, four to six months of design, coding, and testing, plus maintenance. Ford himself, on weekends and evenings, for the price of leftover promotional credits.

This isn't a hypothetical thought experiment about the future. This is one person, right now, doing work that used to require a small team and half a year.

## The Constraint That Shaped Everything

Code has always been expensive. A few hundred lines of clean, tested code takes most developers a full day. This isn't a minor detail, it's the core constraint that shaped virtually every habit and institution in our industry.

Why do we estimate stories? Because developer time is expensive and someone has to budget for it. Why do we prioritise features in backlogs? Because we can't build everything and we need to choose what's worth the cost. Why do we agonise over whether to refactor this module or write that debug interface? Because the time spent on one thing is time not spent on another.

Planning. Estimating. Feature prioritisation. Code review. Architecture review. Sprint planning. All of it is downstream of the assumption that writing code is the expensive part.

Coding agents just dropped the cost of that part through the floor.

In his September 2025 essay "Programming Deflation," Beck explored what happens when the cost of code production drops continuously. His conclusion isn't that we'll need fewer programmers; it's that cheaper code surfaces latent demand. There are millions of problems nobody bothered solving because the cost of a software solution exceeded the value. When code costs plummet, those problems become worth solving. The total amount of software in the world goes up, not down.

[Simon Willison](https://simonwillison.net/), creator of Datasette and one of the most thoughtful practitioners writing about AI-assisted development, captures this shift well in his Agentic Engineering Patterns guide. His heuristic is beautifully simple: any time your instinct says "don't build that, it's not worth the time," fire off a prompt anyway in an asynchronous agent session. The worst case is you check ten minutes later and find it wasn't worth the tokens.

That heuristic only makes sense in a world where code is cheap. Six months ago, it would have been absurd.

## What "Good Code" Still Costs

Before anyone accuses me of suggesting that quality doesn't matter: it does. More than ever, in fact.

Willison defines "good code" as code that works, that we *know* it works, that solves the right problem, handles errors gracefully, is simple and minimal, protected by tests, documented appropriately, affords future changes, and meets the relevant "-ilities": accessibility, testability, reliability, security, maintainability, observability, scalability, usability.

Agent tools can help with most of that list. But there remains a substantial burden on the developer to ensure the produced code is actually good. The stochastic nature of LLMs means you can't just trust the output. The word "stochastic" matters here: it means the same input can produce different outputs each time. A test that passes doesn't mean it's a good test. Code that compiles doesn't mean it's correct.

This is, paradoxically, what makes LLMs so powerful for coding compared to other domains. We have compilers: either it compiles or it doesn't. We have test suites: either the tests pass or they don't. We have type systems, linters, static analysis. Software gives us verification tools that most other domains lack.

But verification requires knowing what "correct" looks like. And that's where the 10% that went up 1000x lives.

Google's [2024 DORA report](https://dora.dev/research/) confirms the paradox from the other direction: 75% of developers reported feeling more productive with AI tools, but every 25% increase in AI adoption showed a 1.5% dip in delivery speed and a 7.2% drop in system stability. Meanwhile, 39% of respondents reported having little or no trust in AI-generated code. The tools make us feel faster. The data suggests we're not, unless we change how we work. More on that in following chapters.

## The Nail Gun Analogy

AI is a nail gun. In the hands of someone unskilled, it's dangerous. In the hands of a professional, it speeds them up enormously. And in the end, all anyone cares about is that a nail exists in that location.

You may feel this is a simplification. I'd argue it's more accurate than you might expect.

The user doesn't care about your SonarQube stats. They don't care whether you used functional or object-oriented style, whether the architecture is hexagonal or layered, whether you chose Rust or TypeScript. They care that the app does what it says, that it's fast enough, that it doesn't lose their data, and that it's available when they need it.

Of course, there's a big risk here. If you don't verify progress, if you just let an agent generate code without understanding what it's producing, you may end up with a blob of slop that sinks under its own weight. We've all read the horror stories. That's why this isn't just about tools. It's about systems.

## The System Is the Asset

Look at systems that have survived for a long time because they worked. What endured was not the implementation details. What endured was well-understood behaviour and a clear sense of what must not break.

A more tangible example: consider a marketplace for C2C sales. What is the system? It's not the language, the microservices, or the deployment topology. The system is the SLA: latency, availability. The system is the data: audit trails, accounts, transaction records. The system is the contracts: what goes in, what comes out. The system is the invariants: only one bid per item per user, maximum N items on sale per user.

If you have all of that defined in detail, you could recreate the system over and over. Different tools, different architectures, different teams, different agents. And the user wouldn't notice.

I can hear the counterpoint already: waterfall showed us that we clearly miss invariants and details, that business evolves and we need to update these system definitions constantly. I'm not advocating doing it just once, perfectly. That has never worked and never will.

But I am advocating for focusing on system definition as the primary engineering activity. If your code complies with the contracts, passes the tests, meets the SLAs, does it matter if it's code you'd write yourself?

This bridges naturally to observability. More and more, we're moving toward systems that are debugged in production. A system with stable contracts, strong evaluations, continuous monitoring, and clear rollback paths can safely tolerate many changes, with less human supervision, at bigger scale. That's the challenge of the new era.

Which, of course, in a sector where companies have been trying to "be agile" and failing (or adopting SAFe) for 25 years, means there's going to be a lot of pain in the near future.

## The Mindset Shift

The skill set needed to use AI agents well turns out to be a mixture of product manager and development team manager. You need to know what to build, why it matters, what "done" looks like, and how to verify the result. You need to specify outcomes, not implementations. Declarative development, "here's what I want, figure out how", beats imperative micromanagement every time.

Developers who try to micromanage agent output will struggle. Developers who learn to specify, verify, and iterate will thrive. The 10% that went up 1000x is judgement and verification. The 90% that went to zero is the typing.

Ford captured the emotional complexity of this moment perfectly: "All of the people I love hate this stuff, and all the people I hate love it." The social friction is real. Developers adopting AI tools often face pushback from within their professional communities. It adds a psychological layer to what is fundamentally an economic shift.

But this isn't really about AI enthusiasm or AI scepticism. It's about industrialisation. It has happened over and over in every sector, and the pattern is always the same: the people who industrialise outcompete those who don't. You can buy handmade pottery from Etsy, or you can buy it mass-produced from a store. Each proposition values different things. But if you're running a business that depends on pottery, you'd better understand the economics.

Even after the hype cycle ends, and it will, open-source local LLMs will remain. Any decent developer workstation can already run them with decent results. The cost curve only goes in one direction.

There's one more number worth mentioning. As of early 2026, approximately 4% of GitHub commits are authored by Claude Code alone. That's not a forecast. That's the current state. The percentage is only going to grow.

Stop optimising for code production. Start optimising for system definition.

That's where the value lives now.
