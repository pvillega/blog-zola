---
author: Pere Villega
pubDatetime: 2026-04-02
title: "Running AI Coding Agents on Hetzner"
draft: false
tags:
  - ai
  - infrastructure
  - developer-tools
  - ai-developer-evolution
  - hetzner
  - vps
  - tailscale
  - cloudflare
  - coolify
  - claude-code
  - devops
description: "A complete guide to provisioning and hardening a Hetzner VPS for AI coding agents — covering cloud-init security, Tailscale mesh networking, Cloudflare Tunnel, Coolify orchestration, Claude Code resource planning (including the subagent memory pitfalls), and automation scripts to go from zero to a working environment in minutes."
series: "ai-developer-evolution"
seriesOrder: 1
seriesSection: "appendices"
---

Everyone, myself included, recommend people to run agents in sandboxed environments.This is all good and well, except the way people sandbox their environments is, often, a docker container that has a volumne mounted, where the default permissions enable agents to access the host. There is no issue, until the issue happens and you need to test how well your backups work. I hope you trust them.

The solution is straightforward: use a remote machine for development. This is even more relevant nowadays, where Claude's `remote` and `dispatch` extensions mean you may want your box reachable online, so that you can unblock your agents when not in-front of your daily machine.

So I built a remote box for myself, and I wrote down what I learned. This post covers the full stack: provisioning and hardening a Hetzner VPS, securing it with Tailscale and Cloudflare Tunnel, optionally managing it through Coolify, and figuring out which machines actually work for running Claude Code with multiple parallel subagents. I've included automation scripts so you can reproduce the setup without the trial-and-error phase I went through.

Fair warning: this is a long one. Grab a coffee.

## Why Hetzner, and why now?

