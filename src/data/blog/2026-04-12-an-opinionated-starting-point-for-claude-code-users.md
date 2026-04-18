---
author: Pere Villega
pubDatetime: 2026-04-12
title: "An Opinionated Starting Point for Claude Code Users"
draft: false
tags:
  - ai
  - claude-code
  - developer-tools
  - ai-developer-evolution
  - tooling
  - agents
  - productivity
description: "A curated configuration for Claude Code that bundles plugins, skills, CLI tools, and sandbox guards into a single install script. What it does, how to use it, and why you should fork it immediately."
series: "ai-developer-evolution"
seriesOrder: 2
seriesSection: "appendices"
---

A few weeks ago I tried to set up Claude Code on a fresh sandbox and realised I couldn't remember half of what I'd accumulated. Plugins from one blog post. A skill I'd installed from a Twitter thread. A hook that was definitely important because past-me had left a comment saying "don't remove this" with no further context. The install took the best part of an evening, and I still missed things.

Every Claude Code user I've spoken to has the same trajectory. Install it, run it vanilla for a week, then spend the next month accumulating a bespoke pile of plugins, skills, MCP servers, shell aliases, and sandbox settings. All held together by tribal knowledge and a vague memory of which blog post told you to add that one hook.

So after Anthropic released `marketplaces`, I decided I should do better. I packaged my configuration into a repository: [claude-templates](https://github.com/pvillega/claude-templates).

This post explains what it is, how to install it, and how to use it day-to-day. Fair warning up front: this is _my_ opinionated configuration. It reflects how I work, which tools I've found useful after months of tinkering, and where I've landed on the safety-versus-autonomy spectrum. You should absolutely fork it and make it yours; more on that at the end.


## What Problem Does This Solve?

Claude Code is powerful out of the box, but "out of the box" leaves a lot on the table. The community around it is genuinely useful but scattered across dozens of repositories, documentation pages, and community posts. You have plugins from the [marketplace](https://claude.com/plugins), skills from [skills.sh](https://skills.sh), CLI tools that Claude can call, or [sandbox configurations](https://code.claude.com/docs/en/sandboxing) that stop it from reading your SSH keys. Knowing what to install is half the battle; knowing how to make it all play nicely together is the other half.

Setting all of this up manually is tedious and error-prone. Worse, when you inevitably want to update everything or reproduce the setup on another machine, you're back to square one with a browser history full of GitHub READMEs. Claude-templates solves this by providing a single `install.sh` that handles the lot: plugins, skills, CLI tools, sandbox settings, shell aliases, and a sensible set of defaults.

The project is designed for YOLO mode (`--dangerously-skip-permissions`). If that phrase makes you nervous: good, it should. Simon Willison has written persuasively about the [lethal trifecta](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/) of unrestricted agent access, and I'd recommend reading that before deciding how much trust to extend. The configuration compensates by blocking access to sensitive system files, denying destructive commands like `rm -rf` and `git push --force`, and encouraging sandboxed execution. It's not bulletproof (nothing is when you hand an agent unrestricted tool access), but it's a significant improvement over running YOLO mode with no guardrails at all.

Either way, use a sandbox. Ideally, an external machine built for that purpose but, if not possible, try projects like [this sandbox](https://github.com/pvillega/sandbox-claude). There are plenty online; it feels like every second AI user is building one.

## Installation

Prerequisites: you need `curl`, `npm`, and [Homebrew](https://brew.sh) installed. Docker is optional but required by some security scanning skills ([Nuclei](https://github.com/projectdiscovery/nuclei) and [ZAP](https://www.zaproxy.org/) for DAST, specifically).


To install the template:

```bash
git clone https://github.com/pvillega/claude-templates.git
cd claude-templates

# Installs plugins, skills, CLI tools, sandbox settings, and shell aliases
./install.sh

# Start Claude Code with YOLO mode (added as 'cl' alias to your shell)
cl
```

That's it. The installer pulls plugins from the Claude marketplace, installs skills globally via [skills.sh](https://skills.sh), sets up CLI tools through Homebrew and npm, configures sandbox permissions, and adds a `cl` alias to your `.bashrc` or `.zshrc` that launches Claude Code with the `--dangerously-skip-permissions` flag. If you don't use Bash or Zsh, you can set up the alias manually; the script will tell you what to add.

If you need a [Tavily](https://tavily.com/) API key for web search capabilities, the installer will remind you. You can authenticate via `tvly login` or export `TAVILY_API_KEY` in your shell profile.

Two companion scripts exist because I got tired of manually tracking what was installed where: `./update.sh` brings everything to latest versions, and `./uninstall.sh` removes the lot cleanly (minus some `settings.json` configuration, to avoid breaking Claude). Not glamorous, but they save a surprising amount of time.

All the information above is available in the `README.md` of the project.

## What Does It Include?

The configuration breaks down into four categories: plugins, CLI tools, global skills, and sandbox settings. I'll walk through each briefly, though the [SKILLS.md](https://github.com/pvillega/claude-templates/blob/main/SKILLS.md) file in the repo is the authoritative reference if you want the full inventory, more so as this space moves fast and the plugin may receive updates often.

### Plugins

These come from the [Claude marketplace](https://claude.com/plugins) and provide the heaviest-weight capabilities. The headline acts are [Superpowers](https://github.com/obra/superpowers), which adds structured workflows for TDD, brainstorming, planning, debugging, and code review, and [Engram](https://github.com/Gentleman-Programming/engram), which gives Claude persistent memory across sessions via SQLite and FTS5.

Engram deserves a brief aside. The configuration explicitly sets `autoMemoryEnabled: false`, replacing Claude's built-in auto-memory with Engram's selective retrieval and automatic decay model. I found the built-in memory underwhelming. Engram's approach of explicit `mem_save` calls gives you more control over what sticks and what fades. Your mileage may vary, and I suspect the built-in memory will improve once they enable that rumoured `dream` feature that was leaked in some beta, but for now Engram remains my preference.

Beyond those two, you get a [code review plugin](https://claude.com/plugins/code-review) that dispatches five parallel agents to analyse a PR, a [security guidance](https://claude.com/plugins/security-guidance) hook that warns about vulnerabilities on file edits, [commit commands](https://claude.com/plugins/commit-commands) for git workflow automation, and [Hookify](https://claude.com/plugins/hookify) for creating custom hooks from natural language. The repo also ships its own plugin, `ct`, with 13 skills and 6 agents covering code quality, security scanning, refactoring, accessibility auditing, and more. Several of these were adapted from [Channing Walton's dotfiles](https://github.com/channingwalton/dotfiles) and [Gojko Adzic's bugmagnet methodology](https://github.com/gojko/bugmagnet-ai-assistant), both of which are worth exploring independently.

### CLI Tools

The installer sets up roughly 15 CLI tools that Claude can use during sessions. The ones I reach for most are [`fd`](https://github.com/sharkdp/fd) (aliased as `find`), [`ripgrep`](https://github.com/BurntSushi/ripgrep) (aliased as `grep`), and [`rtk`](https://github.com/rtk-ai/rtk). That last one is a token-optimised CLI proxy written in Rust that reduces tool output by 60-90%. If you've ever watched Claude chew through 2,000 tokens of raw `git status` output when it only needed 200, you'll understand why this matters. Context windows aren't infinite, and every wasted token is context you can't use for actual reasoning.

You also get [`gh`](https://cli.github.com/) for GitHub operations, [`jscpd`](https://github.com/kucherenko/jscpd) for copy-paste detection, [`semgrep`](https://semgrep.dev/) for SAST scanning, [`gitleaks`](https://github.com/gitleaks/gitleaks) as a pre-commit hook for secret detection, and [`agent-browser`](https://github.com/vercel-labs/agent-browser) for browser automation. For accessibility, the installer adds [`axe-core`](https://github.com/dequelabs/axe-core) and [`pa11y`](https://github.com/pa11y/pa11y) for WCAG auditing. [`Nuclei`](https://github.com/projectdiscovery/nuclei) and [`ZAP`](https://www.zaproxy.org/) handle DAST scanning (ZAP requires Docker).

Two MCP servers are also configured: [Gabb](https://github.com/gabb-software/gabb-cli) provides semantic symbol search and file structure previews via a local SQLite index, and Engram (mentioned above) runs as an MCP server exposing roughly 14 memory tools. Both start automatically when Claude needs them. The full table lives in the [README](https://github.com/pvillega/claude-templates#cli-tools).

### Global Skills

Skills are instruction sets that Claude loads on demand when it recognises a relevant task. Think of them as specialised playbooks rather than full extensions. The configuration installs about 15 of them globally (via `npx skills add`), covering web research ([Tavily](https://github.com/tavily-ai/skills), [Context7](https://github.com/upstash/context7)), browser automation and QA testing (agent-browser, dogfood, webapp-testing), database work (PostgreSQL via [PlanetScale's skill](https://github.com/planetscale/database-skills)), [Obsidian](https://github.com/kepano/obsidian-skills) vault management, [shadcn](https://github.com/shadcn/ui) component handling, and security review from [Sentry's skill collection](https://github.com/getsentry/skills).

The important bit: skills are installed globally (`-g`), so they're available in every project without per-repo configuration. You can browse what's available at [skills.sh](https://skills.sh) and add more by editing the `SKILLS` array in [`config.sh`](https://github.com/pvillega/claude-templates/blob/main/config.sh).

### Sandbox and Safety

The `sandbox-settings.json` file is where the safety guardrails live, and I'd argue it's the most important file in the entire repo, even if it's the least exciting to read. It blocks read access to sensitive system paths (`/etc/passwd`, `/etc/ssh`, `~/.ssh`, and their macOS equivalents under `/private`), denies destructive bash commands (`rm -rf`, `dd`, `mkfs`, `shred`), and prevents force-pushes and history-rewriting in git. I suspect most developers running YOLO mode don't realise how easily an agent can wander into `/etc/ssh` or read environment variables containing API keys. The sandbox catches the most obvious failure modes.

The settings file also configures some quality-of-life defaults worth knowing about. Extended thinking is always on at high effort level (you can lower it per-session with `/effort medium` if the deep reasoning is overkill for your current task). The experimental [Agent Teams](https://code.claude.com/docs/en/agent-teams) feature is enabled via environment variable. And a custom status line shows your current context usage, rate limits, model, and active worktree at a glance. That status line is surprisingly useful: watching the context bar creep from green to yellow to red gives you an intuitive sense of when to `/clear` or start a fresh session, rather than discovering the hard way that you're in what some people call the "dumb zone" above 60% context usage.

### Hooks

Hooks are where the configuration gets opinionated. Claude Code supports several hook types (SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, Stop, and others) that run shell scripts in response to specific events. The `ct` plugin wires up about a dozen of them, and they do more heavy lifting than you might expect from a few shell scripts.

**Session lifecycle.** When a session starts, a SessionStart hook boots the Engram MCP server, creates a new memory session, imports any git-synced memory chunks, and injects the full Memory Protocol instructions into context. A companion hook fires after context compaction (when Claude's window fills up and older messages get summarised) to re-inject the memory protocol and prompt Claude to call `mem_session_summary` so nothing is lost. When a session ends, a Stop hook marks the Engram session as closed. And when a subagent finishes, a SubagentStop hook sends its output to Engram's passive capture endpoint for automatic knowledge extraction. The net effect: memory management happens in the background without you thinking about it.

**Quality enforcement.** A PostToolUse hook runs [Semgrep](https://semgrep.dev/) after every file edit or write. If it finds issues, it exits with code 2 to block Claude and force a fix before proceeding. You can skip it with `SKIP_SEMGREP=1` for sessions where it's too noisy. A PreToolUse hook on TaskUpdate watches for rationalisation patterns ("pre-existing issue," "out of scope," "skip for now") when Claude tries to mark a task as completed, and blocks the completion if it detects the agent is sweeping work under the rug. A Lint Guard SessionStart hook detects project languages (it checks for 17 languages via marker files), looks for existing linter configs, and prompts you to run `/lint-guard` if linting isn't set up yet. Once configured, a Stop hook runs the linters on changed files whenever Claude finishes a turn.

**Workflow automation.** A UserPromptSubmit hook forces Claude to evaluate every available skill for relevance before proceeding with any task, following a three-step sequence: evaluate each skill YES/NO, activate matching skills, then implement. This is based on [Scott Spence's approach](https://scottspence.com) and in my experience bumps skill activation a lot. A separate UserPromptSubmit hook nudges Claude to call `mem_save` if more than 15 minutes have passed since the last save, preventing the common failure mode of a productive session whose decisions evaporate because nobody saved them. A SessionStart hook loads shell aliases into Claude's context so it knows that `grep` is actually `ripgrep` and won't use incompatible flags. And a Reflect checker hook scans `.claude/REFLECTION.md` for pending entries and reminds you to run `/reflect review`.

The [Security Guidance](https://claude.com/plugins/security-guidance) plugin adds its own PreToolUse hook that injects security warnings about injection, XSS, and unsafe patterns before Claude edits files. Combined with the Semgrep PostToolUse hook, this creates a two-layer safety net: guidance before the edit, verification after.

## Developer Workflows

This is where the configuration earns its keep. The [WORKFLOWS.md](https://github.com/pvillega/claude-templates/blob/main/WORKFLOWS.md) file in the repo is the canonical reference. It's organised as a "when I need to X, use Y" lookup table, but here's how the pieces fit together for common development tasks.

### Starting a New Feature

The typical flow begins with planning, which I know sounds ceremonial but genuinely pays for itself. Ask Claude to plan a feature and Superpowers' brainstorming skill activates, walking through intent, requirements, and design before any code is written. Once you're happy with the plan, it transitions into a writing-plans skill that produces an implementation plan with review checkpoints. If you're working in parallel, the using-git-worktrees skill can isolate your work automatically.

Why bother with this ceremony? Because the planning phase catches misunderstandings before they become 500-line diffs that need rewriting. I've lost count of the times a quick brainstorming session revealed that I was solving the wrong problem, or, more embarrassingly, solving the right problem with an approach that already existed elsewhere in the codebase. Better to discover that before Claude has cheerfully implemented the wrong solution across twelve files.

The latest versions of the skill can also start a local server that shows different options visually in an HTML page. Useful when you want to compare multiple layouts or decide which architecture is better. Text is sometimes too ambiguous, and a visual aid makes the difference.

### Writing Code

Implementation uses the test-driven-development skill by default: tests first, then implementation, then verification. The [frontend-design](https://claude.com/plugins/frontend-design) skill activates automatically when you're building UI (and produces noticeably better results than vanilla Claude, which tends towards safe but forgettable designs). [Context7](https://github.com/upstash/context7) fetches library documentation on demand, which is far more reliable than hoping Claude remembers the API correctly from training data.

A practical tip: tell Claude how to run your project, which test users to use, what the build command is. Add that information in your local `CLAUDE.md`, more so if you use non-standard commands. The more specific your project instructions, the more autonomously the agent can verify its own changes by running the service and fixing issues. This is the difference between an agent that guesses and one that verifies.

### Reviewing and Fixing

`/code-review` dispatches five parallel agents that check compliance, bugs, and git history. Overkill for a one-line typo fix, but invaluable for substantial PRs. For a quicker pass, the `ct:fix-loop` skill finds and fixes issues iteratively, which is useful when you've got a batch of linting failures or minor bugs to clean up. `ct:bugmagnet` hunts for edge cases and test coverage gaps; I've found it surprisingly good at finding the kinds of boundary conditions I'd miss in a manual review.

Security scanning happens at multiple levels, which I believe is worth the extra noise. [Semgrep](https://semgrep.dev/) runs automatically after every file edit via a PostToolUse hook; skip it with `SKIP_SEMGREP=1` if it's too chatty for your taste. [Gitleaks](https://github.com/gitleaks/gitleaks) blocks commits that contain secrets via a global git pre-commit hook. And for running applications, you can trigger deeper DAST scans with Nuclei and ZAP. Is this overkill for a side project? Probably. Is it overkill for anything touching production? I'd argue not.

### Git and Shipping

The commit workflow commands handle the repetitive parts of getting code out the door: `/commit` analyses your changes and creates a commit with an appropriate message (it learns your project's commit style over time), `/commit-push-pr` goes the whole way from commit to open PR, and `/clean_gone` tidies up local branches that have been merged remotely. These feel like small conveniences until you realise how many times a day you context-switch to the terminal for exactly these operations. In a flow state, the fewer interruptions the better, and an agent that can commit, push, and open a PR without you leaving the conversation is a genuine productivity win.

### Memory and Context

Engram handles persistent memory across sessions. It saves decisions, architecture choices, and learnings automatically via hooks, and you can trigger saves manually with `mem_save`. Between sessions, `mem_search` retrieves relevant context so you're not starting cold. Instead of re-explaining project context at the start of every session, Engram surfaces the relevant history. It's not perfect (retrieval can miss things, and the automatic decay means old memories fade over time), but it's a substantial improvement over starting from scratch each time. If you've ever typed "remember, we decided to use X pattern for Y" for the third time in a week, you'll appreciate having a system that actually remembers.

The `/reflect` command generates structured proposals from session learnings that you can approve into your project's `CLAUDE.md`, which effectively turns temporary session knowledge into permanent project knowledge.



## Fork It and Make It Yours

I want to be explicit about this: **claude-templates is a starting point, not a prescription**. The best Claude Code configuration is one tailored to your specific workflow, your tech stack, your risk tolerance, and your preferences. Mine reflects months of tinkering with a consulting-heavy, polyglot workflow; yours will (and should) look different.

Some things you'll almost certainly want to change. Maybe you don't use PostgreSQL and want to swap the database skill. Maybe you prefer Claude's built-in memory over Engram (reasonable, especially when they release their new memory system). Maybe you don't want Semgrep scanning every single edit, or you have project-specific hooks that make more sense than the generic ones. Maybe you work in Rust or Scala and want to add the appropriate [LSP plugin](https://github.com/pvillega/claude-templates#lsp-integration); the repo includes a reference table for LSP setup across twelve languages, plus community options for several more.

The repo README warns that I modify it regularly as I experiment with new approaches. This is both a feature and a reason to fork: forking gives you stability while letting you cherry-pick updates that look useful.

What I'd recommend: clone it, run `install.sh`, work with it for a week, and take notes on what annoys you. Then start pruning, adding, and reshaping. Run `/claude-automation-recommender` (from the [Claude Code Setup](https://claude.com/plugins/claude-code-setup) plugin) on your projects to discover project-specific optimisations; it's surprisingly good at suggesting things you hadn't considered. Use [Hookify](https://claude.com/plugins/hookify) to create custom hooks for behaviours unique to your codebase.

The generic configuration gets you most of the way there. The rest is yours to build. And when you next try to set up Claude Code on a fresh sandbox, past-you will have left something more useful behind than a cryptic "don't remove this" comment.
