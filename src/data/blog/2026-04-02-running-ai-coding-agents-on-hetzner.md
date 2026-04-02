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
  - claude-code
  - devops
description: "A complete guide to provisioning and hardening a Hetzner VPS for AI coding agents — covering cloud-init security, Tailscale mesh networking, Cloudflare Tunnel, Claude Code resource planning (including the subagent memory pitfalls), and automation scripts to go from zero to a working environment in minutes."
series: "ai-developer-evolution"
seriesOrder: 1
seriesSection: "appendices"
---

Everyone, myself included, recommends that people run agents in sandboxed environments. This is all good and well, except the way people sandbox their environments is, often, a docker container that has a volume mounted, where the default permissions enable agents to access the host. There is no issue, until the issue happens and you need to test how well your backups work. I hope you trust them.

The solution is straightforward: use a remote machine for development. This is even more relevant nowadays, where Claude's `remote` and `dispatch` extensions mean you may want your box reachable online, so that you can unblock your agents when not in front of your daily machine.

So I built a remote box for myself, and I wrote down what I learned. This post covers the full stack: provisioning and hardening a Hetzner VPS, securing it with Tailscale and Cloudflare Tunnel, and figuring out which machines actually work for running Claude Code with multiple parallel subagents. I've included automation scripts so you can reproduce the setup without the trial-and-error phase I went through.

Fair warning: this is a long one. Grab a coffee.

## Why Hetzner?

If you've been running AI coding agents on your laptop, you've probably noticed the limitations. Your machine gets hot, battery life tanks, and if you're running multiple agents in parallel via [worktrees](https://code.claude.com/docs/en/common-workflows) everything else grinds to a halt. Compiling 4 copies of your app at once can have that effect, indeed.

