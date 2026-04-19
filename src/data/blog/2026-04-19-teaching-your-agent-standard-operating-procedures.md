---
author: Pere Villega
pubDatetime: 2026-04-19
title: "Teaching Your Agent Standard Operating Procedures"
draft: false
tags:
  - ai
  - ai-developer-evolution
  - agents
  - skills
  - hooks
  - claude-code
  - workflow
description: "Skills are Standard Operating Procedures the agent loads only when needed — progressive disclosure applied to AI context. Without a forced-eval hook they activate 55% of the time; with one, 100%. That gap is the difference between skills working and skills being decoration. Plus why hooks are the enforcement layer that makes any of it reliable."
series: "ai-developer-evolution"
seriesOrder: 10
seriesSection: "working-with-agents"
---

A few weeks ago I built a skill called `tdd-guard`. Seventy lines of SKILL.md, clear triggers in the description, a supporting `references/` folder with Beck-style test desiderata. It was meant to fire whenever I asked Claude to "write a test," "add a test," or "TDD this function." I tested it by asking "add a test for the `parseSchedule` function." Claude happily wrote a test.

Without ever loading the skill.

I checked `/context` expecting to see it invoked. Nothing. Asked again, phrased differently: "do TDD on `parseSchedule`." Skill fired. Different wording, different outcome, same task. That was the day I stopped treating skills as documents the agent reads and started treating them as procedures the agent has to be reminded to consider. The activation layer is not an implementation detail; it's the whole game.

