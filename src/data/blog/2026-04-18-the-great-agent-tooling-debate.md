---
author: Pere Villega
pubDatetime: 2026-04-18
title: "The Great Agent Tooling Debate"
draft: false
tags:
  - ai
  - ai-developer-evolution
  - agents
  - mcp
  - cli
  - claude-code
  - context-engineering
description: "Load 84 MCP tools and 15,540 tokens are gone before you ask a question; after thirty minutes you've burned 40% of your context on tool definitions you didn't use. Holmes and Yilmaz make the case for CLI-first, and I've mostly come round: CLIs are debuggable, composable, and 92-98% cheaper in tokens. MCP still earns its keep for a few tools, but the default should flip."
series: "ai-developer-evolution"
seriesOrder: 9
seriesSection: "working-with-agents"
---

A few weeks back I opened a fresh Claude Code session, loaded the MCP servers I'd been quietly accumulating over months, and typed `/context` out of habit. The reply was sobering: 40% of a 200k window already spent, and I hadn't asked a single question yet. Six servers. Eighty-four tools. Somewhere around 15,540 tokens of JSON Schema sitting in the window, waiting to be useful. Most of it never would be.

I'd been an MCP enthusiast. Genuinely. I'd written CLAUDE.md entries recommending specific servers, spun up Docker containers for the ones that needed them. MCP felt like the future: a clean standard, a decoupled interface, a way for anyone to plug a tool into any agent. And then I watched the token bill arrive for every session before I typed a word.

There's a simpler way. The agents in your terminal already know how to use it.

## What Claude Code Already Handles

Before reaching for any external tool, it's worth remembering what Claude Code does natively: git operations, filesystem access, web fetch, time. For a surprising number of tasks, that's sufficient. The agent reads files, writes files, runs bash commands, fetches pages. Zero tokens spent on tool definitions for any of it.

The bash handle is the interesting one. Because the agent can invoke shell commands, any CLI tool installed on the machine is implicitly available to it. That's why Claude infamously reaches for `grep` before anything else when looking for code: the tool exists, it works, and the model has seen it in roughly every repository on GitHub. It doesn't need a protocol to know what `-r` does.

The downside is that tools drift. Alias `grep` to `ripgrep` and a subset of flags silently stops behaving the same way. The agent fires off `grep -P` expecting Perl regex, gets back a cryptic error, tries three variations, burns a few thousand tokens finding its feet. Not fatal. Annoying. The fix is a line in CLAUDE.md telling it which binary lives behind the name, and suddenly the looping stops. Small investment, large return, *if* it's not lost in context.

## The Case for MCP

