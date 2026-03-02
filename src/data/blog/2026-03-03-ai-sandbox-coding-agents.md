---
author: Pere Villega
pubDatetime: 2026-03-03
title: "I Built Yet Another Sandbox for AI Coding Agents — Here's Why"
draft: false
tags:
  - ai
  - devtools
  - docker
  - security
description: "Why existing sandbox solutions for AI coding agents didn't work for my workflow, and how I built sandbox-claude: fully isolated Incus containers with btrfs snapshots, deploy key automation, egress filtering, and parallel agent support on macOS and Linux."
---

Yes, I know. Everyone and their dog has a sandbox solution for AI coding agents these days. I'm fully aware of that. And yet, after trying several options, I ended up building my own. Let me explain why none of the existing solutions worked for my workflow, and walk you through what I came up with.

But first, a quick check on why this matters. In February 2026, the [Cline VS Code extension](https://cline.bot/blog/post-mortem-unauthorized-cline-cli-npm), with over 5 million users, was compromised through a prompt injection chain that exfiltrated npm release tokens and led to an unauthorised package being published. The problem is not theoretical. If you're giving an AI agent access to your filesystem, credentials, and network, you need a plan for when things go wrong.

## The Problem With Existing Solutions

Running Claude Code in YOLO mode is incredibly productive, until you realise the agent has full access to your host filesystem, credentials, and network. You need some kind of isolation. But the options out there all had trade-offs that didn't sit well with me.

**Paid cloud sandboxes** are the obvious first choice, and the market is crowded. [E2B](https://e2b.dev/) uses Firecracker microVMs with sub-200ms cold starts. [Daytona](https://www.daytona.io/) pivoted to AI agent infrastructure in 2025 and claims sub-60ms cold starts with Docker, Kata Containers, or Sysbox runtimes. Fly.io's [Sprites](https://sprites.dev) offer persistent, stateful VMs built on Firecracker that auto-idle when inactive. [Northflank](https://northflank.com/) runs isolated workloads via Kata Containers. [Modal](https://modal.com/) uses gVisor for serverless sandboxing. They're all impressive engineering. But they all add recurring costs on top of the agent itself. Cloud bills stack up fast, especially when you're spinning up multiple environments for parallel work. I wanted to avoid that overhead entirely.

**Devcontainers** were my first go-to. They work reasonably well for a single project, but the moment you start spawning them per branch, which is exactly what you want for parallel agent work, things get painful. Constant re-authentication with Claude, slow rebuilds, friction everywhere. It became a workflow killer.

**Docker Desktop on Mac** wasn't an option. Docker themselves have now launched their own [Docker Sandboxes](https://www.docker.com/blog/docker-sandboxes-a-new-approach-for-coding-agent-safety/) product, wrapping agents in containers that mirror your local workspace. But my M1 and Docker for Mac have a complicated relationship, it fails too often. I already use OrbStack as my container runtime, which gives me lightweight Linux VMs out of the box. Why not take advantage of that directly?

**[Container Use](https://github.com/dagger/container-use)** by Dagger is open source and gives each agent a containerised sandbox with its own git worktree. It integrates nicely with editors like Zed. But it's Docker-based, which means the same shared-kernel isolation limitations that Docker has.

**[Code on Incus (COI)](https://github.com/mensfeld/code-on-incus)** by Maciej Mensfeld is the closest thing to what I wanted. It runs Claude Code, Aider, and opencode in hardened Incus system containers with real-time network threat detection, automatic threat response, credential isolation, and multi-slot support. It's excellent work. I just didn't want to rely on Lima VMs, as I already have OrbStack available.

**Other sandbox tools** felt too tailored to one specific pattern of use, usually the way their creator works. I needed something flexible: something that works locally on macOS via OrbStack AND on a remote Linux VM with the exact same commands. Same tool, different environments.

## What I Built

[Sandbox for Claude](https://github.com/pvillega/sandbox-claude) runs Claude Code agents in fully isolated [Incus](https://linuxcontainers.org/incus/) containers. Each container gets its own filesystem, Docker daemon, workspace, dedicated SSH deploy key, bidirectional port forwarding, and egress filtering. Your host stays completely untouched.

The architecture is straightforward. On macOS, you get three layers of isolation:

```
macOS (safe, never touched by agents)
 └── OrbStack VM "sandbox" (lightweight Ubuntu VM)
      └── Incus containers (btrfs storage, isolated bridge network)
```

On Linux, you skip the VM layer and Incus runs directly on the host.

The key insight is using **btrfs copy-on-write snapshots** as golden images. I pre-build container images with all the tooling installed (Rust, Python, Node, Go, .NET, and even Unison). Spinning up a new container from one of these golden images is instant: no reinstalling packages, no waiting for builds. It's a btrfs clone, which takes milliseconds.

## Requirements

The setup is minimal:

**On macOS**, you need OrbStack installed (`brew install orbstack`). That's it. The setup script handles everything else inside the VM.

**On Linux**, you need Ubuntu 22.04+ or Debian 12+. A prerequisites script installs iptables, curl, git, and the GitHub CLI for you. Incus and Squid (for egress filtering) are installed automatically during setup.

**On both platforms**, you need the GitHub CLI (`gh`) for deploy key automation, and admin access on the repos you want to work with. 16GB of RAM is recommended since you'll be running VMs, containers, and Docker daemons inside those containers.

## Getting Started

Clone the repo and run the installer:

```bash
git clone https://github.com/pvillega/sandbox-claude.git
cd sandbox-claude
./install.sh    # Installs wrapper scripts into ~/.local/bin
```

Then run the one-time setup:

```bash
# macOS — creates the OrbStack VM, installs Incus, builds golden images
sandbox-setup

# Linux — install prerequisites first, then setup
sudo sandbox-linux-prereqs
sandbox-setup
```

The first setup takes about 10 minutes as it builds the golden images. After that, everything is instant.

Before you create any containers, set up your environment variables. Create a `~/.sandbox/env` file:

```bash
# If you don't use a Claude Code subscription
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Optional: Project-specific variables
RUST_LOG=debug
NODE_ENV=development
```

## A Real Workflow: Single Project

Let's say I'm working on a Rust API project. Here's how it looks in practice.

**Create the sandbox:**

```bash
sandbox-start my-api git@github.com:me/my-api.git --stack rust
```

This does several things automatically: it clones the Rust golden image (instant btrfs snapshot), generates an ed25519 deploy key and registers it on GitHub via `gh`, sets up an SSH agent with the key (the private key never touches the container's disk), clones the repo into `/workspace/project`, and prints connection info with assigned ports.

**Open Claude Code in the sandbox:**

```bash
sandbox my-api --claude
```

This drops you straight into Claude Code running inside the isolated container. YOLO mode is now safe: the agent can only touch files inside the container, can only push to the repo its deploy key is scoped to, and network egress is filtered.

**Or just get a shell:**

```bash
sandbox my-api
```

You can also connect from VS Code via SSH. Each container gets a unique SSH port based on its slot number (e.g., slot 1 maps to `localhost:2201`). Just point VS Code's Remote SSH at that port and you have a full IDE experience with the sandboxed environment.

**Expose additional ports** if your app needs them:

```bash
# Expose PostgreSQL — slot-based offset keeps ports unique
sandbox-expose my-api 5432

# Expose with a specific host port
sandbox-expose my-api 5432 --host-port 15432
```

**Check the status** of all your sandboxes:

```bash
sandbox-list
```

This gives you a table showing container state, port mappings, Docker health, SSH agent status, Claude auth status, and the current git branch.

**When you're done:**

```bash
# Stop but preserve state (can restart later)
sandbox-stop my-api

# Or full teardown — removes container, deploy key, everything
sandbox-stop my-api --rm
```

## A Real Workflow: Parallel Agents on Multiple Projects

This is where it gets interesting. The whole point of this setup is enabling parallel agent work.

Say I'm working on two projects: a Rust backend and a Node frontend. I want Claude Code running on both simultaneously.

```bash
# Create both sandboxes
sandbox-start backend git@github.com:me/backend.git --stack rust
sandbox-start frontend git@github.com:me/frontend.git --stack node
```

Now I can open Claude Code in both at once with a single command:

```bash
sandbox backend frontend --claude
```

This creates a tmux session with a pane for each container, each running Claude Code. I can switch between panes, monitor both agents, and let them work independently, fully isolated from each other and from my host.

**Branching from an existing container** is also trivial. Say I need to work on a hotfix while the main branch work continues:

```bash
sandbox-start backend-hotfix --from backend --branch hotfix/auth-fix
```

This inherits the repo URL and stack from the existing container, checks out the specified branch, and you're off. The idea is that once a project is set up, you can create multiple git worktrees or branch containers to work with agents in parallel on different features.

Want to run the same command across all containers? That works too:

```bash
sandbox backend frontend --cmd "git status"
```

## A Day in the Life

To make this more concrete, here's what a typical working day looks like.

I start by running `sandbox-list` to check what's still running from yesterday. The backend container is stopped but preserved,  a quick `sandbox-start backend` brings it back in under a second (it's just resuming a stopped container, no provisioning needed). I check the git status inside it, see the agent's work from yesterday is ready for review.

I need to work on a new feature in parallel, so I branch from the existing container: `sandbox-start backend-auth --from backend --branch feature/oauth-flow`. Instant btrfs clone, same tooling, separate workspace. I also have a frontend to update, so `sandbox-start frontend git@github.com:me/frontend.git --stack node` gives me a third environment.

Now I open all three with `sandbox backend backend-auth frontend --claude`. Tmux splits into three panes, each running Claude Code inside its own isolated container. I give each agent its task: one reviews yesterday's PR, one starts the OAuth implementation, one updates the frontend API client. Then I switch to some other task.

When I come back, I check progress by cycling through panes. The review agent has left comments on the PR. The OAuth agent has scaffolded the flow and is writing tests. The frontend agent has updated the API types and is building the login form. Three agents, three isolated environments, zero risk to my host. If any of them does something catastrophic, the blast radius is contained to that single container.

## Security: What's Actually Protected

The security model in sandbox-claude is layered and deliberate. Here's what stays safe:

**Your host filesystem** is completely isolated. Agents run inside Incus containers (inside an OrbStack VM on macOS). There's no host filesystem access whatsoever.

**Containers are isolated from each other.** Each one gets its own filesystem, process tree, and network namespace. Port isolation at the kernel level means containers can't communicate with each other, only with the bridge gateway.

**SSH private keys never touch the container's disk.** They live only in ssh-agent memory in the sandbox environment. Each container has its own ssh-agent process. Keys are automatically cleaned up from GitHub when you destroy a container.

**Deploy keys are scoped per-repo.** A compromised container can only push to the single repository its deploy key was created for.

**Network egress is filtered by default** — only DNS, HTTP, HTTPS, and SSH are allowed outbound. For tighter control, you can enable domain-based HTTPS filtering:

```bash
sandbox-start my-project git@github.com:me/repo.git --restrict-domains
```

This uses Squid in SNI peek/splice mode: it reads the TLS ClientHello to check the target domain against an allowlist, then either splices or rejects the connection. No decryption, no MITM, no CA cert needed. The bundled default allowlist covers about 190 domains including Anthropic services, GitHub, package registries, cloud platforms, and common dev tools. You can customise it per-project.

## Stacks: What Comes Pre-Installed

Every container starts from a base golden image that includes Docker CE, Claude Code (native binary), Python 3, git, tmux, ripgrep, jq, and all the essentials. On top of that, each stack adds its specific toolchain and quality tools:

The **Rust** stack adds the stable toolchain via rustup, plus clippy, rustfmt, cargo-tarpaulin for coverage, and cargo-audit for security scanning.

The **Python** stack includes Poetry, uv, ruff, mypy, bandit, and coverage.

**Node** comes with Node.js 22 LTS, npm, pnpm, yarn, bun, plus c8, eslint, and prettier.

**Go** includes golangci-lint and govulncheck.

**.NET** has the latest LTS SDK with coverage and formatting tools.

There's even a **Unison** stack with the Codebase Manager and its built-in LSP and MCP server.

Adding a custom stack is straightforward — write a shell script that runs inside a container with the base already installed, drop it in the `stacks/` directory, and rebuild:

```bash
sandbox-setup --rebuild my-custom-stack
```

## Why Incus, Not Docker

Docker is the obvious default for containerisation, and Docker themselves have now launched [Docker Sandboxes](https://www.docker.com/blog/docker-sandboxes-a-new-approach-for-coding-agent-safety/) specifically for AI agent isolation. So why Incus?

The fundamental difference is **system containers vs application containers**. Docker containers are designed to run a single process: your app, your database, your web server. Incus containers are full operating systems with init, systemd, SSH, package managers, and the ability to run multiple services. This matters enormously for AI agent work. An agent needs to `apt install` arbitrary packages, run Docker inside the container (Docker-in-Docker), use `sudo`, start background services, and generally behave as if it has a full machine. System containers give you all of that naturally. Docker containers require increasingly hacky workarounds.

Incus also provides stronger isolation out of the box. Unprivileged containers use Linux user namespaces: the root user inside the container maps to an unprivileged UID (100000+) on the host. Even if an agent achieves a container escape, it lands as an unprivileged user. Standard Docker containers run as actual root by default, you need `rootless mode` or `userns-remap` to get equivalent isolation, and both come with their own friction.

[Incus](https://linuxcontainers.org/incus/) is a community fork of LXD, created after LXD's original developers left Canonical. It's actively maintained, backward-compatible with LXD, and provides built-in clustering, GPU passthrough, and the ability to run both system containers and full VMs through the same tooling.

The trade-off is clear: Incus is Linux-only. On macOS, you need a Linux VM to run it. Which brings us to OrbStack.

## Why OrbStack on macOS

Docker Desktop on Mac has been causing me problems on my M1. I switched to [OrbStack](https://orbstack.dev/) a while ago and haven't looked back. The numbers tell the story: OrbStack starts in about 2 seconds, consumes roughly 60% less memory than Docker Desktop, and has significantly better filesystem performance for bind mounts.

Since I already depend on OrbStack, it made sense to use its lightweight Linux VMs as the foundation rather than fighting with Docker. The VMs are native, fast, and I can do things like connect from VS Code via SSH, expose ports transparently, and run Incus inside them without any of the Docker-on-Mac headaches.

This also means the same tooling works when I SSH into a remote Linux server. Same commands, same workflow. That was a hard requirement. I wanted a solution that's portable between my local Mac and a cloud VM.

As a footnote: Apple announced their own open-source [containerisation framework](https://developer.apple.com/documentation/apple-containers) at WWDC 2025, where each Linux container runs in its own lightweight VM. It's early-stage, no compose equivalent, limited orchestration, but worth watching. If it matures, it could become a native alternative to OrbStack for this kind of use case.

## The Cost of Running Locally vs Cloud

One of the main motivations for building this was avoiding recurring cloud costs. Let's put some rough numbers on it.

Fly.io Sprites cost approximately $0.02/hour per instance. If you run 3 sandboxes for 8 hours a day on weekdays, that's about $10/month. Scale to 5 sandboxes and heavier usage, and you're looking at $20-40/month. E2B bills per CPU-second, which can climb to $50-100+/month with heavy parallel use. Daytona has similar usage-based pricing. These are reasonable for some workflows, but they compound. Add agent API costs on top (Claude Code, Copilot, etc.) and the monthly bill for AI-assisted development adds up fast.

With sandbox-claude, the marginal cost is zero. You're using hardware you already own. The only real cost is the initial 10 minutes of setup time and the RAM you dedicate to running containers. For someone who runs multiple agents daily across several projects, the savings pay for themselves immediately.

The trade-off is obvious: you're limited to your machine's resources, and you're responsible for your own maintenance. If you need to scale to 20+ concurrent agents, a cloud solution makes more sense. But for the 3-5 parallel sandbox workflow that most individual developers actually use, local is hard to beat.

## What This Doesn't Do

I'd rather be upfront about the limitations than have you discover them after setup.

**Incus is Linux-only.** On macOS, you're running Incus inside an OrbStack VM. This adds an indirection layer. It works well in practice, but it's not native. If you're looking for something that runs directly on macOS without a VM, this isn't it (and honestly, nothing that provides real isolation is, yet).

**No GPU passthrough.** If you need agents to run ML workloads or CUDA builds inside the sandbox, look at Modal or a cloud solution. This is designed for general software development, not GPU-heavy work.

**It's shell scripts, not an SDK.** There's no programmatic API you can integrate into CI/CD pipelines or orchestration tools. It's a set of bash scripts designed for interactive use by a developer at a terminal. If you need infrastructure-as-code or API-driven sandbox management, E2B or Daytona are better fits.

**Single-machine scope.** Unlike cloud solutions that can scale horizontally, you're limited to the resources of whatever machine you're running on. For most individual developers running 3-5 agents, this is fine. For a team or an automated pipeline spinning up dozens of sandboxes, it's not.

**btrfs write amplification.** btrfs copy-on-write is fantastic for instant cloning, but write-heavy workloads (large builds, frequent package installs) can cause fragmentation over time. In practice, this hasn't been a problem for me, golden images handle the heavy lifting, and individual containers are relatively short-lived. But it's worth knowing if you plan to keep containers running for weeks.

**Opinionated workflow.** This is built around how I work: OrbStack on macOS, Incus containers, golden images, deploy keys, tmux. If your workflow is substantially different, you may find it doesn't bend easily. That's a feature, not a bug. Opinionated tools are simpler tools, but it does mean this won't be for everyone.

## The Nuclear Option

When things go sideways or you just want a clean slate:

```bash
sandbox-nuke
```

This destroys all containers, cleans up deploy keys, removes golden images, and on macOS deletes the OrbStack VM entirely. Run `sandbox-setup` again and you're back to a fresh start in about 10 minutes.

## Try It Out

The project is MIT licensed and on GitHub: [github.com/pvillega/sandbox-claude](https://github.com/pvillega/sandbox-claude)

It's opinionated. It assumes OrbStack on macOS, uses Incus rather than Docker for containers, and has a specific workflow around golden images and deploy keys. But if your setup is anything like mine — running Claude Code agents that need real isolation, working across branches in parallel, wanting to avoid cloud costs — it might save you the same headaches I ran into.

I'd love feedback, especially from anyone else navigating the "how do I let agents loose without wrecking my machine" problem. Open an issue or reach out.
