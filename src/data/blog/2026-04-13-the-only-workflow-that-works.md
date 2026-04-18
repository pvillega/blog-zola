---
author: Pere Villega
pubDatetime: 2026-04-13
title: "The Only Workflow That Works"
draft: false
tags:
  - ai
  - ai-developer-evolution
  - agents
  - workflow
  - software-engineering
  - planning
  - productivity
description: "AI agents amplify whatever engineering process they're given. Bad specs produce confident garbage at machine speed. Three practitioner workflows for separating planning from execution: the normal coding flow, Boris Tane's annotated plan cycle, and Jamon Holmgren's Night Shift spec discipline. The pattern is simple; the discipline is resisting the urge to skip straight to implementation."
series: "ai-developer-evolution"
seriesOrder: 7
seriesSection: "working-with-agents"
---

A few months ago I watched an agent burn through an entire context window implementing a feature I hadn't properly specified. It compiled. Tests passed. It worked confidently, thoroughly, at machine speed. And it did the wrong thing.

I'd given it a vague brief and it filled every gap with plausible improvisation. That afternoon cost me more rework than the feature was worth.

"If you drink from a hose, the limitation is not how much water flows out of the hose."

The issue has never been coding speed. If speed was the key to great engineering, all interviews would test your typing speed. Engineering practices exist for a reason. And agentic AI has an interesting effect: it's exposing what doesn't work.

No good testing? Pain. No small iterations? Pain. No feedback loops? Pain. No clear specifications? The agent fills every gap with confident improvisation, and you end up with code that compiles, passes tests, and does the wrong thing.

## Engineering Practices Matter

