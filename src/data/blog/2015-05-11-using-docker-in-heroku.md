---
author: Pere Villega
pubDatetime: 2015-05-11
title: Using Docker in Heroku
draft: false
tags:
  - scala
  - docker
  - devops
  - tutorial
description: "Heroku has announced beta support for Docker containers running in its platform. As I have some time in my hands, I've tried how well it integrates."
---


Heroku has announced [beta support](https://devcenter.heroku.com/articles/getting-started-with-scala-and-heroku-local-docker-development) for Docker containers running in its platform. As I have some time in my hands, I've tried how well it integrates.

<!-- more -->

**Updated 15/5/2015:** Michael Friss from Heroku sent me an email regarding the concerns I raised, update at the end with his comments.

I have a confession to make before I start: I was a Heroku convert that left the flock but is heading back to it. Years ago, when Heroku added support for Play apps, I made the same mistake as many developers before: I built my own (crappy) blog engine. I don't know if the code is still around but for the sake of my employability I won't surface any link to it ;)

At that time Heroku was very convenient, albeit expensive: $37/month for a personal blog with dozens of visits per month... not a sound idea. I ended up looking for alternatives and realised the obvious: AWS, Linode and others were way cheaper and provided much more power. So I moved away.

Recently I've come full cycle. A couple of weeks ago, at a HackTheTower event organised by [John Stevenson](https://twitter.com/jr0cket), who's a Heroku evangelist, I asked him why should I use Heroku as it is quite pricey. His answer: you pay for a 3rd party DevOps team. Obvious an answer as it is, the experience acquired between the time I used Heroku and now made me realise how valuable that is if you are building a serious app.

With the advent of Docker I went ballistic trying to run things in my computer, even trying to migrate some components at Gumtree. Shiny new thing and all that. The outcome wasn't one I enjoyed: lots of issues and nothing fully working, plus the realisation that I'm a horrible sysadmin and, although I enjoy the theory of putting servers together, I'd rather focus on developing the app and let someone else manage all the other stuff.

So if I ever build a sizeable app I'd go back to Heroku . With that in my mind the announcement of Docker for Heroku really picked my interest. Thus, this post.

Ok, boring interlude is over, let's hack!

## Set up

