---
author: Pere Villega
pubDatetime: 2026-03-17
title: "AI Is an Exoskeleton, Not a Coworker"
draft: false
tags:
  - ai
  - opinion
  - software-engineering
  - productivity
  - developer-experience
  - cognitive-debt
description: A rigorous study found AI-assisted developers are 19% slower yet believe they're 24% faster. The gap reveals that AI is best understood as an exoskeleton — amplifying human judgment rather than replacing it — and that the real risk isn't bad code but cognitive debt from velocity without understanding.
series: "ai-developer-evolution"
seriesOrder: 2
seriesSection: "working-with-agents"
---

A rigorous 2025 study found that developers using AI tools are 19% slower than developers without them. The same developers believed they were 24% faster.

That's a 43-percentage-point gap between perception and reality. I'll be honest: when I first saw those numbers, my reaction wasn't "See? AI is overhyped." It was "That explains a lot about the conversations I've been having."

## The Productivity Paradox

If you stop at the headline, the conclusion writes itself: AI tools don't work, full stop. But the study doesn't say that. It says bolting AI onto existing workflows makes things worse. Those are very different claims.

The METR study (a proper randomised controlled trial with 16 experienced open-source developers, 246 real tasks, screen recordings, and $150/hour compensation) is one of the most methodologically rigorous studies of AI developer productivity to date. The developers used primarily Cursor Pro with Claude 3.5/3.7 Sonnet, frontier models at the time. Tasks averaged two hours each, on repositories the developers had contributed to for years, averaging over a million lines of code and 22,000+ GitHub stars.

This is the J-curve productivity dip. Every major tool adoption goes through it. Early digital cameras produced worse photos than film for experienced photographers. The first automobiles were slower and less reliable than a good horse. The tools are optimised for a different way of working, and your existing processes create friction that negates or reverses the speed gains. The 19% slowdown is not a verdict on AI. It's a verdict on unreformed workflows.

What I find most revealing is why developers misjudged their own performance so badly. Screen recordings showed that AI-assisted coding had more idle time. Not just "waiting for the model" time, but periods of no activity at all. The likeliest explanation is that coding with AI requires less cognitive effort, making it easier to zone out or check Slack. You feel like you're working faster because each moment of active work is easier. But the total wall clock time is higher.

I recognise this in myself. On days when I lean heavily on AI tools, I feel like I've accomplished more. Sometimes I have. Sometimes I check the commit log and discover I've spent three hours on what should have been forty-five minutes, because I kept iterating on prompts instead of just writing the code. The perception-reality gap is something you have to actively monitor, and that's an uncomfortable admission for someone who writes about these tools.

Domenic Denicola, the jsdom maintainer and one of the study participants, pushed back on the "learning curve" explanation. Agent mode, he said, "is just not that hard to learn." The real factors were different: these were expert developers on codebases they'd worked on for five or more years with 1,500+ commits. They were already fast. The room for AI to help was narrow, and the overhead of integrating AI suggestions into deeply familiar code was real.

Google's 2024 DORA report confirms the pattern at enterprise scale. As I discussed in the previous chapter, 75% of developers felt more productive with AI tools while measurable delivery speed and system stability both declined with increased adoption. The perception-reality gap isn't limited to a 16-person study. It's systemic.

The fix isn't better prompts. It's redesigning how you work.

## The METR Follow-Up

METR attempted a follow-up study in late 2025 with a larger pool of developers and newer tools. It failed. Not because the methodology was wrong, but because developers refused to participate in tasks that barred AI use.

One developer from the original study, when asked to return: "I'm torn. I'd like to help provide updated data on this question but also I really like using AI!"

Another from the new cohort: "My head's going to explode if I try to do too much the old-fashioned way because it's like trying to get across the city walking when all of a sudden I was more used to taking an Uber."

A third admitted to biased task selection: "I avoid issues like AI can finish things in just 2 hours, but I have to spend 20 hours. I will feel so painful if the task is decided as AI-disallowed."

METR concluded that the selection effects made the new data unreliable. But I'd argue the selection effects themselves are the finding. Developers who experienced AI tools, even ones that measurably slowed them down, can't go back. Something about the experience is compelling enough to override the productivity data.

I get it. I genuinely do. The cognitive texture of coding with AI assistance is different in a way that's hard to articulate to someone who hasn't experienced it. It's not that every task is faster. It's that the frustrating parts are less frustrating, and that changes how the entire workday feels. More on why in a moment.

