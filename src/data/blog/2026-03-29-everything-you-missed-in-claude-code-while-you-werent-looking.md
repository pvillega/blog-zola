---
author: Pere Villega
pubDatetime: 2026-03-29
title: "Everything You Missed in Claude Code While You Weren't Looking"
draft: false
tags:
  - ai
  - claude-code
  - developer-tools
  - productivity
  - automation
  - mcp
description: "Claude Code has shipped more features in four months than most tools ship in a year. Here's a practitioner's map of everything that changed since Opus 4.5 — rules, skills 2.0, hooks, MCP evolution, remote control, Cowork, plugins, and the dozen slash commands you probably haven't tried yet."
---

If you blinked sometime between late November 2025 and now, you missed a lot.

I've been using Claude Code daily since before Opus 4.5 dropped, and even I've had moments of discovering a feature that apparently shipped three weeks ago while I wasn't paying attention. The release cadence has been relentless. Weekly updates, sometimes multiple per week, each quietly adding capabilities that would have warranted their own blog post if any other company had shipped them. The [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md) reads like a firehose.

This post is my attempt to catalogue what's actually changed since Opus 4.5 (November 2025) and make sense of which bits matter. It's not comprehensive as I'd need a small book for that, but it covers the changes that have altered how I work day to day, plus a few I'm still evaluating. If you've been heads-down in your codebase and relying on muscle memory from six months ago, consider this your catch-up guide.

Fair warning: this is a long one. Grab a coffee. Or two.


## From Tool to Platform

The single most important shift is conceptual, not technical. Claude Code is no longer "a coding assistant in your terminal"; it's an agent platform that happens to live in your terminal. The combination of skills, hooks, plugins, custom agents, background tasks, remote control, MCP servers, and Teams means you can now build workflows on top of Claude Code that look nothing like "ask AI to write a function."

Whether that excites you or makes you nervous probably depends on which fulcrum you're currently sitting at (I wrote about [those fulcrums recently](https://perevillega.com/posts/2026-03-15-fulcrums-of-ai-developer-evolution)). On to the specifics.


## Opus 4.6

