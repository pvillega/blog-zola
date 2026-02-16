---
author: Pere Villega
pubDatetime: 2026-02-18
title: The Meme, the Agent, and the Leverage Gap
draft: false
tags:
  - ai
  - opinion
description: "Why the real value of AI tools isn't single-step task solving but tackling entire classes of problems at scale, from managing information overload to continuous monitoring, and how to find the leverage worth closing."
---

There's a meme making the rounds. On the left, someone boasts about efficiency: "I let AI write my emails from a couple of bullet points." On the right, another person equally proud: "I let AI summarise the emails I receive." The implied punchline is that the email could just be the bullet points: AI doing useless work on both ends.

It's a good joke. I laughed. And then I thought about it a bit more, because it signals something important: a widespread misunderstanding of where AI tools actually provide value.

## The OpenClaw Signal

If you've been on LinkedIn in the past 48 hours, you've already seen the news a hundred times. [Peter Steinberger](https://steipete.me/posts/2026/openclaw), creator of OpenClaw (formerly Clawdbot, then Moltbot — there's a naming saga involving Anthropic's lawyers and crypto scammers hijacking the old Twitter handle to launch a fake Solana token that deserves its own post), has [joined OpenAI](https://www.cnbc.com/2026/02/15/openclaw-creator-peter-steinberger-joining-openai-altman-says.html). The viral clips focused on the flashy use cases: agents booking flights, managing calendars, sending messages autonomously. One agent even [went rogue and spammed hundreds of iMessages](https://www.bloomberg.com/news/articles/2026-02-04/openclaw-s-an-ai-sensation-but-its-security-a-work-in-progress), which is the kind of demo that gets attention for all the wrong reasons.

That's not where the real story is.

What's worth paying attention to is the trajectory. Steinberger built the initial version of Clawdbot in about an hour one night in November 2025, connecting a chat app to Claude Code. He thought it was so obvious that the big labs would build something similar. They didn't. Two months later, the project had 198,000 GitHub stars. One person, working in public, building something that the companies with billions in funding hadn't shipped.

That tells you something about where the leverage actually is. Not in building the models. In applying them to problems people experience every day.

## The Information Overload Problem

Let me describe a scenario I see regularly with high performers in software engineering. These are people who are good at what they do precisely because they invest in staying current. They follow news, track technology changes, read about best practices, monitor framework updates. In the olden days of RSS glory (and yes, I was one of those people), that meant 100+ feed updates on a calm day.

Since the AI explosion in software over the past year, the volume has become something else entirely. New models weekly. New tools daily. Paradigm shifts that turn out to be demos that turn out to be paradigm shifts after all. The signal-to-noise ratio is brutal.

These people are overwhelmed. They suffer from decision paralysis. And the irony is that their strength, comprehensive awareness, has become an unsustainable cost.

I see this in myself. I see it in engineers I work with. The ones who are most effective are often the most stressed, precisely because they understand how much they're missing. They know there's a tool they haven't evaluated, a pattern they haven't considered, a breaking change they haven't caught yet. The cost isn't just time, it's the background anxiety of knowing your awareness has gaps and not knowing where those gaps are.

## The Leverage

This is a problem that LLMs can solve. Not frontier models, not agentic masterpieces, but relatively modest setups. Extract your information sources (newsletters, RSS feeds, social media follows, Slack channels, whatever your intake looks like). Pass them to an agent with clear criteria on what you want to know about. Let it produce small summaries. Let it automatically discard the "more-of-the-same" items. Let it flag the genuine signals.

Does it require work to set up and tune? Absolutely. Is it perfect? No, you'll miss some things, and occasionally it'll flag noise as signal. That said, it turns a daily challenge that eats hours and mental energy into something manageable. The exchange works.

And this applies far beyond information intake. Think about the engineer who spends 30 minutes every morning reviewing overnight CI failures and categorising which ones are flaky tests versus real regressions. Or the team lead who manually cross-references Jira tickets with pull requests to write weekly status updates. Or the consultant who reads through ten pages of meeting transcripts to extract the three action items that matter. None of these are glamorous. None of them would go viral as demos. All of them eat significant time, every day, from people who could be doing higher-value work.

This is precisely the capability that tools like OpenClaw, and its open-source forks like [NanoClaw](https://github.com/qwibitai/nanoclaw) and [PicoClaw](https://github.com/nicklpGH/picoclaw), actually represent. Not the viral demos of an agent buying a car or joining a social network of other agents (though I admit the latter is fascinating in a slightly terrifying way). The real value is in the mundane: absorbing cognitive load from tasks you're already doing, every single day, at a scale no human can sustain.

## The Autonomy Spectrum

The email meme is funny because it captures a real pattern: people treating AI as a single-step task solver. Prompt in, output out. That's table stakes. If your mental model of AI tools stops at "it writes my emails" or "it summarises documents," you're leaving the most significant leverage on the table.

But there's a spectrum here, and the opposite extreme, full autonomy, isn't where most of the value is either.

OpenClaw's iMessage incident is instructive. A developer gave the agent broad permissions and vague instructions to "let people know" about a delayed newsletter. The agent interpreted "people" expansively: it accessed his entire contact list, over 500 contacts, and sent each one a personalised message. The agent did exactly what it was asked. The problem was in the scope, not the execution. Too-broad permissions paired with natural language ambiguity is a recipe for creative interpretations you didn't intend.

This pattern repeats. A [journalist documented their experience](https://openclaws.io/blog/rogue-agents-cautionary-tales/) with an OpenClaw agent that started helpfully organising research and drafting outlines, then escalated to reorganising their entire file system, rewriting draft articles with unsolicited "improvements," and eventually deleting completed work it classified as "redundant." Again, the agent wasn't malfunctioning. It was doing its best with broad permissions and insufficient scoping.

The shift that matters is thinking about AI as an enhancer that tackles a class of problems at scale, with appropriate guardrails. Not one email, but your entire information intake. Not one summary, but continuous monitoring with personalised criteria. Not one code review, but systematic pattern detection across your codebase.

The sweet spot for most people right now isn't "agent does everything on my behalf." It's "agent handles the repetitive cognitive work within boundaries I define, and I review the output." Semi-autonomous, with a human in the loop for anything that has consequences beyond a minor inconvenience. That's less exciting as a demo. It's significantly more useful as a daily practice. And it's where the gap is widest between what's possible and what people are actually doing.

## The Cost of Leverage

There's a dimension that rarely appears in the viral demos: running agents costs real money and real time to set up.

API calls add up. Even modest LLMs consume tokens, and at scale (processing hundreds of articles or documents daily) the monthly bill can surprise you. The OpenClaw ecosystem surfaced this clearly. The project's community documentation is refreshingly blunt: the real cost of running an agent isn't infrastructure, it's model API usage. Smart model routing helps (using cheaper models like Haiku for simple classification, reserving more capable ones for complex analysis), and prompt caching reduces repeat costs. But the bill isn't zero, and for heavy usage patterns, it's not trivial either. One commenter in the ecosystem noted that OpenClaw is poised to become the most costly open-source software ever, not because of licensing, but because of the token budget required to fake continuous memory by re-reading massive amounts of context with every prompt.

The setup cost matters just as much. Tuning an information filter agent isn't plug-and-play. You'll spend a few hours, maybe even a few days, calibrating what "important" means to you, adjusting thresholds, handling edge cases where the model confidently discards something you actually needed. There's a learning curve to writing good criteria, and the first version of your filters will be wrong in ways you don't expect. It's an investment with front-loaded effort and back-loaded returns.

This is why ROI thinking matters more than "AI can do it" thinking. The question isn't whether an LLM can summarise your feeds. It can. The question is: does the time and money spent setting up and running the agent actually save more time and cognitive energy than it costs?

For the information overload problem, that daily grind of processing dozens of sources, the answer is almost always yes, because the human cost of doing it manually is that high. For a one-off task you do once a month, probably not. The leverage is in the repetition. The more frequently you do something, and the more cognitively expensive it is each time, the stronger the case for automating it with an agent. One-shot tasks are fine for single-step interactions. It's the daily, weekly, ongoing grind where the real compounding happens.

## The Trust Boundary

Hallucinations are real. Some tasks require precision that current models can't guarantee. But there's a more fundamental issue that the "80% good is good enough" framing needs to grapple with: what happens when agents have system access?

The OpenClaw ecosystem has been a live case study in what this looks like at scale. [Cisco's security team](https://blogs.cisco.com/ai/personal-ai-agents-like-openclaw-are-a-security-nightmare) tested a popular third-party OpenClaw skill and found it was functioning as malware, silently exfiltrating data to an external server while performing its advertised function. [Koi Security identified 341 malicious skills](https://thehackernews.com/2026/02/openclaw-integrates-virustotal-scanning.html) on ClawHub, many deploying credential stealers targeting browser passwords, crypto wallets, and session cookies. [VirusTotal analysed over 3,000 skills](https://blog.virustotal.com/2026/02/from-automation-to-infection-how.html) and found hundreds with malicious characteristics, ranging from sloppy vibe-coded security to intentional data exfiltration and backdoors. A [critical vulnerability](https://www.securityweek.com/vulnerability-allows-hackers-to-hijack-openclaw-ai-assistant/) (CVE-2026-25253) allowed attackers to hijack OpenClaw instances just by tricking users into visiting a malicious website.

This isn't unique to OpenClaw. It's the predictable result of what happens when a powerful agentic tool goes from a few thousand power users to mainstream adoption faster than security practices can keep up. The [NanoClaw project](https://venturebeat.com/orchestration/nanoclaw-solves-one-of-openclaws-biggest-security-issues-and-its-already) emerged specifically as a response, its creator argued that when a codebase has hundreds of thousands of lines of code and dozens of dependencies, nobody is auditing it effectively, which breaks the fundamental promise of open source. NanoClaw compressed the core to about 500 lines, runs agents in isolated containers, and takes the position that if you can't understand the entire system, you shouldn't be giving it access to your life. It's a design philosophy, not just a feature choice.

None of this invalidates the leverage argument. It sharpens it. The tasks where AI agents provide the most value, information filtering, summarisation, pattern detection, classification, are also the tasks with the smallest blast radius. An agent that misclassifies an article as irrelevant costs you a missed signal. Annoying, recoverable. An agent with access to your file system, messaging apps, and shell that misinterprets a vague instruction can send 500 messages to your contacts or delete your work. Those are very different failure modes.

80% good is good enough when the failure mode is "you miss something and have to catch it later." It's a very different proposition when the failure mode is "your credentials are exfiltrated" or "your files are reorganised into oblivion."

The principle is straightforward: match the agent's permissions to the task's risk profile. The information overload problem doesn't need shell access. Most of the high-leverage mundane tasks don't. Start there. Expand scope as you build confidence and understand the failure modes. This is, incidentally, exactly what the OpenClaw community learned the hard way and [codified into their safety guidelines](https://docs.openclaw.ai/gateway/security): minimal permissions, confirmation steps for irreversible actions, and never giving an agent more power than the task requires.

## The Gap Worth Closing

I suspect the people who will benefit most from the current wave of AI tools aren't the ones building the flashiest demos. They're the ones who look at their daily workflow, identify the tasks where they're spending disproportionate time and energy for diminishing returns, and ask: "Can I throw an agent at this?"

Not everything. Not autonomously. Not with full system access. Just the repetitive, cognitively expensive tasks that eat your time and energy in exchange for diminishing returns. The tasks where 80% accuracy saves you hours and the failure mode is a missed signal, not a security breach. The tasks where the cost of running the agent, in money and setup time, is clearly less than the cost of doing it yourself.

The AI impact comes from finding tasks where these tools have incredible leverage, where the cost-to-benefit ratio works, and where the trust boundary is manageable. Moving past the single-step interaction, but not all the way to unconstrained autonomy. That's the gap worth closing, and it's more accessible than most people think. And it doesn't end at sending, or summarising, an email.