If you've been running AI coding agents on your laptop, you've probably noticed the limitations. Your machine gets hot, battery life tanks, and — if you're running multiple agents in parallel via [worktrees](https://code.claude.com/docs/en/common-workflows) — everything else grinds to a halt. The obvious solution is to offload this to a remote server. And if you're in Europe (or don't mind your agent traffic crossing the Atlantic), [Hetzner](https://www.hetzner.com) remains the best price-to-performance ratio in the VPS market by a comfortable margin — typically 30–50% cheaper than DigitalOcean or Linode for equivalent specs.

There's a catch, though. Hetzner [raised prices 30–37% effective April 2026](https://www.tomshardware.com/tech-industry/hetzner-to-raise-prices-by-up-to-37-percent-from-april-1), citing a 171% year-over-year increase in DRAM costs. Even after the increase, they're still the value leader, but the gap has narrowed. Here's what the landscape looks like now.

### The machine types that matter for agent workloads

Hetzner offers four cloud VPS lines, plus dedicated servers. For AI coding agents, the distinctions matter more than they do for typical web hosting.

The **CX series** (shared Intel/AMD, EU-only) starts at €3.99/month for 2 vCPUs and 4 GB RAM. These are fine for a single Claude Code instance doing light work — think exploratory coding, not running test suites. The CX43 (8 vCPUs, 16 GB, €11.99/month) is where things start getting useful for agent work, and the CX53 tops out at 16 vCPUs and 32 GB for €22.49.

The **CAX series** (ARM Ampere Altra, EU-only) deserves special mention. Claude Code is Node.js-based and runs natively on ARM64, so the CAX line's superior price-to-performance ratio actually applies here. A CAX41 gives you 16 vCPUs and 32 GB for €31.49/month — roughly 30% cheaper than the equivalent x86 option. I'd test your specific workflow on ARM before committing, but it's worth considering.

The **CPX series** (AMD EPYC, available globally including the US) runs €7.99–€36.49/month in EU regions, with US pricing 8–36% higher and Singapore adding 40–67% on top. Unless you need a US or APAC data centre, stick with EU.

The **CCX series** (dedicated AMD EPYC vCPUs) eliminates the noisy-neighbour problem that plagues shared instances — and for agent workloads that spike CPU during builds and test runs, this consistency matters. The sweet spots are the CCX33 (8 dedicated vCPUs, 32 GB, €62.49/month) and CCX43 (16 dedicated vCPUs, 64 GB, €124.99/month).

And then there are **dedicated servers**, which flip the economics entirely. The [AX42](https://www.hetzner.com/pressroom/new-ax42/) — an AMD Ryzen 7 PRO 8700GE with 8 cores/16 threads, 64 GB DDR5 ECC, and 2×512 GB NVMe — costs roughly €57/month after the April increase. That's less than a CCX33 cloud instance with significantly better sustained performance. The [Hetzner Server Auction](https://www.hetzner.com/sb) offers refurbished machines starting around €30–50/month with no setup fees (track deals at [radar.iodev.org](https://radar.iodev.org/)). If you're running agents for more than a few hours a day, dedicated servers are almost certainly the better deal.

One Hetzner-specific detail that's bitten me: a primary IPv4 address costs +€0.50/month. IPv6 is free, but many services (including some that Claude Code might interact with via `web_fetch`) don't handle IPv6 properly. Budget for the IPv4.

---

## Hardening the server: cloud-init does the heavy lifting

Security on a VPS isn't optional, especially when you're running AI agents that can execute arbitrary shell commands. The goal is defence in depth: SSH key-only authentication, a non-root user, UFW firewall, fail2ban for brute-force protection, and unattended-upgrades for automatic patching. Once Tailscale is set up (next section), we can close the public SSH port entirely.

Hetzner's Cloud Console accepts [cloud-init](https://cloudinit.readthedocs.io/) YAML during server creation. This is where I do the bulk of the hardening — everything runs before I ever SSH in. Here's my production config, evolved over several iterations (the [Hetzner community tutorial](https://community.hetzner.com/tutorials/basic-cloud-config/) was the starting point):

```yaml
#cloud-config
users:
  - name: deploy
    groups: users, admin, docker
    sudo: ALL=(ALL) NOPASSWD:ALL
    shell: /bin/bash
    ssh_authorized_keys:
      - <YOUR_SSH_PUBLIC_KEY>
      - <COOLIFY_SSH_PUBLIC_KEY>  # if using Coolify

packages:
  - fail2ban
  - ufw
  - unattended-upgrades
  - tmux
  - git
  - curl
  - jq

package_update: true
package_upgrade: true

ssh_pwauth: false
disable_root: true

write_files:
  # Sysctl hardening
  - path: /etc/sysctl.d/99-hardening.conf
    permissions: "0644"
    content: |
      net.ipv4.conf.all.rp_filter=1
      net.ipv4.conf.all.accept_source_route=0
      net.ipv4.conf.all.accept_redirects=0
      net.ipv4.conf.all.secure_redirects=0
      net.ipv4.conf.all.log_martians=1
      net.ipv4.icmp_echo_ignore_broadcasts=1
      net.ipv4.icmp_ignore_bogus_error_responses=1
      net.ipv4.tcp_syncookies=1

  # Fail2ban configuration
  - path: /etc/fail2ban/jail.local
    permissions: "0644"
    content: |
      [sshd]
      enabled = true
      port = 22
      banaction = iptables-multiport
      maxretry = 3
      bantime = 86400
      findtime = 600

  # Swap file for agent RAM spikes (critical!)
  - path: /etc/sysctl.d/99-swap.conf
    permissions: "0644"
    content: |
      vm.swappiness=10

runcmd:
  - sysctl --system

  # Create swap — agents WILL spike RAM
  - fallocate -l 8G /swapfile
  - chmod 600 /swapfile
  - mkswap /swapfile
  - swapon /swapfile
  - echo '/swapfile none swap sw 0 0' >> /etc/fstab

  # UFW firewall
  - ufw default deny incoming
  - ufw default allow outgoing
  - ufw allow ssh
  - ufw --force enable

  # Enable fail2ban
  - systemctl enable fail2ban
  - systemctl start fail2ban

  # Unattended security upgrades
  - dpkg-reconfigure -plow unattended-upgrades

  # SSH hardening
  - sed -i -e '/^\(#\|\)KbdInteractiveAuthentication/s/^.*$/KbdInteractiveAuthentication no/' /etc/ssh/sshd_config
  - sed -i -e '/^\(#\|\)ChallengeResponseAuthentication/s/^.*$/ChallengeResponseAuthentication no/' /etc/ssh/sshd_config
  - sed -i -e '/^\(#\|\)MaxAuthTries/s/^.*$/MaxAuthTries 2/' /etc/ssh/sshd_config
  - sed -i -e '/^\(#\|\)AllowTcpForwarding/s/^.*$/AllowTcpForwarding no/' /etc/ssh/sshd_config
  - sed -i -e '/^\(#\|\)X11Forwarding/s/^.*$/X11Forwarding no/' /etc/ssh/sshd_config
  - sed -i -e '/^\(#\|\)AllowAgentForwarding/s/^.*$/AllowAgentForwarding no/' /etc/ssh/sshd_config
  - sed -i '$a AllowUsers deploy' /etc/ssh/sshd_config

  - reboot

final_message: "The system is ready after $UPTIME seconds"
```

Notice the 8 GB swap file. This isn't optional — it's insurance against the [well-documented Claude Code memory leak bugs](https://github.com/anthropics/claude-code/issues/19045) that can spike RAM usage to 10x expected levels when subagents are involved. More on that shortly.

A quick note on Hetzner's firewall architecture: you can use the Cloud Firewall (edge-level, managed via Console/API) alongside UFW (host-level). I use both — the Cloud Firewall as a first line of defence, UFW as a safety net. Just be careful they don't conflict. And remember: your Cloud Firewall needs to allow ICMP if you want uptime monitoring tools like [HetrixTools](https://hetrixtools.com/) to work.

---

## Tailscale: the end of SSH key management headaches

I've been running [Tailscale](https://tailscale.com) on my home network for a while — Pi-holes, media servers, the usual — but using it for VPS access was a genuine quality-of-life improvement. The pitch is simple: Tailscale creates a WireGuard-encrypted mesh network between your devices. Once your Hetzner VPS joins the mesh, you can SSH to it using a stable Tailscale IP address, and — here's the good part — close port 22 to the public internet entirely.

### Installation on Hetzner

The [official Hetzner guide](https://tailscale.com/docs/install/cloud/hetzner) covers this well. The one-liner works:

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh
```

The `--ssh` flag enables [Tailscale SSH](https://tailscale.com/docs/features/tailscale-ssh), which handles authentication via your identity provider (Google, GitHub, Microsoft) instead of SSH key files. No more copying public keys around, no more `authorized_keys` maintenance, and instant revocation by updating your ACL policy. After setup, you can connect with `ssh deploy@your-machine-name` using MagicDNS hostnames.

For automated provisioning, add a [Tailscale auth key](https://tailscale.com/docs/how-to/quickstart) to your cloud-init:

```yaml
runcmd:
  - ['sh', '-c', 'curl -fsSL https://tailscale.com/install.sh | sh']
  - ['tailscale', 'up', '--auth-key=tskey-auth-xxxxx', '--ssh']
```

**Important sequencing**: install Tailscale and verify it works *before* restricting the firewall. Otherwise you'll lock yourself out (recoverable via Hetzner's VNC console, but annoying). Once Tailscale is confirmed working, lock down UFW to only allow SSH via the Tailscale interface:

```bash
sudo ufw delete allow 22/tcp
sudo ufw allow in on tailscale0 to any port 22 comment 'SSH via Tailscale only'
```

And update the Hetzner Cloud Firewall to allow only UDP 41641 inbound (WireGuard direct connections), removing the default SSH and ICMP rules.

### ACLs worth configuring

Tailscale ACLs are [deny-by-default, directional, and locally enforced](https://tailscale.com/docs/features/access-control/acls). For a VPS used as an agent machine, tag it and restrict access:

```jsonc
{
  "tagOwners": { "tag:agents": ["autogroup:admin"] },
  "acls": [
    { "action": "accept", "src": ["autogroup:admin"], "dst": ["tag:agents:*"] }
  ],
  "ssh": [
    {
      "action": "accept",
      "src": ["autogroup:admin"],
      "dst": ["tag:agents"],
      "users": ["deploy", "root"]
    }
  ]
}
```

If you have multiple Hetzner servers communicating via a private network, [subnet routing](https://tailscale.com/kb/1019/subnets) lets you expose that network to your tailnet without installing Tailscale on every server. And [exit nodes](https://tailscale.com/kb/1103/exit-nodes) can route all outbound traffic through the VPS — useful if you need a consistent IP.

---

## Cloudflare Tunnel: for anything that needs a public URL

Here's a question I see regularly: should you use Tailscale or Cloudflare Tunnel? The answer is both — they solve fundamentally different problems and coexist without conflict.

**Tailscale** operates at the network layer via WireGuard. It's for private access: SSH, internal tools, admin panels. End-to-end encrypted, no one in the middle.

**[Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/)** operates at the application layer as a reverse proxy through Cloudflare's edge network. It's for public-facing services: web apps, APIs, dashboards you want accessible from anywhere. Custom domains, DDoS protection, HTTP/3 — the works. The trade-off is that Cloudflare terminates TLS at their edge, so they can technically inspect your traffic (a consideration for some workloads, irrelevant for most).

They run simultaneously on the same machine with zero interference — `cloudflared` handles HTTP reverse proxying while Tailscale handles the WireGuard mesh. There's even a [Docker image that packages both](https://hub.docker.com/r/hhftechnology/cloudflare-tailscale-integration) into a single container, though I prefer running them as separate systemd services for clarity.

### Setting up cloudflared

The simplest approach is dashboard-managed tunnels. In the Cloudflare Zero Trust dashboard, go to Networks → Tunnels, create a tunnel, copy the token, and install:

```bash
# Add Cloudflare's APT repo (note: they rotated GPG keys recently)
sudo mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | \
  sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared noble main' | \
  sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt-get update && sudo apt-get install cloudflared

# Install as a service with the dashboard token
sudo cloudflared service install eyJhIjoiNGRl...
```

For wildcard domains (so every new service gets a subdomain automatically), add a public hostname for `*.yourdomain.com` pointing to `http://localhost:80` in the tunnel config. Then create a CNAME record in Cloudflare DNS: Name = `*`, Target = `<TUNNEL_ID>.cfargotunnel.com`, Proxy = enabled. Note that [free plan wildcard SSL only covers one subdomain level](https://developers.cloudflare.com/dns/manage-dns-records/reference/wildcard-dns-records/) — `app.example.com` works but `sub.app.example.com` needs a paid plan.

### Protecting dashboards with Cloudflare Access

If you're exposing a Coolify dashboard or any admin UI via the tunnel, you'll want [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/) in front of it. It acts as an identity-aware proxy — deny-by-default, evaluates every request against your policies before granting access. The built-in [One-Time PIN](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/) option sends a 10-minute OTP to approved email addresses and requires zero external configuration. GitHub OAuth is also straightforward.

Create the Access application *before* setting up the tunnel route — otherwise there's a brief window where the service is exposed without authentication.

### The SSL/TLS dance with Coolify

This trips up everyone at least once. There are two approaches:

The simple way: Cloudflare handles HTTPS externally, the tunnel routes HTTP to Coolify's Traefik on port 80. Set Cloudflare SSL to **Full** (not Flexible, not Full Strict). In Coolify, use `http://` prefixes for all domain settings. Using `https://` causes the dreaded `TOO_MANY_REDIRECTS` loop — ask me how I know.

The proper way: generate a [Cloudflare Origin Certificate](https://developers.cloudflare.com/ssl/origin-configuration/origin-ca/) (valid 15 years, covers wildcard), install it on the server, configure Traefik to use it, point the tunnel to HTTPS/443, and set SSL to **Full (Strict)**. This is necessary for apps that need end-to-end HTTPS for JWT tokens or OAuth callbacks. The [Coolify docs on full TLS setup](https://coolify.io/docs/integrations/cloudflare/tunnels/full-tls) walk through this in detail.

---

## The Coolify question: when does a PaaS earn its overhead?

[Coolify](https://coolify.io/) is an open-source, self-hosted PaaS — think Heroku or Netlify, but on your own infrastructure. It manages Docker containers, handles Git-based deployments, provides monitoring via Sentinel, and offers 280+ one-click services. I use the [cloud version](https://app.coolify.io) ($4/month base + $3 per managed machine) to avoid running the Coolify application itself on my production servers, but the self-hosted version installs with `curl -fsSL https://cdn.coollabs.io/coolify/install.sh | sudo bash`.

The question for agent workloads is whether that overhead is worth it.

### What Coolify costs you in resources

The platform itself — PHP application, PostgreSQL database, Traefik reverse proxy — consumes roughly 750 MB to 1.2 GB of RAM. On a 4 GB VPS, that's 25–30% of your available memory gone before you've started a single agent. On a 32 GB CCX33, it's about 3%. The practical minimum for Coolify plus agent work is 8 GB.

### When it earns its keep

Coolify makes sense when you're running multiple services alongside your agents — databases, Redis instances, monitoring dashboards, web apps in development. You get automated Git-based deployments, per-container resource limits (preventing a runaway agent from crashing the entire server), S3-compatible backups, health monitoring, and the ability to [offload builds to a separate server](https://coolify.io/docs/knowledge-base/server/build-server). The [native Cloudflare Tunnel integration](https://coolify.io/docs/integrations/cloudflare/tunnels/all-resource) and [Hetzner API integration](https://coolify.io) (create servers directly from the dashboard) are genuine time-savers.

### When it doesn't

For a single-purpose agent machine — just Claude Code in tmux sessions — Coolify adds complexity and RAM overhead without much benefit. Docker alone suffices. My recommendation: run Coolify on a small management VPS (CX23, €3.99/month) and have it manage separate compute servers via SSH. Best of both worlds.

One critical warning: versions before v4.0.0-beta.451 contain [multiple CVSS 10.0 vulnerabilities](https://wz-it.com/en/blog/coolify-cve-security-vulnerabilities-update-2025-2026/) enabling remote code execution as root. As of January 2026, over 52,000 Coolify instances were publicly accessible. Always keep Coolify updated and *always* put the dashboard behind Cloudflare Access.

---

## Claude Code resource requirements: the numbers nobody tells you

Here's where I have to be honest about something the marketing materials gloss over. Claude Code's resource requirements are modest in theory — the inference runs on Anthropic's servers, after all; your local process just handles context management and tool execution. But in practice, resource consumption is wildly unpredictable, and the parallel subagent story is — to put it diplomatically — a work in progress.

### A single instance

The [official minimum is 4 GB RAM](https://code.claude.com/docs/en/troubleshooting). The Linux OOM killer will terminate Claude Code below this threshold. A Hetzner CX23 (2 vCPUs, 4 GB, €3.99/month) technically works for a single instance doing light exploratory coding. But the moment Claude triggers a TypeScript compilation, a test suite, or a dev server, you'll want more headroom. Budget 8 GB realistically, plus swap.

### Parallel subagents: proceed with caution

This is where things get interesting — and by "interesting" I mean "I've watched my server run out of memory on a machine with 32 GB."

The theoretical guidance from [Jeffrey Emanuel's ACFS project](https://github.com/Dicklesworthstone/agentic_coding_flywheel_setup) suggests ~2 GB RAM per agent instance, with 48–64 GB for 10–20+ simultaneous agents. In practice, there's a [well-documented bug](https://x.com/Yampeleg/status/2000301662376808913) where RAM consumption on Linux explodes to 100+ GB when using subagents. Yam Peleg reported being unable to use parallel agents on a 256 GB machine. The root cause appears to be [orphaned subagent processes](https://github.com/anthropics/claude-code/issues/19045) that aren't cleaned up when the parent session ends — one user found 20+ orphaned processes consuming ~400 MB each after an hour of use. Multiple [memory leak reports](https://github.com/anthropics/claude-code/issues/20777) on GitHub confirm this is a widespread issue, with some users hitting [129 GB consumption](https://medium.com/@joe.njenga/claude-code-high-memory-usage-hits-crazy-129gb-ram-my-investigation-fixes-38bd44dfcfce).

Does this mean parallel agents are unusable? No. But it means you need to:

1. **Always add swap** — 8 GB minimum for multi-agent workloads.
2. **Monitor aggressively** — set up alerts for RAM usage exceeding 80%.
3. **Kill orphans** — run `pkill -f "claude.*--resume"` periodically or via a cron job to clean up leaked subagent processes.
4. **Budget double** the theoretical RAM requirement — plan for 4 GB per agent, not 2.
5. **Prefer worktrees over subagents** for true parallel work. Each [git worktree](https://code.claude.com/docs/en/common-workflows) gets its own Claude Code instance in a separate tmux pane, which gives you explicit control over lifecycle.

### What I'd actually buy

For a single developer running Claude Code seriously, here's how I'd think about machine selection:

A **CX23 or CAX11** (2 vCPUs, 4 GB, ~€4/month) handles a single Claude Code session for exploratory work. Fine for when you're prototyping or running Claude on a side project and don't want to think about it.

A **CPX32 or CAX21** (4 vCPUs, 8 GB, ~€8–14/month) is the sweet spot for a single Claude Code session with room for builds, test suites, and a dev server running simultaneously. This is what I'd recommend for most individual developers.

A **CCX33** (8 dedicated vCPUs, 32 GB, €62.49/month) handles 3–5 parallel agent sessions comfortably — with generous swap and periodic orphan cleanup. The dedicated vCPUs matter here because agent-triggered builds compete for CPU. This is my current recommendation for parallel workflow development.

A **dedicated AX42** (8C/16T, 64 GB DDR5, 2×512 GB NVMe, ~€57/month) is actually cheaper than the CCX33 and offers better sustained performance. The downside is longer provisioning time (hours, not minutes) and no API-driven scaling. If you're running agents most days, this is the better deal.

A **CCX43** (16 dedicated vCPUs, 64 GB, €124.99/month) or a server auction machine is what you'd want for running 5–10+ parallel agents or for [ACFS-style](https://agent-flywheel.com/) multi-agent orchestration setups.

---

## Running Claude Code headlessly: tmux, mosh, and the art of not losing your session

The standard workflow for running Claude Code on a remote VPS is SSH + tmux + API key authentication. Nothing exotic:

```bash
# Store your API key securely
echo 'export ANTHROPIC_API_KEY=sk-ant-api03-your-key' >> ~/.bashrc
source ~/.bashrc

# Create a persistent tmux session
tmux new-session -d -s claude
tmux send-keys -t claude 'claude' C-m

# Detach with Ctrl+B, D — reconnect later with:
tmux attach -t claude
```

For flaky connections (hotel wifi, trains, mobile hotspots), [mosh](https://mosh.org/) survives brief network drops far better than SSH:

```bash
sudo apt install mosh -y
sudo ufw allow 60000:61000/udp  # mosh port range
```

The `-p` flag runs Claude non-interactively for automation: `claude -p "Run the test suite and fix any failures"`. This pairs well with cron jobs or CI pipelines.

For `--dangerously-skip-permissions` mode — which bypasses all permission prompts — I cannot stress this enough: only use it in isolated environments. There are [documented incidents](https://github.com/anthropics/claude-code/issues/4850) of Claude executing destructive commands when unsupervised. The [Trail of Bits approach](https://github.com/trailofbits/claude-code-config) — combining `/sandbox` (bubblewrap on Linux) with deny rules in `settings.json` — is the responsible way to run agents with reduced friction. Their [devcontainer](https://github.com/trailofbits/claude-code-devcontainer) goes further, providing full filesystem isolation.

---

## Agent isolation: what actually works

If you're running agents with elevated permissions on a shared machine, isolation isn't optional. Here's what I've tested, in increasing order of security:

**Bubblewrap (bwrap)** — Claude Code's native `/sandbox` command uses this on Linux. It restricts filesystem writes to the current working directory and routes network traffic through an HTTP proxy with domain allowlists. Negligible overhead. Anthropic reports it reduces permission prompts by 84%. Use this as a minimum.

**Docker containers** — IBM Research confirmed Docker adds [0.1–2.67% CPU overhead](https://openillumi.com/en/en-docker-performance-cost-zero-kvm-compare/) on Linux, which is effectively nothing. Docker's newer [Sandboxes product](https://www.docker.com/blog/docker-sandboxes-run-claude-code-and-other-coding-agents-unsupervised-but-safely/) runs agents in dedicated microVMs with their own kernel — more secure but heavier.

**Trail of Bits' [devcontainer](https://github.com/trailofbits/claude-code-devcontainer)** — a sandboxed container specifically designed for running Claude Code in bypass mode safely. Includes filesystem isolation, process isolation, and an outbound firewall allowlist. This is what I'd recommend for production use.

**Disposable VPS instances** — Trail of Bits' [Dropkit](https://github.com/trailofbits/dropkit) manages DigitalOcean droplets as throwaway agent environments with Tailscale VPN integration. [ACFS](https://github.com/Dicklesworthstone/agentic_coding_flywheel_setup) (Jeffrey Emanuel's Agentic Coding Flywheel Setup) takes the opposite approach — maximum velocity on ephemeral instances, intentionally insecure for speed, designed to be destroyed after use.

---

## Automation scripts

Theory is nice. Here's the practical bit: scripts to automate the entire setup. I've gone with a combination of `hcloud` CLI for provisioning and bash for configuration, since this is a single-server setup where Ansible would be overkill. (If you're managing a fleet, absolutely reach for Ansible — the [hetzner.hcloud collection](https://docs.ansible.com/projects/ansible/latest/collections/hetzner/hcloud/server_module.html) is solid.)

### Provisioning with hcloud

```bash
#!/usr/bin/env bash
set -euo pipefail

# Prerequisites: brew install hcloud, then hcloud context create agent-infra

SERVER_NAME="agent-01"
SERVER_TYPE="ccx33"        # 8 dedicated vCPUs, 32 GB RAM
IMAGE="ubuntu-24.04"
LOCATION="fsn1"            # Falkenstein — cheapest EU region
SSH_KEY="deploy-key"       # Must exist in Hetzner: hcloud ssh-key create --name deploy-key --public-key-from-file ~/.ssh/id_ed25519.pub
FIREWALL="agent-firewall"  # Must exist — see below
CLOUD_INIT="cloud-init-agent.yaml"

# Create firewall if it doesn't exist
hcloud firewall describe "$FIREWALL" &>/dev/null || \
hcloud firewall create --name "$FIREWALL" \
  --rules-file <(cat <<'EOF'
[
  {"direction":"in","protocol":"tcp","port":"22","source_ips":["0.0.0.0/0","::/0"],"description":"SSH (temporary, remove after Tailscale)"},
  {"direction":"in","protocol":"udp","port":"41641","source_ips":["0.0.0.0/0","::/0"],"description":"Tailscale WireGuard"},
  {"direction":"in","protocol":"icmp","source_ips":["0.0.0.0/0","::/0"],"description":"ICMP for monitoring"}
]
EOF
)

# Create the server
hcloud server create \
  --name "$SERVER_NAME" \
  --type "$SERVER_TYPE" \
  --image "$IMAGE" \
  --location "$LOCATION" \
  --ssh-key "$SSH_KEY" \
  --firewall "$FIREWALL" \
  --user-data-from-file "$CLOUD_INIT"

echo "Server created. IP: $(hcloud server ip "$SERVER_NAME")"
echo "Wait ~2 minutes for cloud-init to complete, then:"
echo "  ssh deploy@$(hcloud server ip "$SERVER_NAME")"
```

### Post-provisioning setup script

Run this via SSH after cloud-init completes:

```bash
#!/usr/bin/env bash
set -euo pipefail

# --- Tailscale ---
echo ">>> Installing Tailscale..."
curl -fsSL https://tailscale.com/install.sh | sh
# Replace with your auth key from https://login.tailscale.com/admin/settings/keys
sudo tailscale up --auth-key="tskey-auth-XXXXX" --ssh --hostname="agent-01"

echo ">>> Tailscale installed. Verify with: tailscale status"
echo ">>> Once confirmed, remove SSH from Hetzner firewall and UFW."

# --- Cloudflare Tunnel (optional, for public services) ---
read -p "Install Cloudflare Tunnel? [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  sudo mkdir -p --mode=0755 /usr/share/keyrings
  curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | \
    sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
  echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared noble main' | \
    sudo tee /etc/apt/sources.list.d/cloudflared.list
  sudo apt-get update && sudo apt-get install cloudflared -y

  read -p "Enter your Cloudflare Tunnel token: " CF_TOKEN
  sudo cloudflared service install "$CF_TOKEN"
  echo ">>> Cloudflare Tunnel installed and running."
fi

# --- Claude Code ---
echo ">>> Installing Claude Code..."
curl -fsSL https://claude.ai/install.sh | sh

echo ">>> Installing Node.js 22 (required for Claude Code)..."
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# --- Ghostty terminal compatibility ---
# If you use Ghostty locally, run this from your local machine:
# infocmp -x | ssh deploy@<tailscale-ip> -- tic -x -

# --- Monitoring ---
echo ">>> Setting up basic monitoring..."
cat << 'CRON' | sudo tee /etc/cron.d/agent-cleanup
# Kill orphaned Claude Code subagents every 30 minutes
*/30 * * * * deploy pkill -f "claude.*--resume" 2>/dev/null || true

# Log RAM usage every 5 minutes
*/5 * * * * deploy echo "$(date -Iseconds) $(free -m | awk '/Mem:/ {printf "RAM: %d/%dMB (%.1f%%)", $3, $2, $3/$2*100}')" >> /var/log/agent-ram.log
CRON

echo ""
echo "=== Setup complete ==="
echo "Connect via Tailscale: ssh deploy@agent-01"
echo "Start Claude Code:     tmux new -s claude && claude"
echo ""
echo "Next steps:"
echo "  1. Verify Tailscale: tailscale status"
echo "  2. Lock down SSH:    sudo ufw delete allow 22/tcp"
echo "  3. Remove SSH from Hetzner Cloud Firewall"
echo "  4. Authenticate Claude Code: claude login"
```

### Coolify setup (if you want it)

If you're managing multiple services and want Coolify's orchestration:

```bash
#!/usr/bin/env bash
set -euo pipefail

# Install Coolify on the server
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | sudo bash

echo ">>> Coolify installed. Dashboard at http://$(curl -s ifconfig.me):8000"
echo ""
echo "IMPORTANT: Protect this with Cloudflare Access immediately!"
echo "  1. Add a tunnel route: coolify.yourdomain.com -> http://localhost:8000"
echo "  2. Create a Cloudflare Access application for coolify.yourdomain.com"
echo "  3. Then remove port 8000 from UFW"
echo ""
echo "Coolify Cloudflare Tunnel integration:"
echo "  - Use Coolify's 1-click cloudflared service, OR"
echo "  - See https://coolify.io/docs/integrations/cloudflare/tunnels/all-resource"
echo ""
echo "For SSL with Coolify behind Cloudflare Tunnel:"
echo "  - Set Cloudflare SSL to 'Full' (NOT Flexible)"
echo "  - Use http:// prefixes in Coolify domain settings"
echo "  - See https://coolify.io/docs/integrations/cloudflare/tunnels/full-tls"
```

---

## The comparison: bare Hetzner vs Coolify-managed for agent work

So which should you choose? It depends on what you're doing (I know, I know — the least satisfying answer in engineering, and yet always the correct one).

**Go bare metal** (just Tailscale + tmux + Claude Code) if your server's sole purpose is running AI coding agents. Skip Coolify, skip the PaaS overhead, and put every megabyte of RAM toward agent work. This is what [Jeff Triplett's "VibeOps" approach](https://micro.webology.dev/2025/08/06/vibeops-using-claude-code-on/) recommends — a cheap VPS as a disposable agent sandbox. Pair it with [Trail of Bits' sandboxing](https://github.com/trailofbits/claude-code-config) for safety.

**Go Coolify-managed** if you're also running web apps, databases, monitoring tools, or anything that benefits from container orchestration, automated deployments, and health monitoring. Coolify's ~1 GB overhead is negligible on a 32 GB machine, and the operational convenience — one-click deployments, backup scheduling, resource limits — adds genuine value. This is my current setup for servers that pull double duty.

**The hybrid** — Coolify on a small management VPS (€4/month), managing dedicated compute servers via SSH — is the best of both worlds but adds operational complexity.

Docker's CPU overhead is [negligible on Linux](https://openillumi.com/en/en-docker-performance-cost-zero-kvm-compare/) (0.1–2.67% in benchmarks from IBM Research), so running agents inside containers isn't a meaningful performance cost. It's a RAM question: can you spare the ~1 GB for Coolify's services?

---

## Wrapping up

The infrastructure for running AI coding agents on remote machines is surprisingly straightforward once you know the gotchas. Tailscale eliminates the SSH key management headache and lets you close public ports entirely. Cloudflare Tunnel handles anything that needs a public URL with proper DDoS protection. Hetzner provides the compute at a fraction of what you'd pay on AWS or GCP. And Coolify — if you need it — turns that raw VPS into a proper platform.

The one area where I'd urge genuine caution is parallel subagent resource planning. The memory bugs are real, they're well-documented, and they will catch you if you provision based on theoretical minimums. Budget double what you think you need, always configure swap, and monitor aggressively.

For most developers doing serious work with Claude Code, a CCX33 or a dedicated AX42 — hardened with the cloud-init config above, Tailscale for access, and bubblewrap sandboxing via `/sandbox` — is the setup I'd recommend. From zero to a working, hardened environment in under five minutes with the right automation.

If you try this setup and hit issues I haven't covered, I'd love to hear about it. And if you've found better approaches to the subagent memory problem, definitely let me know — my current "cron job that kills orphans every 30 minutes" solution feels decidedly inelegant.