The instructions to use [docker in Heroku](https://devcenter.heroku.com/articles/getting-started-with-scala-and-heroku-local-docker-development) are missing some crucial info: you need to install both Docker and a specific plugin in your machine.

I'm using Linux Mint, based on Ubuntu. Installing Docker [seems easy](https://docs.docker.com/installation/ubuntulinux/) until you hit this error when trying to run it:

```bash
FATA[0000] Get http:///var/run/docker.sock/v1.17/version: dial unix /var/run/docker.sock:
no such file or directory.
Are you trying to connect to a TLS-enabled daemon without TLS?
```

As always, StackOverflow to the rescue. The [first answer](http://stackoverflow.com/questions/29294286/fata0000-get-http-var-run-docker-sock-v1-17-version-dial-unix-var-run-doc) fixed the issue for me. If you see the same error and you are not using Ubuntu or a derivative Google the error, there's a lot of information about it. Such a common error and no steps to avoid it in the installation document... *ouch*

You can find how to install the plugin for Heroku [here](https://devcenter.heroku.com/articles/introduction-local-development-with-docker?preview=1). Run the following to ensure all is working as expected:

```bash
$ heroku help docker
Usage: heroku docker
  Use Docker to build and deploy Heroku apps
[...]
```

## Running the app

With Docker and the plugin working, just follow [the steps](https://devcenter.heroku.com/articles/getting-started-with-scala-and-heroku-local-docker-development). A quick summary of the relevant commands follows:

```bash
$ git clone https://github.com/heroku/scala-getting-started.git
$ cd scala-getting-started
$ sbt stage                 # let's build the code
$ heroku docker:init        # create dockerfile
$ heroku docker:start       # run the app. You may or may not need sudo for this
```

This will generate a local [Dockerfile](http://docs.docker.com/reference/builder/) and run the app. The Dockerfile generated is:

```bash
FROM heroku/cedar:14

RUN useradd -d /app -m app
USER app
WORKDIR /app

ENV HOME /app
ENV PATH /app/heroku/jdk/bin:$PATH
ENV PORT 3000

RUN mkdir -p /app/heroku/jdk
RUN mkdir -p /app/.profile.d
RUN curl -s http://lang-jvm.s3.amazonaws.com/jdk/openjdk1.8.0_40-cedar14.tar.gz | tar xz -C /app/heroku/jdk
RUN echo "export JAVA_HOME=\"/app/heroku/jdk" > /app/.profile.d/jdk.sh
RUN echo "export PATH=\"/app/heroku/jdk/bin:\$PATH" >> /app/.profile.d/jdk.sh

ONBUILD COPY target /app/target

ONBUILD USER root
ONBUILD RUN chown -R app /app/target
ONBUILD USER app

ONBUILD EXPOSE 3000
```

Most of the file is just setting the environment: open ports, install JDK, etc. The relevant part is the series of *ONBUILD* actions at the end. They are the ones copying the contents of our *target* folder as the app to run and exposing the port used to connect to it. But the fact they are *ONBUILD* means this image will be extended by another Dockerfile, as otherwise they would not be executed.

And, indeed, if you look at the output of *docker:start*:

```bash
Step 16 : ONBUILD expose 3000
 ---> Running in b6ff244c054f
 ---> 81c9310081ff
Removing intermediate container b6ff244c054f
Successfully built 81c9310081ff
building image...
Sending build context to Docker daemon 21.44 MB
Sending build context to Docker daemon
Step 0 : FROM heroku-docker-ef389ffce157641fd8a8a903641ab592
# Executing 5 build triggers
Trigger 0, COPY target /app/target
Step 0 : COPY target /app/target
Trigger 1, USER root
Step 0 : USER root
 ---> Running in 783a26569081
Trigger 2, RUN chown -R app /app/target
Step 0 : RUN chown -R app /app/target
 ---> Running in 0cc41d250626
Trigger 3, USER app
Step 0 : USER app
 ---> Running in cad1a44eaeac
Trigger 4, EXPOSE 3000
Step 0 : EXPOSE 3000
 ---> Running in c816b4ac395a
 ---> ca0051ac830e
```

Did you notice that `FROM heroku-docker-ef389ffce157641fd8a8a903641ab592`? A bit of magic in here, but we will allow it as it is the point of Heroku: devops as a  black box. In any case, time to go to production:

```bash
$ heroku create
$ heroku docker:release
$ heroku open
```

A new image is built (you can see the triggers being actioned again) and the locally generated slug is uploaded to Heroku, a total of 63MB of a maximum allowed of 300Mb. The app works as expected, all good. A very similar experience to what you expect with the standard Heroku process.


## Concerns

Using Docker within Heroku makes me uneasy. I like Docker, but I see this integration as trying to marry two contradicting approaches. Docker requires you to know what are you doing, you can hack it blissfully ignorant but then it hits back with a dose of reality and a pile of errors. Heroku, on the other hand, is a fire-and-forget heaven for developers: care about the services, not about how are they being run.

Arguably the tools Heroku provides hide this pain as the Dockerfile is built for you and it is a very basic Dockerfile. But then, is it necessary? And is it a complete abstraction?

Every time I built my app for either local or remote deployment, the build process happened locally in my machine. The issue here is that the base image (the Dockerfile generated) is not rebuild, there is no need as the key steps are triggers (ONBUILD) that will be run later.

Now, I may be missing something obvious as I'm not an expert, but as far as I understand this means that if the *cedar-14* base image contains a component with a serious vulnerability, unless I wipe all the local caches from my system (for both *cedar-14* and my app) my built slug will contain that vulnerability. Obviously I don't know which magic happens inside the Dockerfile used by Heroku that extends mine, but that doesn't ease my concerns at all.

It seems by trying to adopt a new technology now the developer needs to worry a bit more about sysadmin things. And also, not critical but still relevant, we need to upload the locally-built slug to the system. This can be up to 300Mb, which kind of defeats the speed increase of doing the build process in your beefy machine. Asymmetric connections are still the norm, unfortunately.

So, I get why is Heroku trying to do this, but I'm not sure it has any real benefit as unfortunately not all developers may realise some implications. Or maybe that's the point: get people on-board via Docker and then show them a simpler and maybe safer way, the old and tested one.

**UPDATE:** As I mentioned above, I received an email from Michael Friss (from Heroku) about the concerns I had. I feel they address the issues and it is fair to mention it:

>You stack concerns are valid and interesting, so I want to address them in detail.

>`heroku docker:release` does not (currently) release the entire heroku/cedar:14 that you created locally. It only extracts the `/app` contents and packages that into a slug (containing a JVM, your packages and your app) that's released to Heroku. That's deployed to the same Heroku runtime stack as slugs from normal buildpacks, and we keep that patched and updated. We also keep the `heroku/cedar:14` image updated on Docker-hub for you to pull.

>As we make progress on the Docker-stuff, and if it graduates out of beta, we'll build supported and hands-off flows similar to how the Heroku-supported buildpacks work. (We'll probably also rely more on Buildpacks to make the Docker-flow work. Check out how Python works right now: https://github.com/heroku/heroku-docker/blob/master/platforms/python/Dockerfile.t#L31

>You're correct that there's ALSO an option to break out of the supported flow and tweak the Dockerfile. This has roughly the same semantics as forking a Heroku buildpack or creating a buildpack from scratch. Something that 1000s of Heroku users do.


That's all. As always, feedback via Twitter/Email is more than welcome. Cheers!
