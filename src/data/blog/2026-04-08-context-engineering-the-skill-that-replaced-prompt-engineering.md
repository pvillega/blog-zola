---
author: Pere Villega
pubDatetime: 2026-04-08
title: "Context Engineering: The Skill That Replaced Prompt Engineering"
draft: false
tags:
  - ai
  - context-engineering
  - developer-tools
  - productivity
  - ai-developer-evolution
  - knowledge-management
  - software-architecture
description: "Your prompt is 0.1% of what the model sees; the other 99.9% is context engineering. A four-layer framework for thinking about prompts, practical guidance on what belongs in context and what doesn't, the invisible context problem from a million-line codebase, and why agent-controlled retrieval beats RAG for cross-file reasoning."
series: "ai-developer-evolution"
seriesOrder: 6
seriesSection: "working-with-agents"
---

I spent an embarrassingly long time optimising prompts before I realised I was solving the wrong problem.

Your prompt is 200 tokens. The model's context window is 1,000,000. That means your carefully crafted instruction is 0.1% (well, more like 0.0002%) of what the model actually sees. The other 99.9% is context engineering: CLAUDE.md files, tool definitions, MCP outputs, files the agent has read, conversation history. If your agent isn't performing, I'd argue you shouldn't rewrite the prompt. You should redesign the context.

## The Distinction That Matters

Prompt engineering optimises the instruction. Context engineering optimises the environment. The difference is the same as writing a good email to a colleague versus building a good wiki for your team. The email helps once. The wiki helps every time. Well, not if it is Confluence, so assume a good wiki instead.

If prompt engineering is not the way, what should we do? What are the steps towards that useful environment?
There's a framework I find useful for thinking about this. It uses a prompt, but encodes four perspectives or layers on it, each building on the one below.

The first layer is **prompt craft**: writing clear, specific instructions. This is table stakes. Every tutorial teaches it and, although I suspect this is a controversial take, I consider it the least important layer once you move beyond toy examples. It's necessary, but it's not where the real wins are.

The second is **context engineering**: curating everything in the context window beyond your prompt. What the model sees, how it's structured, what's missing. This is where most of the gains live for coding agents, and it's what this post is about.

The third is **intent engineering**: encoding goals and boundaries for agents working autonomously. The constraints, success criteria, and verification steps that let you delegate without micromanaging. If you've ever written a task brief for a contractor and come back to something completely different from what you expected, then you know the gist of it: same problem, different executor. This is not **prompt craft**; it is not about clarity, it is about precision. You could use [caveman](https://github.com/JuliusBrussee/caveman) and it would still be fine, if the intent is there, no gaps.

The fourth is **specification engineering**: making organisational knowledge agent-executable. Design docs, API schemas, domain models, etc., structured as blueprints that agents can follow rather than prose that humans interpret. Claude Code, for example, is **very good** at reading `dot` diagrams, which are less ambiguous than some phrasing.

Most people are optimising layer 1 when the problem is in layers 2, 3, or 4. I'd argue layer 2 is where 80% of the gains are hiding for most teams right now as it's the most accessible and the most underinvested.

## What Good Context Looks Like

In my experience, context should focus on the HOW: standard operating procedures, runbooks, how to test the full app. If you use non-standard practices, also document how to instrument, how to write tests, how to feature flag, or any other custom process. The HOW provides tools and guidance without restricting output. Think of it as setting up the workbench rather than dictating what to build. The WHAT, the task itself, will use all this context to complete itself.

There's also a layer of context that informs architectural decisions: ADRs, mission statements, domain knowledge. These help the agent make choices that align with your organisation's approach rather than defaulting to whatever's most common in its training data. I've lost count of the times an agent has defaulted to using Kubernetes just because the project has a Dockerfile and Kubernetes has a lot of tutorial coverage. Context fixes this.

The most important principle, I think, is that context should be easy to access and, the more important it is, the easier it should be. All general context should be co-located with the codebase as much as feasible. Accessed via CLAUDE.md (just [keep it small](./2026-03-23-the-one-file-that-makes-or-breaks-your-ai-workflow/)), a docs folder in the repo, or reference files loaded on demand via a memory MCP.

