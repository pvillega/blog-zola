---
author: Pere Villega
pubDatetime: 2019-02-05
title: Playing with Rust
draft: false
tags:
  - rust
  - twitter
description: "Rust is not, at this stage, a new language. But I have to confess that I had not checked it out until now. I built a small tool to test it out. In this post I'll briefly talk about how it felt work..."
---


[Rust](https://www.rust-lang.org) is not, at this stage, a new language. But I have to confess that I had not checked it out until now. I built a [small tool](https://crates.io/crates/twitter_privacy) to test it out. In this post I'll briefly talk about how it felt working with Rust from the point of view of a Scala developer.

<!-- more -->

During the last [Scala Exchange](https://skillsmatter.com/conferences/10488-scala-exchange-2018) I heard a lot of people talking about Rust. As a consequence, learning more about the language became a higher priority, as it is always good to listen to people with more experience :). It was also an excuse to use [Visual Studio Code](https://code.visualstudio.com) a bit more, to familiarise with its bindings so I can get the most out of [Metals](https://github.com/scalameta/metals).

The best way to learn a new language is to build something with it, as that is the scenario when you hit all the common problems. What I wanted to avoid is to fight not only Rust but also some web framework or library on top of it. Time ago I built a tool to delete old tweets from my account, using Scala: [twitter privacy](https://github.com/pvillega/twitter-privacy). It works well, but the nature of the program (running in a cron job once a day) makes it much slower than it should be, due to cold-start time of the JVM.

Rust is known as a fast language, and a replacement of this tool using Rust seemed like a good fit for learning the language without having too many libraries involved. You can find the source code of the outcome  [in github](https://github.com/pvillega/twitter_privacy), and it has been published [to cargo.io](https://crates.io/crates/twitter_privacy).

If you want to use it for your own social media maintenance, instructions on how to run it are in the [Readme file](https://github.com/pvillega/twitter_privacy/blob/master/Readme.md) in Github.

## Rust as a language

As a Scala developer, I found Rust a very interesting language. For example, I've heard very often criticism towards the duality OO-FP of Scala,
pointing it was a bad decision. Rust clearly states in [their book](https://doc.rust-lang.org/stable/book/) that they support both, having a chapter dedicated
to each one, and on how to work in that particular way with the language.

Rust has a very active community and very good documentation for their tooling and libraries. For example, check the documentation for [Cargo]( https://doc.rust-lang.org/cargo/), it's build tool. Or for one of the libraries I used, [Egg_Mode](https://tonberry.quietmisdreavus.net/doc/egg_mode/index.html).

The community is actively trying to exploit the advantages of Rust (speed, memory management). There's a lot of work to build libraries using Rust in domains like [game development](http://arewegameyet.com), [machine learning](https://www.arewelearningyet.com), or [web development](https://www.arewewebyet.org).

A key area for Rust growth may be [WebAssembly](https://webassembly.org), a binary format enabling deployment on the web for client and server applications. Rust already compiles to it and has good tolling and  [documentation](https://rustwasm.github.io/book/introduction.html). This could enable a real 'build once and deploy anywhere' development mode, without the issues caused by nuances of different platforms.

In general working with it felt familiar and there weren't many unexpected surprises. The following comments come from someone which has been working extensively in the JVM world, with some non-professional experience in non-JVM languages.

## The Good

I liked the language and I felt comfortable with it, but there are some things worth of mention:

* Speed. It's been so many years using Scala that I forgot how fast can a CPU. Both compilation and execution are *fast*, and help with keeping the development flow. No time for a small break on Twitter, or similar.

* Typeclasses (using Traits). I got too used to Typeclasses and it would be hard to move to a language without them. The restriction on implementing instances of a Typeclass which doesn't belong to your package have been a bit of a nuisance at some stages, but I understand the motivation behind that call, and it's not a deal breaker.

* Cargo. It's what `sbt` should be. The only tool you need as a developer to compile, test, benchmark, or publish to a central repository. Which, by the way, is a trivial to do (compared to the nightmare of publishing to Sonatype).

* Local documentation. The fact that you can, with a single cargo command, open the documentation of your dependencies for the specific version you are using is a life-saver. In this particular project the library that interacts with Twitter has changed a lot between the last published version and the current version under development, thus going to the online documentation could be very confusing.

## The Less Good

Nothing is perfect, less so when you are experimenting with a new language. Some aspects that made the learning-curve harder:

* Lifetimes. It's one of the main features of Rust, it comes with major benefits, but it was a pain to manage. I had to refactor a lot of code because at the top level a closure would give me a lifetime error that I couldn't fix. I guess with experience you get better at it, and it forces you to make smaller methods to avoid odd dependencies, but... it can be a pain. Garbage collection is a blessing, sometimes.

* Semicolons. Used to Scala, having to add semicolons at the end of most of the lines wasn't a great experience. The worst is exactly that *most of the lines* part, as there are lines in which you don't want semicolons as they change the meaning of the expression. Not hard to grasp, but feels like a step backwards.

* Snake Case. Ok, it's something minor, but after so many years in the JVM world, moving to Snake case wasn't easy, habits die hard. And [clippy](https://github.com/rust-lang/rust-clippy) was complaining non-stop about it.

* Bigger files. In Rust it is idiomatic to add your unit tests at the end of the file. The issue is that you end up having very long files, which are harder to navigate. It may be due to being used to the JVM way, but having a separate test folder with specific code in there feels, somehow, cleaner.


## Conclusions

I feel that Rust is great for low level work, but currently it can't replace a stack like `http4s` and `cats` due to a lack of libraries supporting it. There are a set of community pages (the `AreWe` pages, as seen before) that explain the progress in some areas. Looking at, for example, [Are We Async](https://areweasyncyet.rs) one can see that today (February 2019) several `RFC` are still in progress and some `unresolved` questions remain open.

I hope they catch up soon, as the speed on both compilation and execution plus the FP support may make it a worthy alternative to Scala. But, right now, I think I'll stick to my trusted tools for backend development, and dable with Rust only for specific needs.


That's all for now, I hope this was informative and useful. As always, feedback via Twitter/Email is more than welcome. Cheers!