Small rant: up until recently, there was no realistic way to prove what were best practices. You could say SAFe was a steaming pile of turds, but people whose pay depended on it being important couldn't or wouldn't see it. [DORA metrics](https://dora.dev/research/) appeared, but most of the industry lagged behind even knowing they existed.

AI agents have become the ultimate forcing function. If your processes are bad, the agent amplifies the badness at machine speed. If your processes are good (small iterations, clear specs, fast feedback, comprehensive testing), the agent [amplifies that too](https://lpalmieri.com/posts/agentic-coding-raises-quality/).

I suspect the best results come from applying classic software engineering discipline to AI collaborations. Not novel AI-specific workflows. Classic discipline. This might be the single most underappreciated insight in the entire "AI-assisted development" space, and I'd argue it's the hill worth dying on.

## The Normal Coding Flow

So what does this look like in practice? Here's the workflow that consistently produces good results for me.

It starts with **brainstorming a detailed specification with the AI.** Describe the idea and ask the LLM to iteratively ask you questions until you've fleshed out requirements and edge cases. By the end, compile this into a comprehensive `spec.md`. The catch, and the bit where skill matters, is that you can't generate a spec for the full system. It won't fit in the context. Scope management is everything: feed the LLM manageable tasks, ideally self-contained vertical slices from UI to database.

Once the spec exists, **break the plan into small, logical, bite-sized tasks.** You can iterate on this, editing and asking the AI to critique or refine it. Each task should be small enough for a subagent to handle within its context window.

Then **implement each task, in order, committing results.** Because the tasks are small, the implementation is straightforward. Small tasks are easier to review. The output is stochastic. You need to verify that the code is what you expect and the tests make sense. Small commits with good messages document the development process, which helps during [code review](https://simonwillison.net/guides/agentic-engineering-patterns/anti-patterns/), and as Simon Willison puts it, if you open a PR with hundreds of lines of unreviewed agent code, you're delegating the actual work to your collaborators.

Finally, **provide a way for the AI to [check its own work](https://www.philschmid.de/closing-the-loop).** CI/CD, linters, type checkers, test suites, etc. These become your feedback loops. The agent writes code, the automated tools catch issues, the agent fixes them, with you overseeing the high-level direction.

The principle underlying all of this? Don't make the AI operate on partial information. Do a "brain dump" of everything the model should know: high-level goals, invariants, examples of good solutions, warnings about approaches to avoid. If you're using a niche library, paste in the docs. If you know naive solutions that are too slow, say so. I've found that the ten minutes spent on context engineering saves hours of rework downstream.

## The Annotated Plan Workflow

The normal flow works. But is there a way to make it better?

[Boris Tane](https://boristane.com/blog/how-i-use-claude-code/), the author of the ["SDLC Is Dead" essay](https://boristane.com/blog/the-software-development-lifecycle-is-dead/), has a workflow that I believe is the most refined version of the research-plan-implement pattern.

**Phase 1: Research.** Deep-read the task directive. The agent examines the codebase thoroughly. You push it with explicit language like "deeply," "in great detail," "go through everything". Findings go into a persistent `research.md` file. Not a verbal summary in chat. A real artefact you can review.

**Phase 2: Planning.** The agent writes `plan.md` as a real artefact. Not using the built-in plan mode but producing an actual file you can open in your editor. Plans include the approach, code snippets, file paths, and trade-offs considered.

**Phase 3: The annotation cycle.** This is where the work actually happens. You open the plan in your editor and add inline notes:

"Use drizzle:generate for migrations, not raw SQL."
"No, this should be PATCH, not PUT."
"Remove this section, we don't need caching here."

Then tell the agent: "I added notes, address them, don't implement yet."

One to six rounds of this. Each round, the plan gets more precise. The explicit "don't implement yet" guard is essential: without it, the agent jumps to code the moment it thinks the plan is good enough. By the time implementation starts, every decision has been made.

**Phase 4: Implementation.** Boring by design. The plan is so detailed that implementation is mechanical execution. This is the goal. All the interesting decisions happened in phases 2 and 3.

Is this overkill for every task? Of course. A quick bug fix or a small refactor doesn't need six rounds of annotation. It's a judgement call. But for anything that touches multiple files or introduces new patterns, the annotation cycle pays for itself. The trade-off is time spent planning vs time spent unwinding bad assumptions, and in my experience, bad assumptions always cost more.

## The Night Shift Approach

What if you took the annotation cycle and removed yourself from the loop entirely?

That's essentially what Jamon Holmgren does with his [Night Shift workflow](https://jamon.dev/night-shift). He writes specs during the day with no AI help beyond quick lookups and a concise gap checklist. Then he hands them to agents overnight. The specs are for his own thinking, not the agent's consumption. By the time the agent touches code, every decision is already made.

This is the annotated plan workflow taken to its logical conclusion. The specs _are_ the plan. And the discipline of writing specs that stand on their own, without you there to clarify, turns out to be the hard part. Holmgren says it gets easier with practice, and he's likely right, as writing specs and detecting gaps is becoming easier the more I use agents for coding.

I haven't fully adopted the overnight loop, though. I'm not disciplined enough yet to produce the level of specs needed without human correction, but the spec-writing discipline has noticeably improved my own planning phase. Even if you never run agents overnight, writing specs as if you won't be there forces a rigour that improves everything downstream.

## Separate Planning From Execution

The critical principle running through all of this is to separate planning from execution. Research fills context, and you may do a lot of research. Once done, save the plan to a file, clear the session, start fresh. Implement from the file, with a full context window ready to be used. The agent doesn't need to remember how the plan was created. It needs to execute the plan.

Let me reinforce the point. One temptation is keeping research, planning, and implementation in a single long session. Don't. The research phase consumes context with tool use, file reads, and web searches. By the time you get to implementation, you might have only a fraction of your context window remaining. Not only that, you risk that context related to the research contaminates the implementation. A library you don't want is used because it was mentioned, and discarded, during research. Instead, save everything to disk and clean the context in between.

This approach has a bonus benefit: if the agent crashes or goes off on a tangent, you have the plan on disk. You can restart from any point without losing the work, and the agent will detect the parts that have already been implemented.

The approach can be extended to work in a specific phase. For example, the spec feels okay, but we know that gaps cause pain later, because the model fills them with whatever's in its training data. When in doubt, clearing the session and asking a fresh instance to review the spec for gaps catches things you missed. Even repeating this a few times helps; each review surfaces different issues because the output is non-deterministic. More expensive in tokens at the start, but it saves many more rewrite tokens later on.

## Review Before Proceeding

This bears repeating: always review output before committing. Challenge things. Ask why a particular approach was chosen. The output is stochastic; just because it makes sense doesn't mean it's correct.

I'm not talking about reviewing the generated code. At the stage of use we are discussing in this section, the size of the code to review is likely manageable. But as we delegate more and more to agents, this won't be the case, so code review (assuming you are testing the result, verifying it does what it should) is optional. Spec review is not. A bad spec will generate the wrong code, often in subtle ways.

The good news is that rewriting code with an LLM is cheap. If the approach is wrong, throw it away and try again with better constraints in your spec. The cost of regeneration is tiny compared to the cost of shipping something broken. This is a genuine mindset shift: code is now disposable. The spec and the tests are the valuable artefacts.


The pattern is deceptively simple: research thoroughly, plan carefully, annotate until it's boring, then let the agent execute. The discipline isn't in the tools. It's in resisting the urge to skip straight to implementation, which, if we're honest, is the urge that got us into trouble with software engineering long before AI entered the picture.