[MCP](https://modelcontextprotocol.io/docs/getting-started/intro), the Model Context Protocol, is Anthropic's open standard for connecting AI applications to external systems. It lets Claude use tools it didn't ship with, often without needing to install a CLI at all. The advantages are real and I don't want to pretend otherwise.

The strongest argument is the standard interface. MCP decouples the tool from the agent. Any MCP-compatible client can use any MCP server. You write the integration once. For tool builders trying to support Claude, Cursor, Continue, and whatever arrives next quarter, that's a genuine win; one implementation, many clients.

There are specific MCPs I still reach for regularly. [Context7](https://github.com/upstash/context7) for library documentation lookup, which has saved me from hallucinated API docs more than once. [Playwright](https://github.com/microsoft/playwright-mcp) for browser automation; hard to replace with a shell pipe when you need to click something. Doc-focused servers like [Docfork](https://github.com/docfork/docfork) and [Cloudflare's Markdown for Agents](https://blog.cloudflare.com/markdown-for-agents/) (which claims around 80% token reduction on documentation lookups) solve problems CLIs don't address well.

These earn their keep. But "earns its keep" is a much smaller set than "installed by default," and that gap is where the argument lives.

## The Case Against MCP

So why not go all-in? This is where I've changed my mind over the past few months, and the turning point had names attached.

In February 2026, Eric Holmes published [MCP is Dead. Long Live the CLI.](https://ejholmes.github.io/2026/02/28/mcp-is-dead-long-live-the-cli.html). A short, pointed argument that the protocol offers no real-world advantage over the command line. A few days earlier, Kan Yilmaz had put [the token arithmetic in a spreadsheet](https://kanyilmaz.me/2026/02/23/cli-vs-mcp.html) and open-sourced a tool called CLIHub that generates CLIs from MCP servers. Read the two together and the case is uncomfortable.

The core argument: LLMs don't need a special protocol. They've been trained on decades of man pages, Stack Overflow answers, shell scripts, and GitHub READMEs. Tell Claude to run `gh pr view 123` and it just works. You didn't teach it `gh`; `gh` was in the training data long before the agent ever touched your repo. MCP promised cleaner interfaces, but in practice you end up writing the same README-style guidance anyway, just in a JSON Schema instead of a `--help` string.

CLIs have decades of design behind them. They're debuggable by both humans and machines. When an agent does something weird with Jira, you can run the exact same `jira issue view` command in your own terminal and see what it saw. Same input, same output, no mystery. With MCP, the tool only exists inside the conversation, and debugging means reading JSON-RPC transport logs if you're lucky and re-running the whole session if you're not.

CLIs compose. Pipes, `jq`, `grep`, redirects. Holmes gives a Terraform example worth reproducing:

```bash
terraform show -json plan.out | jq '[.resource_changes[] | select(.change.actions[0] == "no-op" | not)] | length'
```

One line, no schema, counts the number of actual changes in a plan. The MCP equivalent is either "dump the entire plan into context and let the model count" or "ship a custom filtering parameter on the server." The first is expensive and unreliable on large plans; the second means every MCP author reinventing `jq` badly.

Then there is auth. MCP servers reimplement auth per server, usually worse, and each one wants its own token. Compare to the flows using `aws sso login`, `gh auth login`, etc.

And there's also permissions. MCP permissions are all-or-nothing per server. With CLI tools, Claude Code's allowlist is granular enough to say "allow `gh pr view`, `gh pr list`, `gh issue view`, but require approval for `gh pr merge` and `gh release create`." That granularity is not a nice-to-have; it's the difference between an agent that can read a PR and one that can ship to production without asking.

Then there are other disadvantages of using MCP servers. MCP servers are background processes that need to start, stay running, and not silently hang; binaries sit on disk and run on demand. MCP initialisation failures requiring client restarts have become a routine ritual for anyone who leans on them.

That is quite the list, and a reason to reconsider how many MCP servers we use, if any.

## The Token Economics

Yilmaz ran the numbers for a setup that matches what I had loaded: six MCP servers, roughly fourteen tools each, eighty-four tools total. The [arithmetic](https://kanyilmaz.me/2026/02/23/cli-vs-mcp.html) is blunt:

- MCP session start: ~185 tokens per tool × 84 = **15,540 tokens** loaded upfront. Every schema, whether you use it or not.
- CLI session start: ~50 tokens per tool × 6 binaries named and located = **300 tokens**. Details discovered on demand via `--help`.
- After one tool use: MCP ~15,570, CLI ~910. A 94% saving.
- After one hundred tool uses: MCP ~18,540, CLI ~1,504. A 92% saving.

CLI wins at every usage level between one tool and a hundred, with savings in the 92–98% range. The lazy-loading pattern (discover a tool's surface only when you need it) is just progressive disclosure applied to tool definitions. Same principle I've been banging on about for context generally, different application.

To put the tool counts in context: the official GitHub MCP server [exposes 51 tools](https://gist.github.com/didier-durand/2970be82fec6c84d522f7953ac7881b4) on its remote endpoint. Stripe's official MCP ships [27 tools across four categories](https://docs.stripe.com/mcp). Microsoft's [Playwright MCP](https://github.com/microsoft/playwright-mcp) exposes roughly 25 tools, most of them thin wrappers around Playwright API methods. Load GitHub, Stripe, and Playwright together and you're at ~100 tools before touching Slack, Jira, or anything else your workflow depends on. Every one of those tool definitions is on the wire, every turn.

Anthropic themselves now acknowledge the problem. Their own [Tool Search](https://www.anthropic.com/engineering/advanced-tool-use) post crunches a real customer configuration (GitHub with 35 tools and ~26K tokens, Slack with 11 tools and ~21K, plus Sentry, Grafana, Splunk) and arrives at 58 tools consuming roughly 55K tokens before a conversation begins. Their fix loads a search index instead of every schema, fetches tools on demand, and brings that 77K startup cost down to about 8.7K: a claimed 85% reduction, plus accuracy gains (Opus 4.5 moves from 79.5% to 88.1% on their internal benchmark). Better than the naive MCP pattern. Still worse than CLI, because a Tool Search fetch pulls the full schema, while `gh --help` pulls a human-written summary a tenth the size. We also risk that stochastic models don't find the MCP tool when needed (as it happens with Skills, more on that in a following chapter). And Tool Search is model-specific; it's an Anthropic platform feature, not a protocol win.

Beyond the token cost, the practical pain compounds. MCP servers silently fail to start, and require a manual restart of either the server or the session. Each tool needs its own auth dance. Permissions stay coarse. Meanwhile `gh`, `aws`, and `kubectl` have been doing this for years.

## What This Looks Like in Practice

The theory is one thing. What actually changed in my configuration is the more useful answer. No more token-hungry MCP if there is a CLI that can do the same job. Usually Claude already knows how to use the tools, but a reminder in `CLAUDE.md` like "use `gh` to interact with GitHub" helps guide the agent towards the CLI.

To handle aliases, I provide the agent with an up-to-date list of all the aliases I use via a `SessionStart` hook like the following:

```json
"SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo '## Active Shell Aliases' && cat ~/.claude/shell-aliases.txt 2>/dev/null"
          }
        ]
      }
    ]
```
This is loaded at the start of each session, and ensures that Claude is aware my `grep` is, in fact, `ripgrep`. It has the same limitations we discussed in previous chapters regarding enforcement, but it helps.

For more complex tools, the solution is to find a relevant [Skill](https://skills.sh) that can teach Claude how to use the CLI properly. Skills will be discussed in a following chapter.

To avoid surprises during execution, you can enforce a safety gate by allowlisting only the safe verbs, so that dangerous operations are blocked or require user approval. Trust the training data to handle the syntax. It's not elegant. It's boring. It also works.

## When To Use MCP

If you're going to use MCP (and I still do, selectively), keep it bounded. My current rule of thumb: only servers that are clearly better than a CLI (like MCP for browser interactions) or when I can't find a Skill that replaces the server exactly.

With the new 1M context windows and lazy-loading, it seems like MCP context use through tools shouldn't be an issue. It isn't that simple. If you check `/usage` in a recent version of Claude Code, you'll see that it specifically highlights sessions where the context window went over 150k tokens. That's for a reason, and it shows we still need to consider what we load.

Cloudflare's [Code Mode MCP](https://blog.cloudflare.com/code-mode-mcp/) takes an extreme route that I find genuinely clever: compress tool definitions by replacing entire catalogues with a small number of generic primitives, and let the agent describe what it wants as code. The approach collapses tool surfaces that previously needed tens of thousands of tokens down to roughly 1,000 regardless of API size. If that pattern holds (few entry points, code as the interface), it's closer to how MCP should work at scale than the "load every schema upfront" default. [Anthropic's own code execution with MCP](https://www.anthropic.com/engineering/advanced-tool-use) goes the same direction. The naive version of MCP is on borrowed time.

Boris Cherny, in [MCP, Skills, Sub-agents and Commands](https://cra.mr/mcp-skills-and-agents/), reports he runs with exactly two MCP servers (Sentry and XCodeBuildMCP) and about a dozen skills. He frames it neatly: "skills teach you to cook, MCP provides the instruments that let you do it." If one of Claude Code's principal engineers is down to two MCPs in daily use, that's a number worth paying attention to.

## MCP Security

The security story deserves more attention than it gets, because MCP is a supply chain and we haven't been treating it like one.

Environment variable exfiltration through MCP servers isn't hypothetical. Check Point Research disclosed [CVE-2025-59536 and CVE-2026-21852](https://research.checkpoint.com/2026/rce-and-api-token-exfiltration-through-claude-code-project-files-cve-2025-59536/) in early 2026: malicious `.mcp.json` and `.claude/settings.json` entries in a cloned repository could trigger remote code execution and steal Anthropic API keys before the user had a chance to read the trust dialog. The attack vector was exactly the one MCP's "easy onboarding" was designed to enable: drop a config file in the repo, let the client auto-load it. Between January and February 2026, researchers filed [more than 30 CVEs](https://www.heyuan110.com/posts/ai/2026-03-10-mcp-security-2026/) against MCP servers, clients, and infrastructure, with severities topping out at CVSS 9.6.

Cherny's advice in the same [MCP, Skills, Sub-agents and Commands](https://cra.mr/mcp-skills-and-agents/) post is blunt and worth adopting: have Claude Code review an MCP server's source before you install it, and treat `.mcp.json` as code. Checked into git, reviewed in PRs, signed off like any other dependency.

[Trail of Bits](https://github.com/trailofbits/claude-code-config) goes further. Their shared Claude Code configuration sets `enableAllProjectMcpServers: false` at the top level, alongside a long `permissions.deny` list that blocks reads of `~/.ssh/**`, `~/.aws/**`, `~/.kube/**`, `~/.npmrc`, `~/.pypirc`, `~/Library/Keychains/**`, and a dozen crypto-wallet application paths. Opt-in only, for MCP and for secrets access both. I've adopted the same pattern. The convenience of auto-loading every project's declared servers isn't worth the Monday-morning incident report.

## Where This Leaves Us

My current position, which I reserve the right to change as the tooling matures, is CLI-first. MCP only when there's no CLI equivalent, or when the MCP provides a capability the shell genuinely can't match: Playwright's page interaction, Context7's version-pinned docs, Sentry's scoped issue retrieval. Those are real. Most of the rest are pride-of-ownership servers built because someone decided their API deserved an MCP, not because an MCP made the API materially easier to use.

Document CLI usage in CLAUDE.md. Tell the agent what's on the path and how you want it used. "Use `gh pr list` for open PRs. Use `gh issue view 123 --comments` for issue context." Costs almost nothing in context. Makes the agent immediately productive. Survives protocol changes, client rewrites, and whichever MCP server stopped being maintained last week.

If you're building tools for agents, Holmes's plea is the one I'd echo. Ship a good API. Then ship a good CLI. The agents will figure the rest out. They already have, in every training run since GPT-2. If you're planning an MCP server and don't have an official CLI alongside it, stop and rethink. You're solving the wrong problem in the more expensive way.

I'd go further. In twelve months, the interesting tools will have quietly shipped `--json` output flags, structured `--help` pages, and an allowlist of safe read verbs, and the MCP hype cycle will have cooled into a narrow set of cases where it genuinely pays for itself. Playwright will still be an MCP because browsers are weird. GitHub probably won't, because `gh` is better. The survivors will look less like protocols and more like good old Unix tools that happened to add an AI-friendly output mode.

The CLI will outlive the protocol.