For the subset of original developers who did participate in the later study, METR estimated an 18% speedup, a dramatic reversal from the 19% slowdown. They caution against reading too much into this given the selection bias, but the direction is suggestive: tools got better, developers adapted their workflows, and the J-curve may be bending upward.

## The Multiplier Thesis

There's a probable reason for the discrepancy of results between both studies. AI is a tool, but a particular type of tool: a multiplier. Tools are only useful when handled properly, for the right tasks. And multipliers are only as useful as the input. Put together, it means AI needs to be used for the right tasks, with the right caveats.

Deep domain knowledge plus strong judgment plus clear thinking produces transformative output when amplified by AI. Vague instructions plus no ability to evaluate what comes back produces confident-sounding garbage at scale. This isn't a minor distinction. It determines whether AI makes you better or just makes you faster at being wrong.

This is why the "AI will replace experts" narrative has it backwards. AI commoditises the ability to produce. It makes the ability to evaluate production the differentiator. And evaluation is what experts do.

Consider a concrete example from another study: a purchasing agent generated a vendor comparison. Clean table, defensible scoring, looked thorough. A procurement director with 15 years of experience flagged in 30 seconds that two "vendors" were subsidiaries of the same parent company, changing the entire risk calculation. The AI didn't know. Nor could it: the information existed in the director's memory of a 2019 merger, not in any document the agent had accessed.

That's what expertise actually is: pattern recognition accumulated through thousands of decisions where the consequences were real. AI can generate, but it cannot reliably evaluate its own output with that kind of contextual, stakes-aware judgment.

I see this daily in my own work. The output I get from AI tools when I know a domain well is categorically different from the output I get when I'm exploring unfamiliar territory. In the first case, I can spot the subtle errors, redirect when the approach is wrong, and extract real value. In the second case, I'm essentially hoping the AI got it right, and hope is not a strategy.

The new bottleneck isn't production. Production is now cheap, fast, and accessible. The new bottleneck is evaluation. If you're good at it, you just became significantly more valuable, because your judgment now operates at the speed of AI generation instead of the speed of manual production.

## Why "Exoskeleton" Is the Right Metaphor

I've used several metaphors for AI tools in the past. Nail guns. Monkey Paws. Multipliers. Each captures something real, but none of them quite captured the thing that makes developers unable to go back even when the data says they're slower.

Ben Gregory at Kasava proposed a frame that I think gets closest: AI isn't an autonomous coworker. It's an exoskeleton. And he didn't just assert this, he grounded it in actual exoskeleton deployment data, which turns a nice analogy into something with real teeth.

Ford's EksoVest, deployed in 15 plants across 7 countries, produced an 83% decrease in injuries. Workers still do 4,600 overhead lifts per day. The exoskeleton didn't reduce the lifts. It made them sustainable.

In the military, the Sarcos Guardian XO provides 20:1 strength amplification: 100 pounds feels like 5 pounds. The exoskeleton keeps the soldier operational. It doesn't fight for them.

There are many more examples. But the pattern is the same every time: the exoskeleton never replaces the human. It amplifies what the human can already do. The human is still doing the work: dramatically more of it, more sustainably, with less fatigue. AI fulfils the same role for knowledge workers.

This, I think, explains the METR follow-up study. The developers who can't go back aren't making an irrational choice. Even when the wall-clock time was higher, the subjective experience was of lower cognitive effort per unit of progress. They still tackled the whole thing, but they had more left at the end, able to do more.

## The Compounding Effect

Gregory's most important insight, and the one I keep coming back to, is that the real gains from exoskeletons aren't linear. They compound.

A 15% reduction in running energy cost doesn't just mean 15% farther. It means faster for longer, with better form, quicker recovery, and therefore better performance the next day too.

In software: when developers aren't spending mental energy on boilerplate, commit messages, planning docs, and issue formatting, they have more cognitive capacity for the creative work that actually moves products forward. The AI exoskeleton doesn't just save time on specific tasks, it preserves cognitive resources for the tasks that require human judgment.

This is the strongest version of the argument, and it's the one I find most compelling: AI's impact should be measured not in tasks automated but in human capacity freed. If the bottleneck is evaluation and judgment, and I've just argued it is, then anything that preserves cognitive resources for evaluation is multiplying the scarce resource.

