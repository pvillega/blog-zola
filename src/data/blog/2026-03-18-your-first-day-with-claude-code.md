---
author: Pere Villega
pubDatetime: 2026-03-18
title: "Your First Day With Claude Code"
draft: false
tags:
  - ai
  - claude-code
  - developer-tools
  - security
  - devcontainers
  - lsp
description: The setup checklist I wish I'd had on day one with Claude Code — isolation and sandboxing, terminal configuration, LSP integration, token monitoring, and what not to install.
series: "ai-developer-evolution"
seriesOrder: 3
seriesSection: "working-with-agents"
---

Most people's first experience with an AI coding agent is terrible. Not because the agent is bad, but because their setup is wrong.

I've seen the pattern dozens of times now. Someone installs Claude Code, opens a terminal in their home directory, types a prompt, and wonders why the agent is reading their `.env` files, getting confused by unrelated projects, and producing mediocre output. Then they write it off as overhyped. Sound familiar?

The setup matters more than most people think. This post is the checklist I wish I'd had on day one.

## Account Options

You have a few paths to using Claude Code.

Claude Pro gives you a subscription with usage limits, ideal for exploration. Unfortunately, cheaper plans for Claude are heavily restricted, so you will run out of tokens quite often. You can upgrade to a higher plan, but the cost increase is steep, 5x or 10x more.

The API option, paying per token, makes more sense for very heavy use when a subscription is not enough, particularly when you're running multiple sessions in parallel or when using third-party clients. For serious daily use, [Requesty](https://www.requesty.ai) is worth evaluating: it's a proxy that optimises token costs across providers.

The choice depends on your usage patterns, but here's the thing I'd stress: don't start with the free tier and judge the technology by the experience of a rate-limited model. It is worth budgeting an amount and using the API if you are not sure about subscribing. The difference is not subtle.

## Isolation First

This is the most important section of this post. I'm putting it second instead of fifth because if you get this wrong, nothing else matters.

Every agent session should run inside a container or isolated VM. No mounts to your host filesystem. No production tokens in environment variables. Dev-scoped everything. I realise that sounds paranoid. It isn't.

Why? Because a coding agent with access to your `.ssh` keys, `.aws` credentials, `.kube` config, and shell configuration is a security incident waiting to happen. This isn't theoretical. Trail of Bits, one of the most respected security research firms in the industry, documents this explicitly. An agent reading a log file with a crafted prompt injection can generate a script that exfiltrates your credentials to an external server. Let that sink in for a moment.

### Claude Setup

The Trail of Bits production setup uses two layers of defence. Layer 1: deny rules in `settings.json` that block reads of sensitive paths like SSH keys, cloud credentials, package registry tokens, git credentials, shell config, macOS keychains, and even crypto wallets. Layer 2: the `/sandbox` command, which enforces those rules at the OS level using Seatbelt on macOS or bubblewrap on Linux.

Here's what most people miss: without `/sandbox`, deny rules only block Claude's Read tool. A Bash command like `cat ~/.ssh/id_rsa` still works. The deny rules and the sandbox complement each other. Use both.

### Which Container