[eferro](https://www.eferro.net/2026/03/encoding-experience-into-ai-skills.html), a practitioner with decades of engineering experience, puts the upside plainly: with CLAUDE.md, your TDD guidelines, your Docker best practices, your refactoring workflow all sit in context permanently, competing for the window whether relevant or not. Skills solve this differently. CLAUDE.md loads everything. Skills load only when needed. That's the promise.

The problem is the word "needed." Who decides?

## What Skills Are

Skills are Standard Operating Procedures as markdown files that guide agent behaviour. Think of them as runbooks the agent follows. Not vague guidelines, but step-by-step procedures for specific tasks. Type `/mutation-testing` and the agent inherits expertise in mutation testing. The rest of the time, that knowledge stays out of the way.

The [Agent Skills specification](https://agentskills.io/specification) formalises the structure. A skill is a directory containing a `SKILL.md` file with YAML frontmatter: a required `name` (max 64 characters) and a required `description` (max 1024 characters). Alongside it you can have `scripts/` (executable code), `references/` (on-demand documentation), and `assets/` (templates, schemas). The spec recommends keeping `SKILL.md` under 500 lines and the main body under 5,000 tokens, with heavier material in referenced files.

Skills follow the Progressive disclosure pattern, in three tiers. Metadata (~100 tokens of name + description) is loaded at startup for every available skill. The `SKILL.md` body is loaded only when the skill activates. Everything in `scripts/`, `references/`, and `assets/` is loaded on demand. [Anthropic's announcement](https://www.anthropic.com/news/skills) states it plainly: "Only loads what's needed, when it's needed." The name and description are the entire budget the model has to decide whether a skill is relevant. Every other byte is invisible until after activation.

That is the trade-off. CLAUDE.md is always in the room, shouting every rule at every prompt. A skill is a folder the agent might remember exists. If the metadata is not good enough, or doesn't include some rule you care about, that rule may well never fire. There is a balancing act between the content in the body of a skill and what goes into the metadata section.

But for many use cases, a skill plus a CLI tool is lighter and more context-efficient than an MCP server. Skills give you the extensibility of MCP without the persistent token bill. This connects to the [previous post's argument about context](./2026-04-15-surviving-the-context-window-in-practice).

## Skills vs Commands vs Rules vs Subagents

Let's start with Commands: they have been deprecated in favour of Skills. This is the official Anthropic posture, by the way. Commands were descriptions of a procedure, in a single file, stored in `~/.claude/commands/`, that the user could invoke with `/command-name`. Skills replace them. They provide more capability, they can also be triggered via a slash command, and they let the agent load them on demand. In fact, you can configure a skill so that it can only be triggered by the user via a slash command, effectively creating a more powerful version of the old Commands.

Skills, Subagents, and Rules have some overlap, and the distinctions trip people up, as they are not clear-cut.

Skills live in `~/.claude/skills/`. They are multi-file workflow definitions activated when the agent (or a hook, or the user) decides they're relevant. They can trigger complex flows and use external CLIs during execution. They provide reference material to increase knowledge for a task, or reusable workflows that should be executed in the same manner each time.

Rules in `~/.claude/rules/` are markdown files Claude should always follow, split by concern (`security.md`, `coding-style.md`, `testing.md`). They are an extension of your `CLAUDE.md`, broken by themes so that they are easier to maintain, and with some additional capabilities like [path-dependent activation](https://code.claude.com/docs/en/memory#path-specific-rules). They load every session, as they are essentially a complement to `CLAUDE.md`. This means that you should use them sparingly or you're back to the context bloat you were trying to escape when you trimmed your `CLAUDE.md`. Do not use them for Standard Operating Procedures, and do not add to them knowledge the agent already has. Use them to indicate particularities for the project, for example specific rules related to security or to how tests must be organised.

Subagents in `~/.claude/agents/` are the heaviest tool: standalone files, each getting a fresh context window, optionally running in parallel. The main purpose is to delegate a task to a fresh context window, while allowing the main context to act as orchestrator. This reduces costs and improves performance (smaller context window used during the task), and they can load skills themselves. This is a source of confusion: do we need a skill that does research, or an agent for research?

The answer is nuanced; it depends. You may want to have a research skill so that you can trigger it on demand, at any point. But if you always end up using a separate context window for it, having it as an agent makes sense, as it avoids the agent having to find and load the skill for that very particular task. Just remember that subagents can load skills, so when in doubt, start with a skill.

A concrete case from last month. I was writing a security review workflow. First instinct: "this is a skill, security review is a procedure." Then I realised the review had to read 40+ files across the repository. If I put that inside a skill running in the main thread, every file read would land in my main context window, and by the time the review finished I'd be at 60% capacity with nothing interesting done yet. So the security review became a subagent: fresh context, reads what it needs, returns only the finding list. The SOP (how to review, what to look for, the severity rubric) is still there, but it is loaded inside the subagent, not the main thread.

Summary that works for me: skills activate conditionally, rules load always, subagents run independently. Anthropic has a [section](https://code.claude.com/docs/en/agent-sdk/claude-code-features#choose-the-right-feature) on when to use each that may help make this clearer.


## What a Good Skill Description Looks Like

This is where most people go wrong. I did too, for longer than I should have.

[Dachary Carey analysed 234 community skills](https://dacharycarey.com/2026/02/13/agent-skill-analysis/) against the spec. 33% of community skills (71 of 218) failed validation outright. Even Anthropic's own collection wasn't clean: 3 of 16 official skills failed, with 8 errors and 39 warnings. The failures cluster:

- **Broken links**: placeholder URLs never intended to resolve, HTTP errors, missing internal file references.
- **Structural non-compliance**: skills with non-standard directory names, or with files at the root instead of spec-recognised directories.
- **Keyword-stuffed descriptions**: skills treating the description field like SEO metadata, instead of useful descriptions.
- **Token bloat**: a majority of fully analysed skills exceeded the 5,000-token guideline. Several blew past 25,000 tokens. The extreme outlier hit 2,979,492 tokens. Yes, nearly three million.

The median `SKILL.md` body is 2,725 tokens. The outliers drag the average into the absurd. Ignoring issues on the body means that your skill will not work correctly, but it may still trigger.

The description field is what determines whether the skill activates. You only get 1,024 characters. They have to say *when* to use the skill, not *what* it does in detail. Here is what bad looks like, and it's not that much of an exaggeration:

```yaml
---
name: tdd-guard
description: TDD testing unit integration behaviour-driven development test-first red-green-refactor assertions mocks spies stubs fakes quality software-engineering best-practices xunit junit
---
```

That is a keyword soup. The agent's matcher has nothing to grip. Compare:

```yaml
---
name: tdd-guard
description: Use when the user asks to write a new test, add a test, practise TDD, do red-green-refactor, or when a feature requires a failing test before any implementation. Enforces test-first discipline and rejects code written without a failing test first.
---
```

Triggers named explicitly. Conditions stated. A sceptical description like this fires on "add a test for `parseSchedule`", the phrasing that failed me earlier, because "add a test" is now an explicit trigger, not an inferred one.

The [obra/superpowers](https://github.com/obra/superpowers) collection is the model to study. Exactly 14 skills, including `brainstorming`, `writing-plans`, `executing-plans`, `test-driven-development`, and a few others. Lean. Focused. Each skill does one thing. The median body well under the 5,000-token guideline. And they are triggered when needed, activation rarely fails. A good example of how to write a skill; refer to them when creating new ones.


## Proving the Skill Actually Fires

Writing a good description is half the job. Verifying that the description does what you think it does is the other half, and it is the half most of us skip.

Anthropic ships a `skill-creator` meta-skill. A skill for building skills. The March 2026 update added an eval capability: you give it a set of representative prompts, and it runs your skill against them, grading output with and without the skill loaded. It even includes a trigger-description optimisation loop that rewrites the description, tests variants against your prompts, and picks the one that fires most reliably. I wrote about the whole thing in more depth in [the Skills 2.0 walkthrough](./2026-04-01-claude-code-skills-2-what-changed-what-works-what-to-watch-out-for), so I'll keep this short. The important part is that you now have a way to measure instead of guessing.

A few caveats worth knowing before you reach for it.

Claude does not consult skills for short, simple prompts. If your eval set is full of one-liners like "format this data," the skill won't fire even with a perfect description, because the model just handles the task directly. Your prompts need enough complexity to cross the threshold where Claude actually pauses to consider whether a skill applies. Copy messy, half-formed prompts from your actual history: the ones with typos, missing context, and file paths. If you can't find five real examples, you probably don't need the skill yet.

The description budget bites here too. The trigger optimiser helps, but it's fighting the 1,024-character ceiling. Anything past that is truncated, so front-load the key triggers.

One more framing worth borrowing. [Anthropic's engineering blog](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) splits skills into *capability uplift* (teaching the model something it can't already do) and *encoded preference* (sequencing things it already can do, your team's way). They need different evals. Capability skills need evals that detect model progress: if the base model starts passing without the skill loaded, the skill's techniques have been absorbed into the model. Preference skills need evals that verify process fidelity: did it follow *your* sequence, not a plausible-looking alternative. Same tool, different question.

Worth remembering from my previous post: Vercel's eval comparing skills to an 8KB compressed reference in AGENTS.md found the skill was never invoked in 56% of cases, and even with explicit instructions it only reached a 79% pass rate, while the AGENTS.md baseline hit 100%. Evals do not just tell you whether the skill works when it fires. They tell you whether it fires at all.


## The Activation Problem

Using `skill-creator` will help you refine the description so that it triggers on the right prompt. With a caveat: the model you are using (not Claude, but the specific model) is the one deciding if it triggers. And even with a match, the model may decide not to load the skill.

[Scott Spence tested skill activation across 5 configurations using sandboxed evals](https://scottspence.com/posts/measuring-claude-code-skill-activation-with-sandboxed-evals): Daytona sandboxes running `claude -p` with `--output-format stream-json`, parsing the JSONL for `Skill()` tool_use events, 22 test cases per run. Without hooks, activation ran at 55% and 50% across two runs. With a forced-eval hook, 100% across both runs. 22 of 22.

A coin flip versus certainty. That's the gap the model had at that point. Newer models released since then have, arguably, better trigger rates. But it is still not 100%. There is still a gap.

The deeper finding is worth internalising: activation is keyword matching, not semantic understanding. Prompts with explicit framework terminology ("$state rune", ".remote.ts", "command()") fired reliably at around 100%. Generic phrasings like "How do form actions work?" fired at 20–40%. Indirect queries like "my component re-renders too much" fired at 0%. The model does not reason about whether a skill might apply. It pattern-matches on the description text, and that text lives in a 1,024-character budget.

The forced-eval hook short-circuits the problem. It injects an instruction into the session: for every user prompt, enumerate each loaded skill, decide YES/NO whether it applies, then act. Spence's bash script states bluntly: "You MUST call Skill() tool in Step 2. Do NOT skip to implementation."


The hook script outputs an instruction on stdout, which Claude Code treats as context for that turn (per the [hooks reference](https://code.claude.com/docs/en/hooks), `UserPromptSubmit` stdout is added as context Claude sees). The instruction: "For each of the following skills, decide YES or NO whether it applies to the user's prompt. Then invoke matching ones via the Skill() tool before doing anything else." A few dozen lines of bash, one event, and 55% becomes 100%.

This is something very important to understand about skills. Without the hook, you are building on a foundation that activates roughly as often as it doesn't. It is not optional; it is the difference between skills working and skills being decoration. And it costs little effort or tokens.

One recommendation, though: if you use the hook, ask your model of choice (Opus 4.7 at the time of this writing) to evaluate the text and improve it. It can make optimisations to reduce token cost, according to its own capabilities.

## A War Story

The `tdd-guard` skill from the opener. I'd written it with what I thought was a pushy description: "TDD workflow, test-first development, red-green-refactor, testing best practices." Keyword-stuffed, in hindsight. When I asked "add a test," Claude wrote a test without consulting the skill. Nothing in the description said "add a test" was a trigger. The model was doing substring matching, not semantic reasoning.

Two fixes. I rewrote the description to explicitly name the triggers ("Use when the user asks to write a new test, add a test, practise TDD…"), using the `skill-creator` skill provided by Anthropic. The description wasn't a random choice; it was what the evals said was better. Then I added the forced-eval hook. 100% match when doing TDD. The skill itself was fine. The description and the activation layer were the bottleneck.

Lesson I wish I'd learned earlier: write the description *as if* the reader is a keyword matcher with no access to your intent. Because that is what it is. And take advantage of `skill-creator` to refine it.

## Lifecycle Events for Workflow Enforcement

Skills tell the agent what to do. Hooks tell the harness what to enforce. They are the layer that makes workflows reliable rather than aspirational.

Hooks fire at specific points in the Claude Code lifecycle. The [official reference](https://code.claude.com/docs/en/hooks) covers roughly 28 events. The handful you'll actually use: `PreToolUse` (fires before a tool call; exit 2 to block), `PostToolUse` (after a tool completes; ideal for auto-formatting), `UserPromptSubmit` (before Claude processes the prompt; stdout is injected as context, which is how forced-eval works), and `Stop` (when the main agent finishes; ideal for verification gates).

At first glance, hooks seem a tool for advanced users with esoteric flows. In practice, they are essential even for simple workflows. They are the deterministic layer that constrains the stochastic agent. Let me show some examples of simple but powerful use.

Example one: a PostToolUse hook running prettier on `.ts/.tsx/.js/.jsx` files after edits handles the last 10% of formatting Claude misses:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/format-on-save.sh",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

Example 2: a PreToolUse hook blocking `.md` creation unless the filename is README or CLAUDE.md stops the agent from scattering documentation files across the repository. (If you've ever returned to a branch and found six new markdown files you didn't ask for, you know why this exists.)

Example 3: [Trail of Bits](https://github.com/trailofbits/claude-code-config) uses what I'd call an anti-rationalisation gate. A `Stop` hook that reviews Claude's final response and rejects it if Claude is rationalising incomplete work: claiming issues are "pre-existing," deferring to unrequested "follow-ups," listing problems without fixing them, skipping test and lint failures with excuses. Their hook uses `type: "prompt"` rather than `type: "command"`, sending the hook's prompt plus Claude's response to a fast model (Haiku) that returns a yes/no judgment. If the judgment is "rationalising," the reason becomes Claude's next instruction: go back and actually finish. Worth stealing. Agents are remarkably good at explaining why they didn't finish something.

[Nick Tune went further](https://nick-tune.me/blog/2026-02-28-hook-driven-dev-workflows-with-claude-code/), building hooks as a workflow adapter. The aggregate is a proper state machine: `planning → developing → reviewing → committing`. `git commit` is banned in the `developing` state; you can only transition to `committing` after `reviewing`. Hooks check whether a requested tool call is allowed in the current state and block it if not. State-specific instructions are injected at each transition. The workflow engine has 100% test coverage, because it's a programming language, not a prompt. Sophisticated, but the move is simple: make invariants explicit, enforce them at the harness layer.

If writing hook configurations in JSON isn't your idea of a good time, the [`hookify`](https://claude.com/plugins/hookify) plugin lets you create hooks conversationally. Describe what you want ("block `rm -rf` outside the project directory"), get a validated configuration file placed in `.claude/`, active immediately.

By the way, you can be very granular with hooks, to the point of defining particular hooks that only exist inside a given [skill or subagent](https://code.claude.com/docs/en/hooks#hooks-in-skills-and-agents). These hooks only live while the skill or subagent is active, but they let you build precisely targeted gates on the behaviour.

## Workflow Systems

Put it together: skills as SOP definitions, hooks as state machines and enforcement layer, subagents for isolated context. Stacked up, this stops looking like "prompting" and starts looking like workflow engineering. The vocabulary changes with it.

Three projects are worth studying because they take the idea seriously. [GSD (Get Stuff Done)](https://github.com/gsd-build/get-shit-done) wraps skills and hooks around a spec-driven development loop. [ed3d](https://github.com/ed3dai/ed3d-plugins) ships Claude Code plugins as reusable workflow components you can compose. obra's [superpowers](https://github.com/obra/superpowers) treats skills as the unit of reuse and hooks as the enforcement mechanism that keeps the agent on rails. Different framings, same move: codify the workflow once, let the agent execute it every time, instead of rolling the dice on interpretation.

Each workflow you encode is a workflow you never have to explain again. A week of careful skill-writing becomes months of reclaimed attention. Of course, the compounding only happens if the skill triggers. Which is the uncomfortable part of the `tdd-guard` story: the SOP was fine, the value was real, but the activation layer was doing none of the work.

I'd argue the next phase of skill-building is less about writing more skills and more about writing better *activation layers*. Better descriptions. Better evals to refine those descriptions. Hooks that survive without being load-bearing. The skills themselves are the easy part now; we know what good looks like. Getting the agent to reach for them, reliably, without a forced-eval hook holding its hand; that is the next step.

Until that lands, the whole game sits in 1,024 characters and the model's willingness to read them. Write them like it matters. It does.
