+++
title = "Making Claude Code Work"
date = 2025-08-24

[taxonomies]

categories = ["ai"]
tags = ["ai", "claude code", "claude", "agents", "llm"]
+++

> *Note: This is a long post. If you’d rather just get your hands dirty, jump to **“Setting Up Claude Code”**. Otherwise, grab a coffee and enjoy.*

Results with AI coding tools vary wildly between developers, even when using the exact same model. Some people swear they ship 10x faster; others walk away muttering something about loops and code that doesn't compile. The difference usually isn’t the tool, but the setup and the process around it.

This guide shows a working environment** that’s been reliable for me across new projects, legacy refactors, and “can we prototype this before lunch?” situations. It’s not a silver bullet. The space moves fast; things will change. But the principles small feedback loops, boring automation, clarity over cleverness—age well.

Also: connecting a code‑generating LLM to your machine is like attaching a fire hose to your kitchen tap. If you had leaks (process gaps) or weak plumbing (tests, CI), they will become very obvious, very quickly. This is good news. It forces discipline.

# A word of caution (and a bit of perspective)

Agents won’t replace developers any more than higher‑level languages did. They will, however, **change where our leverage is**. The craft shifts from remembering library trivia to defining intent, minimising risk, and designing seams that automation can use without tearing your system in half.

If you try Claude Code on a repo with no tests, no linters, no CI, and a README last updated during the Bronze Age… yes, it will generate code. You’ll also get surprise regressions, creative test modifications, and a pull request that reads like a choose‑your‑own‑adventure. Put guardrails in first; then go fast.

> “90% of my skills just went to zero dollars and 10% went up 1000x.” The 10% is vision, milestones, and managing complexity. The rest—where to put the ampersands and stars—matters a lot less.
>
> — Kent Beck (paraphrased from a recent interview)

# Requirements (and realistic expectations)

* **Anthropic account**. Claude Code runs under **Pro** and **Max** subscriptions. Usage isn’t literally unlimited: weekly limits exist and can change. Treat subscriptions as “a comfortable working envelope,” not a GPU rental.
* **Basic hygiene**: a test runner you trust, CI that actually runs on PRs, a linter/formatter, and a place to store docs (even Markdown in the repo is fine). If these are missing, do those first. Claude will happily sprint into walls otherwise.

If your company needs API access (policy, audit, or you’re doing heavy batch jobs), set that up too. For terminal‑first workflows, Claude Code is great; for programmatic batch processing or cost tuning you’ll want the API as well.

# Setting Up Claude Code

Start simple; layer in power features only after the basics feel smooth.

1. **Install Claude Code** following the official guide.
2. **Add editor integrations** so you’re not alt‑tabbing your life away.
3. **Enable notifications** so long runs tap you on the shoulder instead of stealing your afternoon.
4. **Optional**: set up a dev container / Codespace for safe experiments (we’ll cover this later).

When you first run `claude` in a project, keep auto‑editing **off** and use planning mode a few times; you’ll get a feel for how it reads your repo, asks for context, and proposes the next steps.

# The secret weapon: `CLAUDE.md`

Think of `CLAUDE.md` as the project’s working memory. Without it, Claude can still do things—but it will wander. With it, you get consistent behaviour: naming, testing, API shapes, “how we do things here.”

### What to put in `CLAUDE.md` (root)

* **Project brief**: one paragraph; what exists, what’s being built.
* **Tech constraints**: language/runtime versions, frameworks, must‑use libraries, “absolutely do not change X”.
* **Command crib sheet**: how to run tests, linters, dev server, seed data.
* **Definition of done**: when is a task complete? (tests pass, lint clean, updated docs, PR created)
* **Links**: to testing guidelines, API conventions, Git workflow, and any service docs.

### “Layered” memory (how Claude picks up context)

Claude walks **from your current directory upwards** (never past `/`) and reads `CLAUDE.md` files it finds. That means you can add local rules at `frontend/CLAUDE.md`, `tests/CLAUDE.md`, etc., and they’ll be read when working in those areas. Use this to keep the root file lean and push specifics down to subfolders.