There are many options to wrap your Claude Code environment, and it seems everybody is creating their own sandbox, even [me](https://github.com/pvillega/sandbox-claude). A few alternatives follow.

**DevContainers** are your friend here. Set them up with no mounts to the host and `enableNonRootDocker: true` to avoid escaping to the host. Anthropic now ships an official devcontainer feature (`ghcr.io/anthropics/devcontainer-features/claude-code:1.0`) that you can drop into any `devcontainer.json` — one line and you're sandboxed.

Trail of Bits has gone further with [devc](https://github.com/trailofbits/claude-code-devcontainer), a dedicated CLI for managing sandboxed Claude Code environments. `devc .` installs the template and starts the container. `devc shell` drops you in. Their workspace pattern is clean: create a directory, run `devc .`, clone repos inside the container. Full isolation, shared volumes across repos, disposable when done.

For the truly paranoid (and I say that with respect), Trail of Bits also offers [dropkit](https://github.com/trailofbits/dropkit), a CLI tool for spinning up disposable DigitalOcean droplets with automated setup, SSH config, and Tailscale VPN. Create a droplet, SSH in, run Claude Code, destroy it. No trace left.

**Codespaces** offer good isolation and don't require your laptop to be on. You can work on parallel branches, and you can safely run with `--dangerously-skip-permissions` because the environment is disposable. The downside: no `~/.claude/CLAUDE.md`, so you need to keep all guidelines in the repo. First startup is slow; subsequent runs are faster. Limited free tier: remember to delete unused codespaces.

Even a cheap VPS works. Chris Parsons runs Claude Code on an Ubuntu VPS for under £10/month. The server never sleeps, never reboots for updates, never loses WiFi. Sessions persist via tmux. He works from his phone via SSH. There's something beautifully pragmatic about that.

A note on Lima and Colima for macOS users: Lima's default instance template mounts host paths — often from `$HOME` — as read-only. For normal development, that's a convenience feature. For Claude Code with `--dangerously-skip-permissions`, it's a security hole. SSH keys, `.env` files, cloud credentials — all potentially readable inside the VM. If you're using Colima, Trail of Bits recommends `vz + virtiofs + rosetta` for performance, and cloning repos inside the VM where you get native ext4 speed rather than relying on bind mounts.

The five minutes you spend on isolation save the incident response you'll never have to write.

## The Native Sandbox

Since mid-2025, Claude Code ships with a built-in sandbox that provides filesystem and network isolation using OS-level primitives: Seatbelt on macOS, bubblewrap on Linux. Type `/sandbox` in a session to enable it. Anthropic's engineering team reports that sandboxing reduces permission prompts by 84% in their internal usage. That's a number worth paying attention to.

The sandbox enforces two boundaries: filesystem isolation (writes restricted to the current working directory, reads unrestricted except for explicitly denied paths) and network isolation (connections only to approved domains, everything else blocked). Critically, all child processes inherit these restrictions: a subprocess spawned by a build script can't circumvent the rules.

With the sandbox enabled, you can run in auto-allow mode: sandboxed Bash commands execute without permission prompts, while anything that tries to reach outside the boundary triggers a notification. This addresses what I'd call "approval fatigue", the pattern where constant "approve this command" prompts train you to click through reflexively, giving you the worst of both worlds: interrupted flow AND reduced security.

The sandbox doesn't replace container isolation for high-risk scenarios. The VM boundary is the security boundary. Everything else provides defence-in-depth. But for day-to-day development on trusted repositories, `/sandbox` with auto-allow gets you 80% of the security benefit with 5% of the setup cost. That's a trade-off I'm happy to make.

## Terminal Setup

Claude Code is a terminal application, and the terminal you use matters more than you'd think.

**Ghostty** is what Trail of Bits recommends, and I agree. Native Metal GPU rendering handles high-volume Claude Code output without lag. Built-in split panes with Cmd+D. Shift+Enter and key bindings work without needing `/terminal-setup`.

**Session management** is essential. You'll be running multiple Claude sessions simultaneously at some point. Use tmux or zellij for persistent sessions. When you close your laptop or lose connection, your sessions keep running. This isn't a nice-to-have; once you're running parallel agents, it becomes infrastructure.

**Notifications** matter because you'll be multitasking. Enable system notifications so you know when Claude needs input or has finished a task. On macOS, a simple hook configuration can send a notification via osascript. Andrew Ford documented an even better pattern using [ntfy.sh](https://ntfy.sh), a free, self-hostable HTTP notification service that pushes alerts to your phone the instant Claude needs attention. The notification hook fires when Claude needs permission or when prompt input has been idle for 60 seconds or more.

**Dictation** is an underrated force multiplier, and I have to confess I initially dismissed it. [wisprflow.ai](https://wisprflow.ai) lets you speak prompts instead of typing them. You speak roughly three times faster than you type, and prompts get significantly more detailed when dictated. When your prompts are more detailed, the output is better. Simple as that. For free alternatives, some people use voice dictation routinely — fn key twice on macOS to trigger it. And recently Claude has added a `/voice` command to integrate this directly in the app, although it has some rough edges.

## The 2-Minute LSP Upgrade

This is the single highest-leverage configuration change you can make, and it takes two minutes. If you only do one thing from this entire post, set up your sandbox. If you do two, make this the second one.

Without LSP, Claude Code navigates your codebase using text search: Grep, Glob, and Read. It treats code as text. When you ask "where is this function defined?", Claude greps across the entire codebase. For a common symbol like `User`, that might mean 847 matches across 203 files. Claude reads through each to narrow it down: 30-60 seconds and many tokens consumed.

With LSP, the same query returns the exact file and line in about 50ms with 100% accuracy. This is the same code intelligence your IDE uses. So why wouldn't you give it to your agent?

The context window savings are enormous. Instead of reading dozens of files to find a definition, Claude gets a precise answer and reads only the one file it needs.

But the killer feature is self-correcting edits. After every file edit, the language server pushes diagnostics: type errors, missing imports, undefined variables. Claude sees them immediately and fixes them in the same turn, before you see the result. Without LSP, you'd get the result, try to compile, see errors, paste them back. Each round trip consumes more context. With LSP, that entire loop collapses into one step.

### Setup

**Step 1:** Add to `~/.claude/settings.json`:
```json
{
  "env": {
    "ENABLE_LSP_TOOL": "1"
  }
}
```
Also add `export ENABLE_LSP_TOOL=1` to your shell profile as fallback.

**Step 2:** Install the language server binary for your stack. Some common ones are:
- Python: `npm i -g pyright`.
- TypeScript: `npm i -g typescript-language-server typescript`.
- Go: `go install golang.org/x/tools/gopls@latest`.
- Rust: `rustup component add rust-analyzer`.

**Step 3:** Install and enable the plugin:
```bash
claude plugin marketplace update claude-plugins-official
claude plugin install pyright-lsp
claude plugin list  # verify enabled
```

**Step 4:** Restart Claude Code. LSP servers initialise at startup and index the full project. Verify by asking "What type is [some variable]?". If it uses LSP hover instead of reading the file, it's working.

An issue to take into account: a plugin can be installed but disabled. This accounts for most "LSP isn't working" reports. I've been bitten by this myself.

Even with LSP enabled, Claude may default to Grep/Read/Glob out of habit. It's a stochastic machine after all. Add a nudge to your CLAUDE.md:

```markdown
### Code Intelligence
Prefer LSP over Grep/Glob/Read for code navigation:
- goToDefinition / goToImplementation to jump to source
- findReferences to see all usages across the codebase
- hover for type info without reading the file
After writing or editing code, check LSP diagnostics before moving on.
```

## Token Monitoring

Tokens are your currency, and like any currency, it's worth knowing how much you're spending.

The longer a conversation runs, the more each message costs, because each new request sends the entire previous conversation. This is not linear growth. It creeps up on you.

I use [ccstatusline](https://github.com/sirmalloc/ccstatusline) to track token consumption and session resets. Run `/context` regularly to see how much of your window is actually free. You might be surprised at how little room you have after tools, MCPs, and CLAUDE.md files load. Yes, MCPs and other bits now load dynamically, not at the start. That is a bit of a trap, as you expect a session to have plenty of room until an MCP with terrible token efficiency loads and takes half of what you had left.

We'll cover context management in depth later in this series. For now, just be aware that context is finite and precious, and start building the habit of checking `/context`.

## The New Project Checklist

When starting a new project, or introducing Claude Code to an existing one, verify these before writing a single prompt:

**Which MCPs may be useful?** Postgres, SQLite, Slack, Honeycomb... think about what external tools the agent might need. But be judicious: each MCP consumes context tokens just by existing (when loaded). It's a trade-off.

**Which CLI tools should be available?** Document them in `CLAUDE.md` if they are not common tools, so the agent knows they exist.

**Is the DevContainer or isolation setup configured?** Are secrets scoped to development only? Is there a risk of someone accessing staging or production data through that token in `.env`?

**Does a `CLAUDE.md` exist?** This is something that has evolved recently. Traditionally people recommended even a minimal one with linter commands, test commands, files not to read, etc. Recent testing seems to lean towards files that do not duplicate what Claude can read by itself. For example, your linter configuration may be defined in `package.json`, no need to tell Claude twice by adding it to `CLAUDE.md`. This file is valuable; just add important data: ask Claude not to use patterns it tries to use often, mention things that are not obvious from the codebase, etc.

**Is there a testing framework in place?** If the agent can't verify its work, the quality drops dramatically. Give Claude a way to check its own work and quality improves 2-3x. I'd go further: without tests, you're essentially asking the agent to code blindfolded. I am aware that not everybody tests as much as they should, but that's something to correct if you expect any success from your AI experiments.

## What NOT to Install

The pace of activity in the Claude Code ecosystem is extraordinary — check the commit activity on awesome-claude-code and you'll see what I mean. There's a natural temptation to install everything that looks promising.

Resist it. Every skill, MCP, and configuration file loaded into the context window reduces the space available for actual work. Run `/context` after installing anything new and see the impact. Be very deliberate about what's enabled.

Note that this still applies even with the current lazy loading of MCPs and skills. Yes, the initial context will be larger, but those tools will load at some point, consuming context.

Tools like SuperClaude can leave you with barely 60k tokens free after they load everything. That's almost 75% of your context window gone before you start. Imagine trying to write a novel when three-quarters of your desk is covered with reference books you haven't opened.

## Start Lean in Purpose

I have a setup I use and that I would recommend, but I am not listing it here on purpose. If you are starting with Claude, start minimal. The model is very capable by itself, and if you add a lot of tooling you may not get to understand what it can or can't do.

Add tools as you discover you need them. For example, an MCP to allow the model to test your app using Chrome. Maybe some skills to enforce TDD, as tests are very important. Grow it incrementally.

The best setup is the one where you understand every piece and why it's there.