First, the obvious: [Opus 4.6 shipped in February 2026](https://www.anthropic.com/news/claude-opus-4-6) and is now the default model in Claude Code. The jump from 4.5 to 4.6 is significant. [METR's benchmarks](https://metr.org/time-horizons/) put its 50%-time horizon at around 14.5 hours of human-equivalent work. For context, when Claude Code launched with Sonnet 3.5, that figure was about 21 minutes. That's roughly a 41x improvement in sixteen months. Sonnet 4.6 followed a couple of weeks later, priced the same as Sonnet 4.5.

In practice, what this means is that tasks I used to break into three or four steps now often succeed as a single prompt. The agent makes fewer wrong turns, recovers from errors more gracefully, and produces code that needs less cleanup. Not perfect, not yet, but noticeably better. If you tried Claude Code six months ago and bounced off it, the model upgrade alone is worth a second look.


## Rules: Improving CLAUDE.md

A pattern I suspect many of us fell into: your CLAUDE.md started at 30 lines. Then it grew to 100. Then 300. Then Claude started ignoring half of it because when everything is high priority, nothing is. Surprising, I know.

The [rules system](https://code.claude.com/docs/en/memory) fixes this. Instead of one monolithic file, you create focused rule files in `.claude/rules/` that are scoped to specific file patterns using glob matching. A rule about React component conventions only loads when Claude is working on `.tsx` files. Database migration safety rules only appear when touching migration files. Your Python linting preferences don't pollute your Rust context.

```
.claude/rules/
├── react-components.md     # globs: ["src/**/*.tsx"]
├── api-conventions.md      # globs: ["src/api/**/*"]
├── migration-safety.md     # globs: ["**/migrations/**"]
└── testing-standards.md    # globs: ["**/*.test.*", "**/*.spec.*"]
```

CLAUDE.md hasn't gone away, it's still your project-level briefing document. But rules handle the contextual, file-type-specific instructions that were bloating it. Think of CLAUDE.md as the team onboarding doc and rules as the style guide for each domain. Jose Parreño Garcia wrote [a detailed breakdown](https://joseparreogarcia.substack.com/p/how-claude-code-rules-actually-work) of how scoped rules actually work in practice that's worth reading.

There's also `CLAUDE.local.md` for personal preferences you don't want committed to version control (your editor quirks, verbosity preferences, that sort of thing), and the global `~/.claude/CLAUDE.md` for defaults that apply across all your projects.

One caveat worth flagging: rules, like `CLAUDE.md`, are still advisory. Claude follows them most of the time, but not deterministically. If something absolutely must happen every time without exception, that's what hooks are for.


## Hooks: Deterministic Guardrails

If rules and CLAUDE.md are "Claude, please do X," hooks are "X will happen whether Claude likes it or not." Hooks are user-defined commands, prompts, or agents that execute automatically at specific points in Claude Code's lifecycle. They fire every time their conditions are met without exceptions, no "the model decided to ignore it."

This is the feature that bridges the gap between "best practice" and "enforced practice." And it's grown significantly since its early incarnation.

### The Event Model

As of March 2026, Claude Code supports a substantial number of lifecycle events. The ones you'll likely use most are:

**PreToolUse** fires before Claude executes any tool (file writes, bash commands, searches). This is the only hook that can *block* actions. An exit code 2 cancels the tool call, exit code 0 allows it, exit code 1 logs a warning but proceeds. This can, for example, restrict  using a tool due to security/safety concerns. The hook also allows you to modify the input passed to the tool, so you can make changes on the fly to correct issues instead of blocking the tool. Granted, this is only useful in particular scenarios, but it's a nice to have.

**PostToolUse** fires after a tool completes. Can't undo what already happened, but it's perfect for cleanup: formatting, linting, logging, running tests. This is where auto-formatting lives.

**Stop** fires whenever Claude finishes responding (not just at task completion, but any response). Useful for final validation, running the test suite, or nudging Claude to keep going if criteria aren't met. A subtlety: if your Stop hook tells Claude to continue, it will, which can create infinite loops if you're not careful. The community has learned this the hard way, tokens may have been harmed during testing.

**SessionStart** fires on session startup, resume, or clear. Inject dynamic context. For example, I have a hook using this event that tells Claude about all my command alias. This way it doesn't waste tokens figuring out that `grep` failed because it is in fact `rg` and the flag it passed to it doesn't work.

Those are just a few commonly used events. But there are also newer events like **Notification** (async, for routing alerts to Slack or desktop notifications), **PreCompact** (before context compaction), and the recent **Elicitation** and **ElicitationResult** events (v2.1.76+) for intercepting MCP server input requests and programmatically provide the values.

### Handler Types

The events are varied and provide a lot of opportunities to improve your workflows. But you need to act on the event. Hooks support four handler types, which is more versatile than I initially expected:

**command**: shell commands. Likely, your most common choice. Your formatter, linter, or custom script runs as a subprocess.

**http**: POST requests to a URL endpoint. Useful for integrating with external services, say to send a Slack notification or log to an observability platform.

**prompt**: sends the hook context to an LLM for evaluation. This means that you can have one LLM validating another LLM's actions in real time. The cost is pennies per check if using the right models, and it lets you make context-dependent decisions that a regex can't handle ("does this code change touch any production database configuration?").

**agent**: spawns a full subagent to handle the hook. While `prompt` runs a single query (think about `claude -p` for comparison), this spawns a full agent with the tools and context window associated. The heaviest option, but powerful for complex validation or automated review.

### Performance Considerations

Hooks run synchronously, as a result every matched hook adds latency to the tool call it gates. If, let's say, each completes in under 200ms then there is no issue. If a hook takes 500ms, your session will start feeling sluggish. Profile your hooks with `time` before deploying them, and beware as this is one of those situations where less-is-more: fewer hooks with real value are better than too many hooks that run always but are needed a fraction of the time.

Also worth knowing: hooks fire for subagent actions too. If Claude spawns a subagent, your PreToolUse and PostToolUse hooks execute for every tool the subagent uses. Your safety gates apply recursively, which is exactly what you want. It also makes hook-performance even more important.

A very important detail many people aren't aware of: **Skills can declare their own hooks in the frontmatter**, which only fire while that skill is executing. Your `/careful` skill can block destructive commands, your `/freeze` skill can prevent edits outside a directory, and neither interferes with your normal workflow. This is powerful for creating self-contained, context-specific safety gates, without paying the cost when is not needed.

You can inspect active hooks with `/hooks` in the CLI, and disable all of them at once with `"disableAllHooks": true` in your settings file. The [official hooks guide](https://code.claude.com/docs/en/hooks-guide) has the full JSON schemas and event documentation.


## MCPs

The [Model Context Protocol](https://www.anthropic.com/news/model-context-protocol) isn't new. Anthropic open-sourced it in late 2024. But the way it [integrates with Claude Code](https://code.claude.com/docs/en/mcp) has changed substantially since Opus 4.5, and if you set up your MCP servers months ago and haven't touched them since, you're probably not taking advantage of the recent improvements.

### What MCP Actually Does

For those who haven't dug in yet: MCP is a standardised protocol for connecting AI agents to external tools. Each MCP server exposes a set of tools that Claude can invoke during a session. Think GitHub operations, database queries, browser automation, Slack messages, whatever the server provides. The protocol follows a client-server model over JSON-RPC, with Claude Code acting as the client.

```
┌──────────────┐  JSON-RPC    ┌──────────────┐
│  Claude Code │ ◄──────────► │  MCP Server  │
│   (client)   │  stdio/SSE   │  (e.g. Slack)│
└──────────────┘              └──────────────┘
```

In practice, this means you can tell Claude to "implement the feature described in JIRA issue ENG-4521, check Sentry for related errors, and create a PR on GitHub" and it can do all of that without you leaving the terminal. The tools are just available.

### Tool Search

The most impactful recent MCP change is tool search, enabled by default since early 2026. Previously, all MCP tool schemas loaded into context at session start. If you had a few servers with dozens of tools each, that ate a meaningful chunk of your context window before you even started working. If you ever run `/context` after enabling the GitHub MCP or Playwright MCP, you know what I am talking about.

Tool search flips this. Only tool names load at startup. When Claude encounters a task that might need an MCP tool, it uses a search tool to discover relevant ones, and only the tools it actually uses enter context. The reported reduction in context consumption is up to 85%, which sounds less impressive with the new 1M context window, but it made a meaningful difference with smaller context windows. It still does.

Although the tool is enabled by default, you can configure the behaviour:

```bash
# Always enabled (default)
ENABLE_TOOL_SEARCH=true claude

# Auto: load upfront when schemas fit within 10% of context,
# defer only the overflow
ENABLE_TOOL_SEARCH=auto claude

# Custom threshold for auto loading (5%)
ENABLE_TOOL_SEARCH=auto:5 claude

# Disabled (legacy behaviour, load everything upfront)
ENABLE_TOOL_SEARCH=false claude
```

This is one of those changes that's easy to miss but makes a real difference if you run multiple MCP servers. Before tool search, there was a practical ceiling on how many servers you could connect without context degradation. That ceiling is now much higher.


### MCP Resources and @-Mentions

MCP servers can expose resources, structured data that you can reference using `@` mentions in your prompts, just like you reference files. Type `@` and you'll see available resources from all connected servers alongside your local files in the autocomplete menu. This is useful for pulling in structured data without making a tool call.

A couple of examples, so it is easier to understand:

```
Can you analyze @github:issue://123 and suggest a fix?

Compare @postgres:schema://users with @docs:file://database/user-model
```

### Elicitation

A newer MCP capability discussed already in the hooks section: servers can request structured input from you mid-task. If a server needs authentication, a file selection, or a configuration choice, it presents a dialog rather than failing silently. Since v2.1.76, you can intercept these requests with Elicitation hooks for automation, to auto-respond to certain server prompts without manual intervention.

### Context and Output Limits

MCP tool outputs can get large. Claude Code warns when any tool output exceeds 10,000 tokens, and the default maximum is 25,000 tokens. You can raise it:

```bash
export MAX_MCP_OUTPUT_TOKENS=50000
claude
```

Tool descriptions and server instructions are also now capped at 2KB each to prevent OpenAPI-generated servers from bloating context, a change that tells you exactly what problem the community was hitting.

### Deduplication and Configuration

A practical improvement: MCP servers configured both locally and via claude.ai connectors are now deduplicated, with local config winning. No more wondering why you have two GitHub servers loaded.

### Security Note

I'll be direct here: MCP servers can read and write your codebase. Every server you install is a potential attack surface. The community has flagged supply chain concerns, and MCP servers require the same vetting as any dependency you'd add to a project. Audit each server before granting permanent authorisation. Use `claude mcp add` with explicit environment variables rather than blanket permissions.

If you're running production MCP servers with sensitive data, keep an eye on the evolving security standards: NIST announced an AI Agent Standards Initiative in February 2026 that's directly relevant, if it moves forward. There's also a Google-led effort to add gRPC transport to MCP, which signals that enterprise adoption is pushing the protocol toward more serious infrastructure. The agent infrastructure layer is maturing faster than the governance layer around it, and that gap is where problems will emerge.

### Doubtful future

Despite all the new functionality for handling MCPs, included the very necessary `Tool search`, MCPs may be past their heyday. The community seems to be shifting towards using Skills and CLI tools instead of MCPs when possible, as they are more efficient both on performance and on token consumption. MCPs still have a role, for example in Claude Desktop where you are running an isolated VM without access to your local machine. But expect to be replacing them by skills as time goes.


## Skills 2.0: Commands and Skills, Unified

This one confused me for a while, so let me try to spare you the same experience.

Claude Code used to have two separate systems: **commands** (markdown files in `.claude/commands/`) and **skills** (markdown files in `.claude/skills/<n>/SKILL.md`). They've been merged. Both paths now create the same `/slash-command` interface, and Anthropic recommends the skills path going forward because it supports features that plain commands don't.

The name change isn't what matters; the new capabilities are:

**Frontmatter control.** Skills can now declare metadata that changes how they behave. `disable-model-invocation: true` means only you can trigger it (the agent won't invoke it automatically, use this for anything that needs supervision). `user-invocable: false` means only Claude can trigger it (useful for background conventions you want the agent to follow automatically). `allowed-tools` restricts which tools Claude can use, handy for read-only research skills that shouldn't be editing files.

**Effort frontmatter.** You can override the model's effort level when a skill is invoked. Low-effort for quick lookups, high-effort for complex analysis, or inherit the effort from the caller.

**Dynamic context injection.** Embed shell commands in your skill files using the `` !`command` `` syntax. When the skill loads, Claude runs the command and injects the output:

```markdown
---
name: pr-review
description: Review the current PR
---

Here's the PR diff:
!`gh pr diff`

Changed files:
!`gh pr diff --name-only`

Review these changes for correctness and potential issues.
```

**Subagent execution.** Set `context: fork` in the frontmatter and the skill runs in an isolated subagent with its own context window. The result gets piped back to your main conversation without polluting it. This is genuinely powerful for research tasks: you send a subagent to explore how the authentication system works while you keep coding in your main session.

**Supporting files.** Skills are directories, not single files. You can include templates, reference docs, example code, and scripts alongside your `SKILL.md`. Claude has access to all of it when the skill is invoked.

**Skill-scoped hooks.** As mentioned in the hooks section, skills can declare their own hooks in the frontmatter. These only fire during that skill's execution. A skill can be a fully self-contained workflow with its own validation, safety gates, and cleanup. A mini application, really.

But the most relevant change to skills is likely the [revamped skill-creator](https://claude.com/blog/improving-skill-creator-test-measure-and-refine-agent-skills). This is a [plugin](https://claude.com/plugins/skill-creator) for Claude Code that helps you develop skills. The key detail is that it runs evals and benchmarks on the skills you create or want to update, ensuring that the changes have measurable impact. You are no longer restricted to gut feeling regarding a skill, you can prove that it really performs better.


## The Slash Command Explosion

Slash commands is where the pace of change really shows. Claude Code has accumulated a [significant number of slash commands](https://code.claude.com/docs/en/commands), and several have quietly become essential to my workflow. Let me run through the ones that matter most, in case you missed them.

### /simplify

After making changes, `/simplify` reviews your recently modified files for redundancies, quality issues, and opportunities to clean up. It spawns three parallel review agents that each look at the changes from a different angle. I run this almost reflexively after any significant chunk of AI-generated code. It catches unused imports, redundant variables, overly complex conditionals, etc. The kind of cruft that accumulates when you're moving fast.

You can optionally pass a focus area: `/simplify error handling` or `/simplify reduce duplication`.

### /review

`/review` is the correctness-focused sibling of `/simplify`. Without arguments, it reviews your recent local changes. Pass a PR number (`/review 123`) or URL and it reviews that pull request instead. My workflow is typically: make changes → `/review` for correctness → fix flagged issues → `/simplify` for cleanliness. The two skills complement each other: `/review` for "is this right?" and `/simplify` for "is this clean?"

### /batch

This is a heavy hitter. `/batch` decomposes a change description into 5-30 independent units and spawns isolated worktree agents to handle them in parallel. Each agent works in its own git worktree, implements its unit, runs tests, and can even open a PR.

The trick is giving it a *pattern*, not a redesign. "Add error handling to all API endpoints" or "migrate all test files from Jest to Vitest" are good `/batch` instructions. "Redesign the API layer" is not. The work needs to be parallelisable and repetitive, the same transformation applied across multiple files or components. For anything more complicated, like new functionality, I still default to `Superpowers` and its flow.

### /loop

`/loop` runs a prompt repeatedly on a schedule while your session stays open. It's basically cron for your Claude Code session. The interval is optional (defaults to 10 minutes) and supports `s`, `m`, `h`, and `d` units. Tasks are session-scoped and expire after 3 days, so a forgotten loop won't run forever.

```
/loop 5m check if the deploy succeeded and report back
/loop 10m run the test suite and report failures
/loop 1h check deployment status and summarise metrics
```


You can also loop over other commands: `/loop 20m /review-pr 1234`. I've mostly used it for monitoring deployments and watching CI pipelines during longer sessions, but the possibilities extend to periodic code quality checks, log watching, or polling external services.

An example of a use case that highlights how Claude potential composes with more capabilities: giving Claude access to the logs of a Kubernetes deployment means I can ask it to check the logs and if it detects any errors, make a plan in `@specs/` on how to fix that issue. I can deploy, run end-to-end tests, and get back a list of fixes for any issues detected.

### /memory

`/memory` lets you view and edit Claude's persistent memory for the current project. Claude automatically saves useful context — conventions, architectural decisions, preferences — to a `MEMORY.md` file that persists across sessions. You can also explicitly ask Claude to remember something during a conversation.

This is different from CLAUDE.md in that it's auto-maintained. CLAUDE.md is what you tell Claude at the start; memory is what Claude learns as you work together. Whether you trust the agent to decide what's worth remembering is, again, a trust question. I still use other tools for this, but there is work ongoing in this area, like the mysterious `/dream` feature that appeared in the configuration recently. For sure, one to keep an eye on.

### /btw

Deceptively simple but I use it constantly. `/btw what's the syntax for a Rust match guard again?` gives you the answer in a dismissible overlay without entering it into your conversation history. Your main working context stays clean. It's free in context terms, use it liberally.

### /diff and /rewind — Your Safety Net

`/diff` opens an interactive diff viewer of all changes Claude has made. `/rewind` reverts both the conversation and file changes back to a previous checkpoint. These pair naturally: review with `/diff`, then decide whether to keep or discard with `/rewind`.

A practical tip: if `/diff` reveals something you don't like, `/rewind` and restart that part of the conversation with a clearer prompt. It's faster than trying to explain why the current approach is wrong.

### /compact

Not new, but worth mentioning because it now accepts focus instructions: `/compact focus on the API changes and the list of modified files`. You can also add standing instructions to your CLAUDE.md: "When compacting, preserve the full list of modified files and current test status."

I prefer to start new sessions instead of compacting, as there is always a risk of context being lost. I rather keep the specs in markdown. But many sources mention manual `/compact` at around 50% context usage as the sweet spot, so I had to mention it.


### /voice

Push-to-talk voice input. Hold Space, talk, release. I'll confess I haven't used this as much as I probably should as old habits die hard (and my accent is not the cleanest) but people who've integrated it into their workflow seem to swear by it. The recent fixes around push-to-talk key handling and audio recovery suggest Anthropic is investing here.

### /debug

When something goes wrong in your session — a tool call fails silently, Claude seems confused about context, or behaviour is inexplicably odd — `/debug` reads the session debug log and helps figure out what happened. Niche, but invaluable when you need it.

### /security-review

Shipped in February 2026. Reviews your codebase for vulnerabilities. I mention it mainly because it exists and I suspect many people don't know about it.

### /effort — Effort Level Control

This one is recent and easy to miss. `/effort low`, `/effort high`, `/effort max`, or `/effort auto` controls how much reasoning Claude puts into responses. Low effort means fewer tokens and faster responses; high and max mean more thorough analysis. You can also set effort per-skill via frontmatter, which is a nice touch: your quick lookup skills can run lean while your code review skill gets max effort.

### /sandbox

Enables sandboxed bash execution with filesystem and network isolation. This is Anthropic's open-source sandbox runtime, and it's a meaningful security improvement. Claude's bash commands run in an isolated environment rather than directly on your machine. Reduces the need for permission prompts too, since sandboxed operations are inherently safer. Run `/sandbox` to enable it.

The downside is that some tools don't work well with the sandbox. For example, `dotnet` in `macOS` has issues and Claude can't see its output as a result. A good idea to run sessions in your laptop, but try to still do most of your work in properly isolated environments.

### /branch

`/branch` (alias `/fork`) creates a branch of your current conversation. Useful when you want to explore an alternative approach without losing your current thread. You can always go back to where you branched. Combined with `/resume` for switching between sessions and `/rename` for keeping them organised, conversation management is much more capable than it was six months ago.

### /export, /copy, /rename, /resume — Session Management

A cluster of commands that collectively make session management practical: `/export` exports the conversation, `/copy` copies Claude's last response to clipboard (with an interactive picker if there are multiple code blocks), `/rename` names the current session, and `/resume` lets you switch between or resume previous sessions. None of these are individually exciting, but together they mean you can actually manage multiple workstreams without losing track.

### /doctor

Not a new command, but one that surprisingly is not well known. Diagnoses issues with your Claude Code setup. Checks for configuration problems, permission rule conflicts, and installation issues. Run it when things feel off before you spend twenty minutes debugging manually.


### /tasks — Background Task Management

Shows running background tasks and their status. Combined with background agents and worktrees, this is how you keep track of what's executing in parallel. You can also see when tasks complete from here.

## Remote Control: Your Session, Anywhere

This is the feature that got the most attention when it shipped in February 2026, and for good reason. Run [`/remote-control`](https://code.claude.com/docs/en/remote-control) (or enable it permanently via `/config`) and you can connect to your running Claude Code session from claude.ai/code or the Claude mobile app (run `/mobile` for a download QR code if you don't have it yet).

The critical detail: your code never leaves your machine. Only chat messages flow through the encrypted bridge. Your files, MCP servers, environment variables, and project settings all stay local. The phone or browser is just a window into your local session. The security model is straightforward: outbound HTTPS only, no inbound ports, multiple short-lived credentials scoped to specific purposes.

This immediately solved a pain point I had. You kick off a long-running task at your desk, then need to step away. Previously that meant either waiting or hoping it finishes, often to come back and find Claude waiting on a confirmation. Now you check progress from your phone, approve tool calls, and send follow-up instructions from wherever you are.


The main constraint is still approvals. Because tool calls require confirmation, sessions aren't fully hands-off unless you pre-configure permissions. This is where hooks (PreToolUse auto-approval for safe operations) combine with Remote Control to create something closer to truly autonomous remote development.

There's also VS Code support now, running `/remote-control` in the VS Code extension bridges sessions to claude.ai/code so you can continue from a browser or phone.


## Cowork: Claude Code for Everyone Else

[Cowork](https://claude.com/product/cowork) launched in January 2026 as a "research preview" and the backstory is worth mentioning because Boris Cherny (creator of Claude Code) [confirmed on X](https://x.com/boris_cherny) that Claude Code wrote all the software behind Cowork via vibe coding. The whole application was built in under two weeks. That fact alone tells you something about where we are.

So what is it? Cowork is essentially Claude Code with a graphical user interface, aimed at non-technical users. It runs locally on your machine inside a sandboxed VM, giving Claude direct access to your local files — real file access, not uploads or copy-paste. You grant it a folder, and it can edit files, draft reports, and execute actions within that sandbox.

### What's Shipped Since Launch

The pace of updates has been remarkable:

**Computer Use** (macOS only, for now): Claude can control your mouse, browser, and apps. This shipped as a research preview and it's exactly what it sounds like: Claude navigating your actual desktop. MacStories tested it and found roughly 50/50 success on tasks, strong for information retrieval but unreliable for cross-app actions. It's early, but the trajectory is obvious.

**Dispatch** (shipped March 18, 2026): a persistent thread between the Claude mobile app and your desktop Cowork session. Scan a QR code to pair them, and you have a remote control for Cowork in your pocket. Your Mac handles everything: file access, connectors, sandbox execution. Your phone is just the messaging interface. This is the Cowork equivalent of Claude Code's Remote Control.

**Projects** (shipped March 20, 2026): dedicated workspaces with their own context files, working files, scheduled tasks, and conversation history. Before Projects, every Cowork conversation shared the same context. Ask Claude to help with marketing and then switch to a financial report, and Claude might carry over assumptions from one to the other. Projects fix that. Separate desks for separate jobs.

**Scheduled tasks**: recurring automation scoped per project. Weekly report generation, daily data pulls, whatever cadence you need.

And some more. Have you noticed the timeline, by the way? From release to now?

### Current Limitations

There are still limitations, of course. No cross-session memory (each task starts fresh). No cloud sync (everything happens locally). No sharing or artifact support yet. Computer Use is macOS only. And the general reliability of complex workflows is still inconsistent. It's a research preview and it feels like one.

### Why It Matters for Claude Code Users

Even if you're a terminal-native developer who'll never touch the GUI, Cowork matters for two reasons. First, it's expanding who can benefit from the underlying capabilities. When your product manager can run their own data analysis, when your designer can prototype interactions, when your marketing team can generate reports from real data; that changes team dynamics in ways that go beyond developer tooling.

Second, and more selfishly: the investment in the underlying agent platform (hooks, skills, MCP, scheduling, agent teams) now has a much larger addressable audience. More users means more resources flowing into improving the infrastructure we all share. The primitives that make Cowork work are the same primitives that make Claude Code powerful.


## The Plugin System

[Plugins](https://code.claude.com/docs/en/plugins) are the community extensibility layer. Run `/plugin` to browse a marketplace of third-party skills, agents, hooks, and MCP servers that you can install into your Claude Code setup.

The system supports several management commands: `/plugin install`, `/plugin enable/disable`, `/plugin marketplace` for browsing, and `/plugin validate` for checking plugin structure before publishing. Repository-level configuration via `extraKnownMarketplaces` in your settings lets teams share curated plugin sets, so that everyone on the team gets the same skill pack.

Plugins can bundle commands, skills, agents, hooks, and MCP server configurations into a single installable package. The marketplace source can also be declared inline in `settings.json` (the `source: 'settings'` option), which is useful for teams that want to distribute plugins without maintaining an external marketplace.

Plugin startup has been optimised recently. Skills, and agents now load from disk cache without re-fetching, which removes the startup tax that was previously noticeable.

Given how many supply chain hacks we've seen recently, it is important to repeat that the risk is real, and adding random marketplaces and plugins is a risk. Vet anything you install carefully. The marketplace is growing fast, and the best plugins genuinely save time. Just don't install blindly. Check who maintains it. Don't trust Claude links blindly, you can find repositories with similar names to a well-known plugin but with just 3 stars and 1 maintainer. The same due diligence you'd apply to any npm package applies here, arguably more so given the level of access.


## Agent Teams: Coordinated Multi-Agent Development

[Agent Teams](https://code.claude.com/docs/en/agent-teams) shipped alongside Opus 4.6 in February 2026 as an experimental feature, and it represents the most significant architectural leap in how Claude Code works. The jump from subagents to agent teams is the jump from "one agent that can delegate" to "a team of agents that can coordinate with each other."

### How It Works

When you enable agent teams, one session acts as the **team lead**: it coordinates work, assigns tasks, and synthesises results. **Teammates** are full Claude Code sessions, each with their own context window, that work independently and can communicate directly with each other. Unlike subagents, which can only report back to the parent, teammates can message any other teammate on the team.

The coordination happens through two channels: a **shared task list** on disk (tasks move through pending → in progress → completed states, with dependency chains) and **direct messaging** between teammates via the SendMessage tool. There's no shared memory beyond these. Each teammate loads the same project context (CLAUDE.md, MCP servers, skills) but doesn't inherit the lead's conversation history.

You enable it by adding the experimental flag to your settings:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

Then you describe what you want in natural language, and Claude handles team creation, task decomposition, and delegation:

```
I'm building a user authentication system. Create a team:
- Backend agent: Express.js routes for login, signup, token refresh
- Frontend agent: React login/signup forms with validation
- Test agent: integration tests for all auth endpoints
- Review agent: security review of all code produced
```

Claude creates the team, spawns teammates, distributes work through the shared task list, and synthesises findings when everyone finishes.

### Display Modes

Two options: **in-process** (all teammates run inside your main terminal) and **split-pane** via tmux (each teammate gets its own terminal pane). Without tmux, you see one teammate at a time and switch between them. With tmux, you can watch the researcher pulling data while the implementer writes code in the pane next to it.

### Delegate Mode

Without delegate mode, the lead sometimes starts implementing tasks itself instead of waiting for teammates. It grabs a wrench instead of coordinating. To avoid this, press `Shift+Tab` to toggle **delegate mode**, which restricts the lead to coordination-only tools: spawning teammates, messaging, shutting them down, and managing tasks. It can't touch code directly. This is especially important for larger teams where the lead's job is orchestration, not implementation.

### When to Use (and When Not To)

Agent teams add coordination overhead and use significantly more tokens than a single session. They're most effective for:

- **Research and review**: multiple teammates investigating different aspects simultaneously, then sharing and challenging each other's findings
- **New modules or features**: teammates each own a separate component without stepping on each other's files
- **Debugging with competing hypotheses**: teammates test different theories in parallel and converge faster
- **Cross-layer coordination**: changes spanning frontend, backend, and tests, each owned by a different teammate

They're *not* effective for sequential tasks, same-file edits, or work with many tight dependencies. For those, a single session or subagents are better. One practitioner's rule of thumb: if the teammates can operate independently on distinct scopes while still benefiting from occasional communication, use a team. If they'd be constantly waiting on each other, don't.

### Cost and Model Mixing

Each teammate has its own context window, so token usage scales with the number of active teammates, which will exhaust your session faster. A practical mitigation: run the lead on Opus for strategic coordination while teammates run on Sonnet for focused implementation. The lead needs strong reasoning for task decomposition; teammates doing scoped work often perform well on the cheaper model.

Agent teams are experimental, and the rough edges are real. Even so, I've found them genuinely useful for the right kind of task. Watching four agents work in parallel on different parts of a feature, messaging each other to resolve interface contracts, feels closer to managing a small engineering team than to using a coding tool. Whether that excites you or makes you wonder about junior engineering roles is, I suppose, a matter of perspective.

## Auto Mode

Shipped [March 24, 2026](https://claude.com/blog/auto-mode), auto mode fills the gap that's been haunting Claude Code since day one: the space between "approve every single action manually" and "bypass all permissions and pray."

The mechanism is more sophisticated than I initially assumed. When auto mode is enabled, a **separate Sonnet 4.6 safety classifier** evaluates every tool call before execution. This classifier runs in the background, checking for three categories of risk: scope escalation (is Claude doing something beyond what you asked for?), untrusted infrastructure (is the action targeting systems the classifier doesn't recognise?), and destructive operations (force-pushes, production deploys, `curl | bash`, etc.). Safe operations proceed without prompting. Risky operations get blocked, and Claude falls back to asking you for approval.

Auto mode automates the routine approvals while catching the dangerous operations that genuinely need a human eye. It uses more tokens (the classifier adds overhead per action) and adds latency, but removes the flow-destroying permission prompts that make long sessions painful, without having to enter YOLO mode.

The annoying part is that it is currently only available for Team plans, not other subscriptions (yet).

This is the trust barrier from my Fulcrum 1 essay made concrete. You're not giving up control; you're delegating permission decisions to a classifier that's more patient than you are at 4pm on a Friday.

## Other Quality-of-Life Improvements

A grab bag of things that individually seem minor but collectively make the tool noticeably better:

**Native installer.** No more `npm install -g`. It auto-updates in the background and doesn't require Node.js. If you're still on the npm path, switch. Run `/doctor` to ensure you don't have both the `npm` and native versions installed, it happens often.

**Native VS Code extension**. Highlights code blocks, invokes Claude for explanations or refactoring, shows suggested changes inline. Real-time diffs in a dedicated sidebar panel. I still do most work in the terminal, but the extension is useful for quick contextual queries. It now also shows rate limit warning banners with usage percentage and reset time.

**LSP (Language Server Protocol) tool.** Added for code intelligence features: go-to-definition, find references, hover documentation. Claude can now traverse your codebase the way an IDE does rather than relying solely on grep and file reads. Available for every major language via plugins. This quietly makes Claude significantly better at understanding large codebases.

**[Chrome extension](https://code.claude.com/docs/en/chrome#use-claude-code-with-chrome-beta) integration.** Claude in Chrome lets you automate browser actions from Claude Code. Start a task in the terminal, let Claude handle work in the browser reading console errors, network requests, and DOM state to help debug issues. Also supports recording workflows that Claude can learn and repeat.

**Channels**. Enabled with a flag, `--channels`, it allows MCP servers to push messages into your session. External services can proactively notify your coding session about events rather than you polling for them. Very early, but combined with `/loop` for scheduled checks and Remote Control for mobile access, Claude Code is starting to behave less like a tool you invoke and more like a system that's always present.

**`--bare` mode.** For scripted `-p` calls — skips hooks, LSP, plugin sync, and skill directory walks. Faster startup for automation.


**Improved compaction** preserves images in the summariser request, allowing prompt cache reuse for faster and cheaper compaction.


**Output styles** are now configurable via `/config`: Explanatory (detailed, step-by-step), Concise (brief, action-focused), and Technical (precise, jargon-friendly). You can also create custom styles as files in `~/.claude/output-styles/`.


## What Actually Matters

If I had to pick the changes that have most impacted my daily work since Opus 4.5:

**The Opus 4.6 model upgrade** — everything else is built on top of better reasoning. This is the foundation.

**Rules** — finally, a way to keep CLAUDE.md sane and context-specific. The glob-scoped loading was the missing piece.

**Hooks** — the bridge from "Claude should do X" to "X happens every time."


**Skills 2.0 with subagents** — the ability to fork context for research tasks is a genuine workflow improvement. I no longer pollute my main conversation with exploratory reads.


Everything else is either nice-to-have, too early to evaluate (channels, auto mode), or useful for specific workflows I don't hit daily (voice, `/batch` for large migrations).


## The Pace Problem

The elephant in the room is that this pace of change is itself a challenge. Features ship faster than documentation catches up. Community guides go stale within weeks. The changelog is your best source of truth, but reading it weekly is a commitment. And there is a lot of noise lately about the amount of bugs open in the Claude Code repository, which is steadily increasing. Moving fast is nice, but it has consequences.


My honest advice: don't try to follow weekly or to adopt everything at once. You will hear about the most important changes when they happen. From the ones in this list you may have missed, pick two or three changes that address friction you're currently experiencing, integrate those, and revisit in a month. The other features will still be there. Probably with three new ones you'll need to learn about.

As with most things in this space: in a few months half of this post will already be outdated. But someone else will have written a summary of the changes released in the meantime. I'll just read that one.