## Cognitive Debt

I wouldn't be giving you the full picture if I presented the exoskeleton metaphor without the corresponding risk. Margaret-Anne Storey, a well-known software engineering researcher, published a concept in February 2026 that I think every developer using AI tools needs to understand: cognitive debt.

Technical debt lives in the code. Cognitive debt lives in the developers' minds. Even if AI agents produce code that's clean and well-structured, the humans involved may have lost their shared understanding of what the programme does, how their intentions were implemented, and how it can be changed over time.

Storey coached a student team that used AI to "prompt" features into existence for weeks. By weeks 7-8, they hit a wall. They could no longer make even simple changes without breaking something unexpected. The team initially blamed technical debt, but the real problem was deeper: no one could explain why certain design decisions had been made or how parts of the system worked together. Their shared theory of the code had fragmented.

Simon Willison reports the same phenomenon on his own projects: after prompting entire features without reviewing their implementations, he found himself getting lost, no longer having a firm mental model of what the code can do and how it works.

I've felt the early signs of this myself. There's a specific moment I've learned to recognise: when I accept a large AI-generated change without fully understanding it because "the tests pass and I need to move on." Each time that happens, my mental model of the codebase gets a little blurrier. Do it enough times and you're navigating by GPS in a city you used to know by heart. You can still get where you're going, but you've lost the ability to take shortcuts or spot when the directions are wrong.

Martin Fowler, commenting on Storey's work, drew a useful parallel to his own long-standing distinction between "cruft" and "debt" in codebases. The cognitive equivalent of cruft is ignorance, of the code and of the domain. The debt metaphor still applies: either it costs more to add new capabilities (paying interest), or you make an explicit investment to gain knowledge (paying down principal). Which you do depends on the relative costs.

Fowler also noted something that connects cognitive debt to context engineering: "The Venn Diagram of Developer Experience and Agent Experience is a circle." The practices that make codebases easier for humans to understand, like clear modularity, descriptive naming, good documentation, also make them easier for AI agents to work with. Fixing cognitive debt and improving agent performance are the same activity. I find that insight deeply reassuring. It means investing in code quality isn't at odds with AI-assisted development, it's a prerequisite for it.

This is the real risk of AI-assisted development. Not that the code is bad, it might be fine. But velocity without understanding isn't sustainable. The exoskeleton makes you stronger, but you still need to know where you're going.

## The Adoption Journey

Mitchell Hashimoto, creator of Terraform, Vagrant, and the Ghostty terminal, described his personal AI adoption journey in a way that resonated with my own experience. His framing: meaningful tool adoption necessarily goes through inefficiency, then adequacy, then workflow-altering discovery. You must force yourself through the first two phases. There are no shortcuts.

Hashimoto's first move was to reproduce all his manual commits with agentic ones, literally doing the work twice. Excruciating, but he rediscovered from first principles what others were saying. Three things emerged:

- First, break sessions into separate clear, actionable tasks. Don't try to do everything in one mega session.
- Second, for vague requests, split into planning versus execution sessions.
- Third, and this is the most important, if you give an agent a way to verify its work, it usually fixes its own mistakes and prevents regressions.

He also found the edges of what agents were and weren't good at. Part of the efficiency gains came from knowing when *not* to reach for an agent. That negative space is something very important. There are tasks where one can be genuinely faster with AI, and tasks where reaching for it is a procrastination mechanism dressed up as productivity. Learning to tell the difference is half the battle.

## The Window

If you've read this far and haven't started experimenting seriously with AI tools, here's what I'd tell you.

Don't start with the easy stuff. Start with your hardest current problem. Simple tasks teach you nothing because the prompt is trivial and the output is uninteresting. Hard problems force you to articulate context: what you're trying to accomplish, what constraints exist, what you've tried, what the risks are. That process of articulation is the actual skill, and it only develops under pressure.

Fifteen minutes a day on a real problem from your actual work builds intuition faster than any course, tutorial, or Twitter thread. The METR follow-up tells us something important: once developers cross the threshold, they don't come back. AI fluency compounds. Every week of real usage builds judgment that cannot be acquired through reading about it. That judgment will help you understand when to use it, and when to avoid it.

The window is open now precisely because adoption among experienced professionals is uneven. Most are ignoring these tools or using them for tasks so trivial it barely matters. That won't last.