> Modern tip: prefer **imports** inside `CLAUDE.md` such as `@/docs/testing-practices.md` instead of dumping everything in one file. Keep topics as separate Markdown files and import them where needed.

### A practical starter layout

```
.
├── CLAUDE.md                 # project overview + high-level rules
├── docs/
│   ├── development-guidelines.md   # TDD, refactoring, code review checklist
│   ├── api-patterns.md             # REST/GraphQL conventions, error shapes
│   ├── testing-practices.md        # how to test, fixtures, speed knobs
│   └── git-workflow.md             # branches, commits, PR rules
└── tests/
    └── CLAUDE.md                   # test strategy and boundaries
```

I usually let Claude **generate the initial file** by running `/init` in a new repo; then I edit ruthlessly. Add examples. Show a good commit message. Demonstrate a small refactor. The more you show, the less you argue.

# Process matters more than prompts

When your agent can churn out 150k lines overnight, your only defence is process. The teams getting consistent results aren’t reciting magic incantations; they’re doing the boring bits well:

* **TDD or test‑first habits**: stop the tool from “fixing” tests to make green builds.
* **Small, iterative changes**: easier to review and to bisect.
* **Continuous Integration**: because “it runs on my laptop” is now “it runs on my agent’s laptop,” which is worse.
* **Prefer simple solutions** first: you can always grow complexity behind tests.
* **Write down decisions**: a quick `docs/adr/0001-use-sqlite.md` beats archeology later.

Be **declarative** with the agent. Describe outcomes and constraints (“add pagination to `/users` using our `Page<T>` pattern; update tests; no DB schema changes”). Don’t micromanage the method names. If the code passes tests and fits your contracts, bless it and move on.

# Installing MCP (Model Context Protocol) tools

MCP servers are like plug‑ins you can bolt onto Claude Code to give it capabilities: browse with a headless browser, query a DB, read up‑to‑date docs, etc. Used judiciously they’re fantastic; installed everywhere they can **rot your context**. Add them when you have a concrete use.

### Security first

MCP configs can carry credentials. Store them where it makes sense:

* `-s user` → user‑level storage (e.g., in your home config). Good default.
* `-s local` → project‑local. Useful for team‑shared tools without personal keys.

Never drop secrets in the repo. If you must share settings, share **templates** and docs.

### What I actually install (and why)

* **Sequential Thinking**: great for structured problem solving when you want the agent to outline options, tradeoffs, and choose a path.
* **Playwright MCP**: lets an agent drive a browser and reason about real pages. Golden for UI test scaffolding, scraping internal docs, or “what does this SPA actually do when I click X?”.
* **Context/Docs fetchers** (e.g., DeepWiki‑style): pull repo documentation for OSS libs directly into context when you need “how does this framework’s router really resolve this?”.

Install pattern (example):

```bash
# User-scoped install
claude mcp add playwright -s user -- npx -y @playwright/mcp

# Project-scoped install
claude mcp add sequential-thinking -s local -- npx -y @modelcontextprotocol/server-sequential-thinking
```

After installing a couple, ask Claude:

> “Scan installed MCPs. Which require configuration? Propose minimal secure setup and add usage notes to `CLAUDE.md`.”

Then commit the docs so your future self says thanks.

**Rule of thumb**: for coding tasks, a **shell command** is often clearer and cheaper than teaching an agent to use a tool. Reach for MCPs when they unlock a big capability (browser, search, data store), not to show off.

# Slash commands and hooks

Slash commands are **reusable prompts** saved as Markdown files. I keep project‑specific ones in the repo and personal ones in `~/.claude/commands/`.

Examples I like:

* `/security-review` → run a static security pass and comment on risky patterns found in the diff.
* `/docstring` → generate docstrings for changed functions/classes in a commit.
* `/pr-polish` → rewrite a PR description, list risks, and call out migration steps.

**Hooks** let you run shell commands at specific points in an agent session. A few handy ones:

* **PreToolUse**: ensure deps are installed; warm caches; sanity checks.
* **PostToolUse**: run linters/formatters.
* **Stop** / **SubagentStop**: summarise what happened; write `CHANGELOG.md` entries; tag a release candidate; post Slack messages.
* **Notification**: send a desktop/push note when long tasks complete.

Keep hook scripts **idempotent** and fast. If a hook fails, your run shouldn’t be bricked.

# Monitoring, safety… and the bill

## Costs and tokens (because the bill matters)

You don’t have to memorise rates, but you should internalise a few patterns:

* **Prompt caching**: cache writes cost more than base input, cache **reads are cheap**. Cache your long, stable system prompts and big context blobs; reuse them across tasks.
* **Batch API**: for non‑interactive bulk work (migrations, doc passes), batch is **half price** on tokens. Prepare jobs and let the provider schedule them.
* **Long context**: once you cross a threshold, **all tokens in that request** can jump to premium pricing. Keep requests well under the threshold when you can.
* **Tool use overhead**: tools add tokens (schemas, tool prompts). Don’t pass your entire schema registry if you only need `git diff`.

### A back‑of‑the‑napkin calculator

When I sense “this might get pricey,” I do a 30‑second estimate:

* Input \~ **X** tokens (prompt + code it has to read).
* Output \~ **Y** tokens (what you expect back).
* Multiply by the model’s in/out rates.
* If you’ll reuse the same context many times, **cache** it and assume 90% of re‑reads are at the cheaper cache‑hit rate.
* If the task can be split into 20 similar, non‑urgent jobs, consider **Batch API**.

Then I change the plan, not my faith in automation.

### Practical tips to keep costs tame

* **Right‑size the model**: for rote edits and small scripts, use the small/fast model; save Sonnet/Opus for planning and tricky refactors.
* **Cap `max_output_tokens`** for commands that should return short answers.
* **Index documents**: keep a tiny “index.md” with links to specs/decisions; have Claude read that, not your entire `/docs`.
* **Prefer diffs** over whole files when asking for changes.
* **Reset often**: finish a task → `/clear` → start the next. Fresh context reduces “let me read the world again” costs.

## Usage limits (weekly)

Subscriptions now come with **weekly caps** for Claude Code. The headline: most Pro users have enough hours for steady work; Max tiers buy you a lot more headroom. Treat these as **guardrails**. If you hit them, it’s a signal to re‑plan (batch or API) rather than a reason to swear at clouds.

## Safe environments: Dev Containers & Codespaces

Claude Code can run destructive commands. You *can* use `--dangerously-skip-permissions` to keep it from nagging you every time it edits a file or runs a script. Do that only inside an **isolated environment** you control.

Good options:

* **Dev containers**: check a `devcontainer.json` and Dockerfile into the repo. Lock down outbound network, preinstall tools, and give the agent a sandbox.
* **GitHub Codespaces**: fantastic for experiments, parallel spikes, and “I don’t want my laptop to be the staging server today.” Free personal quotas exist; don’t forget to delete idle spaces.

Trade‑offs:

* Your local, personal `~/.claude/` isn’t in the container; replicate anything important in the repo or the container’s home.
* You’ll reinstall user‑level MCPs inside each container.
* Idle timeouts will shut down long runs; plan accordingly (or raise the timeout within reason).

# Optional: Jujutsu (jj) for version control

Git’s staging dance can be tedious when an agent edits many files. **Jujutsu** layers on top of Git and gives you automatic snapshots without staging. It’s lovely for “Claude just did 13 things; show me what and let me roll back step‑by‑step.” You can keep Git commands for PRs and remotes while using jj locally for day‑to‑day.

# A single‑task workflow to start with

When you’re new to Claude Code, avoid the multi‑agent circus. Nail the basics:

1. **Design first**: ask Claude to draft an `arch.md` (technical design) and `tasks.md` (implementation steps). Review, edit, and only then proceed.
2. **Maintain `CLAUDE.md`**: prepend `# notes` in your prompts to append permanent rules. Add sub‑directory `CLAUDE.md` files as the codebase grows.
3. **Unify logs**: if you’re debugging a full stack, pipe server, client, and DB logs to one place (file or terminal tab) so the agent—and you—can reason about flows.
4. **Manage context**: write intermediate artifacts (`spec.md`, `plan.md`, `results.md`) and **link them**. Ask Claude to read the index, not every file.
5. **TDD the edges**: add a couple of tests before changing behaviour. Claude is less likely to edit tests it just watched you write.
6. **Finish cleanly**: run linters, tests, and then `/clear`. Don’t let context bleed into the next task.

### Tips & small tricks

* **Shift+Tab** toggles plan/auto‑edit modes. Spend more time in planning than you think you need; it pays off.
* Use **“think / think harder / ultrathink”** wording when you need deeper planning. It grants more reasoning time. Use sparingly; it also costs more tokens.
* **Drag screenshots** when debugging UI; ask Claude to describe visual diffs. It’s faster than narrating CSS by hand.
* **Restrict files**: “only read `src/auth/**` and `src/db/**`” is magic when you want focused changes.

# Parallel development with Git worktrees

Once you’re comfortable, you can run several Claude sessions at once by using **git worktrees**—separate folders, each on a different branch, all sharing the same repo data. This is perfect for splitting a refactor from a feature from a bugfix without switching context or stashing constantly.

```bash
git worktree add ../feature-auth -b feature/auth
git worktree add ../feature-api -b feature/api
git worktree add ../bugfix-validation -b bugfix/validation
```

Spin up a Claude session per worktree. Give each one a **narrow task** and its own context. When a branch is done, run tests, push, PR, and close the session.

### A real‑ish example: modernising a legacy bot

Instead of one huge “rewrite the bot” task, create parallel lanes:

* **Auth upgrade**: replace fragile token logic; add rotation.
* **SQLite migration**: move off a creaky hosted DB for local/dev.
* **API cleanup**: normalise responses, unify error envelopes.
* **Test expansion**: characterise current behaviour before refactors.

Give each lane:

* A focused **task definition** (one paragraph; success criteria).
* The right **CLAUDE.md** imports (only what’s relevant).
* A small **checklist** (tests pass; no new globals; update docs).

Let Claude work in parallel; you review and merge in small, safe chunks. This compresses a week into a day—without turning your repo into soup.

# Advanced orchestration (optional, later)

If you’re the type who enjoys herding cats:

* **Task‑driven orchestration** (e.g., a “task master” utility): generate a PRD, split into tasks, and let a script feed them to Claude one‑by‑one with the right tools. Good for long backlogs and repeatable processes.
* **Agent swarms / flow orchestration**: coordinate multiple agents for larger projects. Do this in **isolated environments**, cap the number of agents, and measure token spend. It’s fun; it’s also easy to produce expensive, mediocre code in bulk. Guardrails or bust.

# Notifications, status lines, and small comforts

* Set your **notification channel** so long runs ping you instead of stealing an afternoon.
* Use `/statusline` to show project, branch, model, and dirty file count. Tiny detail, big clarity.
* Add a `/terminal-setup` script once and stop fighting your shell (keybindings, newlines, copy/paste quirks).

# Closing thoughts (and what to do next)

Don’t chase cleverness. Chase **clarity**. Keep tasks small. Write down decisions. Cache what’s stable. Batch what can wait. Reset context between tasks. Prefer simple code that passes good tests over ornate code that impresses nobody in six months.

**Your next hour**:

1. Add a minimal `CLAUDE.md` to a project you care about.
2. Create `docs/testing-practices.md` with two concrete examples.
3. Run `claude` in **plan mode**, ask for an `arch.md` and `tasks.md` for a tiny change.
4. Implement with tests, commit, PR.
5. Only then consider MCPs, dev containers, or parallel sessions.

If you do the boring bits well, Claude Code stops feeling like a slot machine and starts feeling like a teammate who thrives with good direction.