The obvious solution is to offload this to a remote server. And if you're in Europe (or don't mind your agent traffic crossing the Atlantic), [Hetzner](https://www.hetzner.com) remains the best price-to-performance ratio in the VPS market by a comfortable margin, being typically 30–50% cheaper than DigitalOcean or Linode for equivalent specs.


Even though Hetzner [raised prices 30–37% effective April 2026](https://www.tomshardware.com/tech-industry/hetzner-to-raise-prices-by-up-to-37-percent-from-april-1), citing a 171% year-over-year increase in DRAM costs, they're still the value leader.

### The machine types that matter for agent workloads

Hetzner offers four cloud VPS lines, plus dedicated servers. For AI coding agents, the distinctions matter more than they do for typical web hosting.

The **CX series** (shared Intel/AMD, EU-only) starts at €4.49/month for 2 vCPUs and 4 GB RAM. These are fine for a single Claude Code instance doing light work. Think exploratory coding, not running test suites. The CX43 (8 vCPUs, 16 GB, €12.49/month) is where things start getting useful for agent work, and the CX53 tops out at 16 vCPUs and 32 GB for €22.99/month.

The **CAX series** (ARM Ampere Altra, EU-only) deserves special mention. Claude Code is Node.js-based and runs natively on ARM64, so the CAX line is an option. The surprise is that, at least since the price upgrade, the ARM64 machines are more expensive than the Intel ones. The CAX41, equivalent of the aforementioned CX53, costs an additional €9/month. Added to the fact that many docker images are still built for x64 compatible architectures, there is little reason to choose ARM64, for now.

The **CPX series** (AMD EPYC, available globally including the US) runs €5.99–€71.49/month in EU regions. They are more performant, CPU wise, but the price of the bigger instances may be twice as much as the price of the CX series. Unless compile times are a bottleneck, I'd stick with CX.

The **CCX series** (dedicated AMD EPYC vCPUs) eliminates the noisy-neighbour problem that plagues shared instances, and for agent workloads that spike CPU during builds and test runs, this consistency matters. They are performant, but they are also expensive. The sweet spots are the CCX33 (8 dedicated vCPUs, 32 GB, €62.99/month) and CCX43 (16 dedicated vCPUs, 64 GB, €125.49/month), but that is easily three times the price of a similar CX instance. It may be justified if you make extensive use of the instance with multiple agents working in parallel, as unlike the CPX series these are dedicated machines. But I wouldn't start here.

And then there are **dedicated servers**, which flip the economics entirely. The [AX42](https://www.hetzner.com/pressroom/new-ax42/) — an AMD Ryzen 7 PRO 8700GE with 8 cores/16 threads, 64 GB DDR5 ECC, and 2×512 GB NVMe — costs roughly €54/month after the April increase. That's less than a CCX33 cloud instance with significantly better sustained performance. The [Hetzner Server Auction](https://www.hetzner.com/sb) offers refurbished machines starting around €30–50/month with no setup fees (track deals at [radar.iodev.org](https://radar.iodev.org/)). If you're running agents for more than a few hours a day, dedicated servers are almost certainly the better deal.

One Hetzner-specific detail that's bitten me: a primary IPv4 address costs +€0.50/month. IPv6 is free, but many services and library repositories (including some that Claude Code might interact with via `web_fetch`) don't handle IPv6 properly. Budget for the IPv4.

## Hardening the server

Security on a VPS isn't optional, especially when you're running AI agents that can execute arbitrary shell commands. The goal is defence in depth: SSH key-only authentication, a non-root user, UFW firewall, fail2ban for brute-force protection, and unattended-upgrades for automatic patching. Once Tailscale is set up (next section), we can close the public SSH port entirely.

Hetzner's Cloud Console accepts [cloud-init](https://cloudinit.readthedocs.io/) YAML during server creation. This is where I do the bulk of the hardening as everything runs before I ever SSH in. Here's a production ready config, evolved over several iterations (the [Hetzner community tutorial](https://community.hetzner.com/tutorials/basic-cloud-config/) was the starting point):

```yaml
#cloud-config
users:
  - name: <username>
    groups: users, admin, docker
    sudo: ALL=(ALL) NOPASSWD:ALL
    shell: /bin/bash
    ssh_authorized_keys:
      - <YOUR_SSH_PUBLIC_KEY>

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
You can adjust it as needed, Claude is **very** good at infrastructure work and can tailor it and provide suggestions, like new options not available at the time of this writing.

Notice the 8 GB swap file. This isn't optional, it's insurance against the Claude Code memory leak bugs that can spike RAM usage to 10x expected levels when subagents are involved. Better safe than sorry with an undesired OOM.


A quick note on Hetzner's firewall architecture: you can use the Cloud Firewall (edge-level, managed via Console/API) alongside UFW (host-level). I use both. The Cloud Firewall acts as a first line of defence, UFW acts as a safety net. Redundant, but safer in case of accidental misconfigurations. Just be careful they don't conflict. And remember: your Cloud Firewall needs to allow ICMP if you want uptime monitoring tools like [HetrixTools](https://hetrixtools.com/) to work.

## Tailscale

I've been running [Tailscale](https://tailscale.com) on my home network for a while for the usual suspects like Pi-holes, media servers, etc. But using it for VPS access was a genuine quality-of-life improvement. The pitch is simple: Tailscale creates a WireGuard-encrypted mesh network between your devices. Once your Hetzner VPS joins the mesh, you can SSH to it using a stable Tailscale IP address, and (here's the good part) close port 22 to the public internet entirely.

If you are scared about getting locked out of the machine, that's not an issue. Hetzner provides console access via web, and you can always enable backups and restore from a recent one. Worst case scenario, this is a machine that you can easily rebuild with the help in this post, but that is unlikely to happen.

### Installation on Hetzner

The [official Hetzner guide](https://tailscale.com/docs/install/cloud/hetzner) covers this well. The one-liner works:

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh
```

The `--ssh` flag enables [Tailscale SSH](https://tailscale.com/docs/features/tailscale-ssh), which handles authentication via your identity provider instead of SSH key files. No more copying public keys around, no more `authorized_keys` maintenance, and instant revocation by updating your ACL policy. After setup, you can connect with `ssh deploy@your-machine-name` using MagicDNS hostnames.

For automated provisioning, add a [Tailscale auth key](https://tailscale.com/docs/features/access-control/auth-keys) to your cloud-init:

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

And update the Hetzner Cloud Firewall to allow only UDP 41641 inbound (WireGuard direct connections), removing the default SSH rules. Remember to allow ICMP if you need uptime monitoring, remove it otherwise.

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
      "users": ["<your username>", "root"]
    }
  ]
}
```

If you have multiple Hetzner servers communicating via a private network, [subnet routing](https://tailscale.com/kb/1019/subnets) lets you expose that network to your tailnet without installing Tailscale on every server. I wouldn't suggest that in a standard setup, as it can exfiltrate data and we want the agent server as isolated as possible. But there may be scenarios, like when you want to have a separate box with a local Kubernetes deployment for end-to-end testing that the agent can reach, where this is good to know.

If you need to access white-listed services for your development tasks and you need a consistent IP, for example if your enterprise Github account restricts IPs that can connect to its repositories, [exit nodes](https://tailscale.com/kb/1103/exit-nodes) can route all outbound traffic through the VPS.

## Cloudflare Tunnel

Here's a question I see regularly: should you use Tailscale or Cloudflare Tunnel? The answer is both, they solve fundamentally different problems and coexist without conflict.

**Tailscale** operates at the network layer via WireGuard. It's for private access: SSH, internal tools, admin panels. End-to-end encrypted, no one in the middle.

**[Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/)** operates at the application layer as a reverse proxy through Cloudflare's edge network. It's for public-facing services: web apps, APIs, dashboards you want accessible from anywhere. Custom domains, DDoS protection, HTTP/3, etc. The trade-off is that Cloudflare terminates TLS at their edge, so they can technically inspect your traffic (a consideration for some workloads, irrelevant for most).

They run simultaneously on the same machine with zero interference. The `cloudflared` service handles HTTP reverse proxying while Tailscale handles the WireGuard mesh. There's even a [Docker image that packages both](https://hub.docker.com/r/hhftechnology/cloudflare-tailscale-integration) into a single container, though I prefer running them as separate systemd services for clarity.

Granted, you can also use Cloudflare tunnel for SSH access, so if you want some simplicity, you could just set up Cloudflare and be done. But I prefer this separation, and the Tailscale experience is great: I can access a remote device from my phone, without fiddling with SSH keys or proxy commands.

### Setting up cloudflared

The simplest approach is dashboard-managed tunnels. In the Cloudflare Zero Trust dashboard, go to Networks → Tunnels, create a tunnel, copy the token, and install Cloudflare (the page shows you the instructions by OS):

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

If you're exposing any admin UI via the tunnel, you'll want [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/) in front of it. It acts as an identity-aware proxy — deny-by-default, evaluates every request against your policies before granting access. The built-in [One-Time PIN](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/) option sends a 10-minute OTP to approved email addresses and requires zero external configuration. GitHub OAuth is also straightforward.

Create the Access application *before* setting up the tunnel route, otherwise there's a brief window where the service is exposed without authentication.

## Claude Code resource requirements

Claude Code's resource requirements are modest in theory, as the inference runs on Anthropic's servers, after all; your local process just handles context management and tool execution. But in practice, resource consumption is wildly unpredictable, and the parallel subagent story is — to put it diplomatically — a work in progress.

### A single instance

The [official minimum is 4 GB RAM](https://code.claude.com/docs/en/troubleshooting). The Linux OOM killer will terminate Claude Code below this threshold. A Hetzner CX23 (2 vCPUs, 4 GB, €4.49/month) technically works for a single instance doing light exploratory coding. But the moment Claude triggers a TypeScript compilation, a test suite, or a dev server, you'll want more headroom. Budget 8 GB realistically, plus swap.

### Parallel subagents

This is where things get interesting, and by "interesting" I mean "I've watched my server run out of memory on a machine with 32 GB."

The theoretical guidance from [Jeffrey Emanuel's ACFS project](https://github.com/Dicklesworthstone/agentic_coding_flywheel_setup) suggests ~2 GB RAM per agent instance, with 48–64 GB for 10–20+ simultaneous agents. In practice, agents will trigger compilation and test runs, on top of any other tool use Claude invokes. Of course, not all agents will be compiling at the same time, there is a lot of waiting time while we send requests to Anthropic and receive and process the responses. Although it doesn't happen often, I've had terminal instances crash due to the OOM killer triggering in machines with less RAM, so favour servers with as much RAM as possible. CPU is less of an issue, as most of the work will be I/O with the model. Note that this works the same with subagents or with worktrees, you will have the same memory pressure the more you spin up.

This means you should:

1. **Always add swap** — 8 GB minimum for multi-agent workloads.
2. **Monitor aggressively** — set up alerts for RAM usage exceeding 90%.
3. **Kill orphans** — run `pkill -f "claude.*--resume"` periodically or via a cron job to clean up leaked subagent processes.
4. **Budget double** the theoretical RAM requirement, or as much as feasible. Plan for 4 GB per agent, not 2.

### What I'd actually buy

For a single developer running Claude Code seriously, here's how I'd think about machine selection:

A **CX23** (2 vCPUs, 4 GB, ~€5/month) handles a single Claude Code session for exploratory work. Fine for when you're prototyping or running Claude on a side project and don't want to think about it. Serial subagents, no parallel work.

A **CPX32 or CX33** (4 vCPUs, 8 GB, ~€7–14/month) is the sweet spot for a single Claude Code session with room for builds, test suites, some parallel work, and a dev server running simultaneously. This is what I'd recommend for most individual developers.

A **CCX33** (8 dedicated vCPUs, 32 GB, €62.99/month) handles several parallel agent sessions comfortably. The dedicated vCPUs matter here because agent-triggered builds compete for CPU. This is my current recommendation for parallel workflow development, with multiple projects at once where each project may be handling a few tasks at a time.

A **dedicated AX42** (8C/16T, 64 GB DDR5, 2×512 GB NVMe, ~€57/month) is actually cheaper than the CCX33 and offers better sustained performance. The downside is longer provisioning time (hours, not minutes) along a one-time fee for installation. If you're running agents most days, this is the better deal, but I'd test a **CCX33** first before making the commitment, due to the installation fees.

## Running Claude Code

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

If you use a Claude.ai subscription, you can log in to Claude the first time you start the agent in the server. You will need a browser available to complete the process.

Usually in here one would see the comments about being careful if you use `--dangerously-skip-permissions` mode, but the point of this article is to configure an isolated environment. So that's ok. Of course, be careful with which API keys and data you give access to, use narrowly scoped keys with access only to local and development environments, and mock data, to be safe. But you don't risk wiping your work machine by mistake.


## Automation scripts

Theory is nice. Here's the practical bit: scripts to automate the entire setup. I've gone with a combination of [hcloud](https://github.com/hetznercloud/cli) CLI for provisioning and bash for configuration, since this is a single-server setup where Ansible would be overkill. (If you're managing a fleet, absolutely reach for Ansible, the [hetzner.hcloud collection](https://docs.ansible.com/projects/ansible/latest/collections/hetzner/hcloud/server_module.html) is solid.)

### Provisioning with hcloud

```bash
#!/usr/bin/env bash
set -euo pipefail

# Prerequisites: brew install hcloud, then hcloud context create agent-infra

SERVER_NAME="agent-01"
SERVER_TYPE="ccx33"        # 8 dedicated vCPUs, 32 GB RAM
IMAGE="ubuntu-24.04"
LOCATION="fsn1"            # Falkenstein
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

## Wrapping up

The infrastructure for running AI coding agents on remote machines is surprisingly straightforward once you know the gotchas. Tailscale eliminates the SSH key management headache and lets you close public ports entirely. Cloudflare Tunnel handles anything that needs a public URL with proper DDoS protection. Hetzner provides the compute at a fraction of what you'd pay on AWS or GCP.

The one area where I'd urge genuine caution is parallel subagent resource planning. For most developers doing serious work with Claude Code, a CCX33 or a dedicated AX42, hardened with the cloud-init config above, and Tailscale for access is the setup I'd recommend. From zero to a working, hardened environment in under five minutes with the right automation.
