---
author: Pere Villega
pubDatetime: 2026-02-10
title: Give Claude in Chrome Your CLI Superpowers
draft: false
tags:
  - ai
  - tutorial
  - tools
description: "A TIL on using the --chrome flag with Claude Code CLI to enhance Claude in Chrome with custom skills, commands, and a tailored system prompt for more powerful browser automation."
---

A TIL regarding [Claude in Chrome](https://claude.com/chrome) and how to enhance its capabilities.

One of the limitations I found with the original [Claude Code in Web](https://claude.com/product/claude-code) was the lack of commands and agents. Granted, you could add some to the local `.claude` of the project, but that meant either losing access to your personal configuration, or having to duplicate that across projects, along with making other team members agree on what was useful to keep in there.

When I tested `Claude in Chrome`, I had the same feeling. Granted, it was a short test, and I didn't read the docs. But it felt 'useful but lacking some punch'.

Luckily, I've discovered the `--chrome` flag for `claude`, and this has opened a new box of tools for me.

First, ensure you have the following available:

- Claude Pro/Max subscription
- Claude in Chrome extension
- Claude Code CLI

Then try the following:

- Create a repository with a `.claude` folder and all relevant skills, agents, and commands for your use case
- Within that repository, run `claude --chrome`

This command will use an existing Chrome window and profile, and the Claude window it opens will have access to the commands and skills in the repository.

This is useful for two reasons:

First, the fact that it reuses an existing window, including the profile, means you can use it with profiles managed remotely that have access to restricted resources. This is handy for automation of tasks, or even just to avoid having to log into a service each time, as the session persists.

Second, it means that you can protect your context window by loading only those skills and tools relevant to the tasks you have in mind. Managing context is an important skill, and this helps.

As an extra tip, you can use other flags to, for example, tailor the system prompt of Claude:

```
claude --chrome --append-system-prompt "$(cat "specific-instructions.md")"
```

which helps even more with the aim of having a well-targeted set of tools and behaviour for some tasks.