This includes a plan file for tasks in progress, so that an agent can stop at any point and resume without losing track of work done. If your context window fills up or the agent crashes or goes off on a tangent, the plan file is your recovery mechanism. Most people who complain about agent "forgetfulness" don't have one of these as they are one-shotting things, and that's the actual root cause, not some deficiency in the model.

## The Invisible Context Problem

But how do you figure out what belongs in context and what doesn't? Someone else's pain is instructive here.

Michael Mueller at re:cinq published [an analysis of what they learned](https://re-cinq.com/blog/your-engineering-org-is-a-prompt) building with OpenAI's Harness Engineering team, a team of 3 to 7 engineers, 1 million lines of code, for 5 months. The key lesson sounds obvious until you internalise it: from the agent's perspective, anything it can't access in-context doesn't exist.

The architectural decision aligned in a Slack thread? Invisible. The domain model in someone's head? Invisible. The convention everyone "just knows"? Invisible. If it's not in the repo, structured and current, it's not real. This is not a hypothetical failure mode; it's Tuesday.

What failed for them was a massive instruction file telling the agent everything. Context is a scarce resource and a giant instruction file crowds out the actual task. Too much guidance becomes non-guidance; the same principle as when everything is important, nothing is. And it rots instantly. Sound familiar? It's the same failure mode as those 200-page onboarding documents nobody reads. We've been making this mistake long before agents came along.

What worked was treating instructions as a table of contents pointing to a structured knowledge base. All the design docs, architecture decision records, API schemas, domain models. All version-controlled, all in-repo, all machine-readable. The instructions tell the agent where to look, not what to think, and the agent loads on demand.

Some context is harder to colocate, like Slack conversations, ADRs in Confluence, or GitHub PRs. These should be given access via MCP if necessary, but with the understanding that by its nature this context may not always be loaded completely or when needed. Anything critical should be co-located and documented properly. If you're relying on an MCP connection to Slack for knowledge that determines whether the agent builds the right thing, then you're setting yourself up for a bad time.

## Reducing Context Needs

Of course, the best context is the context you don't need. A lot of context takes too much of the limited context window. Yes, limited. Even with 1M context window, the [needle in a haystack problem](https://arxiv.org/abs/2510.05381) still exists.

There are structural ways to reduce this. None of them are particularly novel, which I suspect is part of why they're undervalued.

The first is keeping tasks small. A well-scoped task needs less context than a vague one. "Add a retry mechanism to the payment service with exponential backoff" needs the context for that service. "Improve the payment system" needs the context for everything. A vertical slice from UI to database needs the context for that slice, not the entire codebase. Scoping isn't just good project management, it's context management.

The second is writing good code with low coupling. When modules are well-separated, the agent only needs to read the relevant ones. This is not a new insight; it's the same reason humans prefer well-structured codebases. But it matters more now because the cost of poor structure is measured in token waste and degraded model performance, not just developer frustration.

The third is uniform stack choices. Consistent patterns, database, and language across the project mean less context explaining variations. Every time the agent has to understand "oh, this service uses a different ORM," that's context budget wasted on accidental complexity. This also means using less popular libraries or conventions has a penalty, which is an unfortunate side-effect.

Following good engineering practices (surprise!) makes AI tools work better. I suspect this will be a recurring theme in this series. And, honestly, if the main outcome of the AI agent era is that it finally forces teams to maintain good practices and clean architecture, I'll take it.

## Loading Context at the Right Moment

So you've structured your knowledge base, co-located the important bits, and kept tasks small. But there's a subtlety that's easy to miss: _when_ context gets loaded matters almost as much as _what_ gets loaded.

Most CLAUDE.md setups I've seen, including my own early attempts, take a static approach. You list everything the agent might need upfront, or you rely on the agent to figure out what to read. Both have problems. Loading everything upfront wastes context budget on things that turn out to be irrelevant. Relying on the agent to self-serve means it often doesn't; it ploughs ahead with whatever's already in the window, confident it knows enough. (Narrator: it did not know enough.)

The better pattern, I think, is using hooks. Adding some bits of classical software that trigger automatically when certain events occur in the agent's workflow. In Claude Code, for example, you can set up a hook that fires after the user submits a request. That hook can inspect the task, identify which documents are likely relevant, and inject them into context before the agent starts working. Hooks can use Haiku to execute a task, which may be an alternative to a coded script to load context, with the downside of some LLM randomness added to the mix. In either case, the agent doesn't decide what to load; the infrastructure decides for it, based on the task at hand.

This is a meaningful distinction. It moves context loading from "the agent remembers to look things up" to "the system ensures the right context is present." It's the difference between hoping a new team member reads the onboarding docs and having an automated checklist that blocks them until they do.

Which brings me to a related insight that [Jesse Vincent articulated well](https://blog.fsck.com/2026/04/07/rules-and-gates/): the difference between rules and gates. Most CLAUDE.md files I encounter are full of rules like "always read the style guide before writing code," "check the ADR folder before making architectural decisions," "run tests before committing." These are sensible instructions. They're also, in practice, suggestions. The agent can rationalise skipping any of them. "The style guide probably doesn't apply to this utility function." "The ADR folder is unlikely to cover this edge case." "I'll run the tests after this next change." Rules have an invisible opt-out path, and agents (like humans) will find it.

A gate, by contrast, is a condition the agent can evaluate objectively before proceeding. Instead of "verify claims with web research before asserting them" (a rule), you write "when a claim about what exists or doesn't exist is forming → web search happens → URLs in hand → then speak" (a gate). The test is concrete: do I have URLs? If no, I haven't cleared the gate. There's no version where the agent proceeds without either doing the search or explicitly flagging the claim as unverified.

The practical difference is enormous. When your CLAUDE.md lists context files to load for different task types, framing those as gates rather than rules means the agent can't skip them and rationalise it later. "Before modifying any API endpoint → read `docs/api-contracts.md` → confirm the relevant contract is in context → then proceed" is a gate. "Remember to check the API contracts" is a rule. One blocks progress until the condition is met. The other is a polite suggestion that competes with the agent's eagerness to start coding.

Combine the two, hooks plus gates, and you get something approaching a reliable context delivery system. Not perfect, but a significant step up from hoping the agent reads the right files at the right time.

## XML Tags and Delimiters

This might seem like a formatting detail, but it's actually [fundamental to how models parse context](https://glthr.com/xml-fundamental-to-claude). Bear with me.

XML tags and delimiters aren't a stylistic preference. They're a structural signal that helps the model distinguish between different types of content in the context window. When you wrap instructions in `<instructions>` tags and examples in `<example>` tags, you're signalling transitions between first-order expressions (what you want) and second-order expressions (examples of what you want). Without them, the model has to guess where one type of content ends and another begins, and it doesn't always guess right.

The practical impact of this change is better prompt reliability, fewer cases of the model confusing your instructions with your examples, and clearer boundaries between different pieces of context. It's a small investment with measurable returns. If you're not already doing this, it's probably the single cheapest improvement you can make today.

## Context Is the New Code

I opened this post by saying I was solving the wrong problem by optimising the 0.1% instead of the 99.9%. Mueller's framing captures why: context engineering is not prompt engineering. It's a discipline of maintaining structured, version-controlled knowledge that agents consume. Not glamorous. Not a breakthrough. Just good information architecture, applied consistently. Which, if I'm being honest, describes most of the things that actually work with agentic coding. Nothing very new, just old good best practices.

The same insight that drives CLAUDE.md drives the best engineering organisations: if it matters, make it machine-readable and put it in the repo. Everything else is invisible.

This is an organisational capability, not just an individual practice. The teams that build the best context infrastructure (the most complete, most current, most agent-accessible documentation of how their systems work) will get the best results from AI agents. The teams that keep their knowledge in Slack threads and people's heads will wonder why their expensive AI tools aren't delivering. And they'll blame the tools.

They'll be wrong, but they'll be very confident about it.
