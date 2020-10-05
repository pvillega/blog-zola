+++
title = "Using a remote server to build your Scala projects"
date = 2020-05-09

[taxonomies]
categories = ["scala"]
tags = ["scala", "sbt", "vscode", "linode", "triplequote"]
+++

VS Code has released tooling [for remote development via ssh](https://code.visualstudio.com/docs/remote/ssh). In Scala the combo of [Metals](https://scalameta.org/metals/) and [VS Code](https://code.visualstudio.com/) for development has become the norm for many people. How easy and convenient may it be to use them while on ssh with a remote server? Let's discover it.

<!-- more -->

## Why would someone do that

First of all we should tackle an obvious question: why would a developer do that? The answer is that there are many valid scenarios for this approach:

- someone may work in a big corporation that gives lower-end Windows laptops, but has several servers available for developers to use
- someone may not have enough budget to replace their aging laptop, and it is looking at the cloud as a cheaper alternative
- an employer has Intellectual Property concerns and would like tight controls on where is the codebase cloned to
- a developer uses mainly a desktop and they don't want to buy a powerful laptop, but recently they need to travel more and still code
- a developer is fed up with seeing iStats show 90+ C degrees on the cpu sensor of their laptop, sustained while sbt compiles the project

Or, if none of them applies, just because we can. We'll talk about cost-effectiveness of this approach towards the end of the post.

## Setting up your environment

To make this work you will need:

- a local machine capable of running Visual Studio Code.
- a remote server, preferably with Linux (we use Ubuntu 20.04 LTS).
- to read and follow the steps in this post, adapting as needed if you use a different OS on your remote host.

The requirements for Visual Studio Code [are quite low](https://code.visualstudio.com/Docs/supporting/requirements), remember that the heavy lifting (compiling) won't be done in the local machine, so even old laptops should work fine.

Ideally you have some internet exposed desktop or server that you can use as the remote host. If you don't have any at hand, look at a VPS service like [Linode](https://www.linode.com) or [Hetzner](https://www.hetzner.com/). We'd recommend against AWS or GCP as they seem to be more expensive for worse performance. This post will use Linode, for no other reason that we used it in the past and we were happy with it. No affiliation with the brand.

Important note: if you are creating a new account in a VPS, expect to provide a valid credit card number to cover for the costs of any usage. There may also be a delay while they verify your account details; a new account via a UK-based Ltd company with Linode took 30m to be verified.

## Creating your remote developer instance

First of all, provision an instance for the server if you need it. We use `Linode Dedicated CPU` instances as they are supposed to have better CPU performance. You can follow [these steps](https://www.linode.com/docs/platform/dedicated-cpu/getting-started-with-dedicated-cpu/) to create one. We chose the following settings:

- OS: Ubuntu 20.04 LTS
- Region: London
- Plan: Dedicated 8 Gb (4 cores, 8 Gb RAM)
- Provide root password and ssh key for your local machine

Provisioning takes around one minute, and then you can ssh into the box with `ssh root@<ip>`.

Important note: on new accounts with Linode, you need to open a ticket with support to enable Dedicated 16 Gb and Dedicated 32 Gb Linode for your account. Otherwise you won't be allowed to create those instances. Other VPS may have similar rules.

Once the machine is up, ssh into it. The next step is to install a valid JDK. You can use [Adopt OpenJDK](https://medium.com/adoptopenjdk/adoptopenjdk-rpm-and-deb-files-7003ba38144e) by running the following:

```$bash
> wget -qO - https://adoptopenjdk.jfrog.io/adoptopenjdk/api/gpg/key/public | sudo apt-key add
> add-apt-repository --yes https://adoptopenjdk.jfrog.io/adoptopenjdk/deb/
> apt-get update
> apt-get install adoptopenjdk-11-hotspot
```

Then edit your `.profile` and add an export for `JAVA_HOME` to it:

```$bash
export JAVA_HOME='/usr/lib/jvm/adoptopenjdk-11-hotspot-amd64/'
```

We also want to increase the number of file descriptors available to avoid issues with VS Code and large projects. To that end, edit `/etc/sysctl.conf`
and add to the bottom of the file `fs.inotify.max_user_watches=524288` and run `sysctl -p` to reapply the changes.

We also want `sbt` and `npm` (for `scala.js`), which we can install as follows:

```$bash
> echo "deb https://dl.bintray.com/sbt/debian /" | sudo tee -a /etc/apt/sources.list.d/sbt.list
> apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 2EE0EA64E40A89B84B2DF73499E82A75642AC823
> apt-get update
> apt-get -y install sbt npm
```

To be able to work with Github, you will need to add the ssh public key of this instance to your profile. To generate a key, run:

```$bash
> ssh-keygen -t rsa -b 4096 -C "your_email@example.com"  # don't add a password
> cat ~/.ssh/id_rsa.pub
```

Copy the output of the last command and add it to your SSH key list in Github.

As the last step, clone the repository of `cats` so that we can run some tests on it later:

```$bash
git clone git@github.com:typelevel/cats.git
```

With these, your remote server should be ready to run scala code. As the next step, we need to connect a VS Code instance to it.

## Connecting Visual Studio Code

Open your VS Code and install the extension [Remote - SSH](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-ssh).
Then follow the [official documentation](https://code.visualstudio.com/docs/remote/ssh) to connect to the remote server:

- open the `Remote Explorer` menu and add your server
- once configured, you can `connect` to the server. This will open a new VS Code window. The bottom panel will show (on the left side) that you are connected to a remote server
- extensions are (usually) installed on the server, which means you will need to reinstall Metals. Open the `Extensions` panel, in there you will see that extensions are split between `local` and `ssh`. Scroll the `local` list and press the green `install in ssh` button for all those extensions you want to enable on your remote machine.
- if you haven't done so, search for `Metals` and install it. Then reload the window.
- Edit VS Code settings for Metals, on the `ssh` section for your remote machine set the proper path for `Java Home` in `Metals` (see previous section of this post for the path). This will require another reload of VS Code.

If you installed the `Live Share` extension, you may be prompted to install additional components, which requires yet another window refresh.

## Loading your project

Once the VS Code window has reloaded and reconnected to the server, you can just go to `File > Open` and select the `cats` project you cloned when setting up the server.
Metals will let you know that this is an `sbt` project and it will request to load it.

That's it. Once Metals completes the set up, you are ready to go and code as you are used to.

Important: Note that any `terminal` you open while in the `ssh` window will open directly in the remote server.

## Backing up your remote server

At this point you want to create an image of your server. Note that Linode (and most other platforms) will still charge you for the box if you stop it, as it is still provisioned for you.

To reduce costs what you want is to have an image with the latest changes to your server, which you can do [following these steps](https://www.linode.com/docs/platform/disk-images/linode-images/). Building the image took less than 2 minutes for our server. Once you have the image, you can delete your instance and create a new one when needed, using that image as a starting point. The image will keep the same ssh public key, which means you can interact with Github using your account without any additional steps.

Note that in Linode you have some restrictions on images but even so this should be enough for your purposes. Alternatively, you could use [Stack Scripts](https://www.linode.com/docs/platform/stackscripts/) or some other automated system to create images on demand.

## Performance

Now that we have everything set up, we need to verify how fast is this setup. How does it compare to running everything locally? To test this we downloaded [cats](https://github.com/typelevel/cats) and we run `;clean;test` in `sbt` a few times. The following is a completely non-scientific table of the measurements:

| Machine                         |Avg   |
| --------------------------------|-----:|
| Macbook 16" late 2019 (8 cores) |3:28  |
| Linode 4 cores                  |Error |
| Linode 8 cores                  |11:48 |
| Linode 16 cores                 |4:46  |

All Linode instances are 'Dedicated CPU' instances. On the 'Linode 4' instance,`sbt` was often killed by the OS when running alongside VS Code.

Let's be realistic, the performance is worse. The fastest Linode test, using the 16 cores machine, is over 1 minute slower than a test using a local environment. Unless you have a remote server you own and with a decent cpu, you are going to lose at least some performance. But it's not too terrible.

## Enter Hydra

Remember that we are trying to find a way to run compilation in remote servers for cases where a local setup is not an option. Maybe we can improve on it? [Triplequote](https://triplequote.com) offers `Hydra`, a parallel compiler for Scala. This would increase costs, but can this turn it into a viable alternative?

We followed the [instructions for a trial](https://docs.triplequote.com/trial/sbt/) with `Hydra` and we run the tests again in Linode. The trial license uses a `Developer (Enterprise)` license which can take advantage of up to 8 cores.

| Machine (with Hydra)            |Avg   |
| --------------------------------|-----:|
| Linode 8 cores                  |6:39  |
| Linode 16 cores                 |1:30  |

We can see Hydra makes a big difference as it is able to take advantage of the number of cores available. In the lower spec Linode we halve the compile time, while in the Linode with 16 cores we compile cats in a third of the time it originally took. The improvements would be similar in a local setup, but let's remember that we are looking at scenarios where you need (want) to use a remote setup.

## Cost of the setup

A MacBook Pro 16" 2019, with the maximum RAM (64 Gb) and CPU (8 core 2.4 Ghz) currently costs $3,799.00, taxes aside. Other non-Apple laptops and desktops will be cheaper, but I use this as a reference as it is the one many companies give to their developers, so it is a fair benchmark for comparison.

A Linode (Dedicated CPU) with 8 cores and 16 Gb RAM costs $0.18/hr. For a standard work schedule of 45h per week and 50 weeks per year (and you should really work less than that), it adds up to $8.1 per week, and $405 for the year. Assuming the same use pattern, a Linode with 16 cores and 32 Gb of RAM ($0.36/hr) costs twice as much: $16.2 per week, $910 per year.

A `Developer - Enterprise` license for `Hydra` costs $1,080/year per seat, to take advantage of up to 8 cores.

The slower Linode with 8 cores, with Hydra, would cost $1,485/year but it is twice as slow as the laptop we compare it with, which makes it a less appealing choice. Without Hydra the compilation times become too high to even consider it as an option.

But with the Linode 16 cores the story changes, as the performance is closer to what we get with a local machine. You could pay $910 for the Linode instance and get compile times around 30% slower, but at 25% of the cost of the laptop. Or, if you add Hydra and increase the cost to $1,990, you can be 60% faster than the laptop for around 50% of the price.

## Conclusions

Is it cloud computing ready to become your development server? As with most things in development, it depends. If you need to squeeze every bit of performance
from your machines, then a local setup is still preferred. And you should get a Hydra license, period.

But if not, you can get reasonable performance from dedicated machines. A Linode with 16 cores and without Hydra is a quarter of the price of a top of the shelf laptop,
and you still get reasonable performance. If you add Hydra on top, then we are looking at remote setups that outperform a local setup, while costing you less upfront. A hard-to-beat proposition.

There are multiple caveats, of course. For example, the SSH extension for Visual Studio Code is still on `preview` and there may be glitches. Also, things that are easily achieved with a local workflow may be slightly more complicated with a remote one.

But not many project will be as demanding as `cats` for compilation, due to its multiple compile targets. And there are other possible benefits, like being to replace docker services running locally by ones in remote servers, reducing pressure on the computer even more. Given that we would expect costs for
cloud computing to decrease as time goes by, this setup can only become better as time goes by. Yes, it is unlikely to beat a local setup on raw performance, but sometimes that is not the only constraint.

That's all for now, I hope this was informative and useful. As always, feedback via Twitter/Email is more than welcome. Cheers!
