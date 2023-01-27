+++
title = "Automerge your Scala Steward pull-requests"
date = 2023-01-28

[taxonomies]

categories = ["scala"]
tags = ["scala", "sbt", "scala steward", "automerge"]
+++


If you code in Scala, it is likely that you use [Scala Steward](https://github.com/scala-steward-org/scala-steward) to keep your dependencies up-to-date. But merging all the pull-requests it generates is tiring. This blog post tries to solve that.

<!-- more -->

As a note, the following instructions only work if you store your codebase in Github. Which is a safe bet, nowadays. If you use Gitlab or another system, you need to adapt the instructions to your platform.

## Prerequisites

You need Administrator access to the repository. You need to tweak some settings in Github to allow for the automation,

An associated Github App, for your repository or organisation, must exist. To create one, follow steps 1 to 4 from [these instructions](https://github.com/marketplace/actions/scala-steward-github-action). You don't need to configure Scala Steward at this point. We provide the configuration required later on. But the secrets must exist in the repository.

Finally, you need an existing Github action that builds your project. This must be set up to build any pull-request created in the project. Without it, we can't know if a library upgrade breaks the codebase and if we can merge it.

## Repository Settings

To start with, we need to change some settings in the repository.

Go to `Settings` and, in the `General` tab, scroll down to he `Pull Request` section. Make sure to select both `Allow Auto-merge`, and `Automatically delete head branches`. If you see some options greyed out, that may be because you have an organisation that is using the free plan. In this case, you can't enable auto-merge until you upgrade to a paid plan, sorry.

In `Settings`, go to the `Branches` section and create a new `Branch protection rule`. Select your `main` branch as the target, or a branch where you usually merge your pull-requests. Then, select the following options:

- `Require a pull request before merging` and `Require approvals` (set to 1) . Also  `Dismiss stale pull requests approvals`

- `Require status checks to pass before merging`. In the search box, find the Github action that builds your project. Keep `Require branches to be up to date` disabled.

##

Workflows

Save the changes to your repository settings. Now you need to add the following three workflows to your repository. You can copy the contents into the indicated files.

File: `autoapprove.yaml`

```
name: Auto approve

on: pull_request

jobs:
  auto-approve:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
    if: startsWith(github.head_ref, 'update/')
    steps:
      - uses: hmarr/auto-approve-action@v3
```

File: `automerge.yml`

```
name: Auto-merge
on: pull_request

jobs:
  automerge:
    runs-on: ubuntu-latest
    if: startsWith(github.head_ref, 'update/')
    steps:
      - name: Generate token
        id: generate-token
        uses: tibdex/github-app-token@v1
        with:
          app_id: ${{ secrets.APP_ID }}
          private_key: ${{ secrets.APP_PRIVATE_KEY }}
      - uses: peter-evans/enable-pull-request-automerge@v2
        with:
          pull-request-number: ${{ github.event.pull_request.number }}
          merge-method: rebase
          token: ${{ steps.generate-token.outputs.token }}
```

File: `scala-steward.yml`

```
# This workflow will launch at 7:00 am (UTC) each night
on:
  schedule:
    - cron: '0 7 * * *'
  workflow_dispatch:

name: Scala Steward

jobs:
  scala-steward:
    runs-on: ubuntu-latest
    name: Launch Scala Steward
    steps:
      - name: Generate token
        id: generate-token
        uses: tibdex/github-app-token@v1
        with:
          app_id: ${{ secrets.APP_ID }}
          private_key: ${{ secrets.APP_PRIVATE_KEY }}
      - name: Launch Scala Steward
        uses: scala-steward-org/scala-steward-action@v2.28.0
        with:
          github-token: ${{ steps.generate-token.outputs.token }}
          author-name: scala-steward
          author-email: scala-steward@example.com
          other-args: '--add-labels'
```

Commit and push the files, and you are ready to test this.

Go to `Actions` in your repository, select `Scala Steward`, and click on `run workflow`. Run it against the `main` branch (or your corresponding branch). Once Scala Steward finishes, check your current pull-requests. You can open any new pull-request created, and see the build process and approvals. Once the build step finishes successfully, it will be merged. If a build fails, it will not be merged.

That's all for now, I hope this was informative and useful. As always, feedback via Mastodon/Email is more than welcome. Cheers!
