---
author: Pere Villega
pubDatetime: 2016-11-14
title: Learning Shapeless
draft: false
tags:
  - scala
  - shapeless
  - generic programming
description: Shapeless is a type class and dependent type based generic programming library for Scala. It had its origins in several talks by Miles Sabin, and he has been the main contributor to the project.
---


[Shapeless](https://github.com/milessabin/shapeless) is a type class and dependent type based generic programming library for Scala. It had its origins in several talks by [Miles Sabin](https://twitter.com/milessabin), and he has been the main contributor to the project.

<!-- more -->

Within the community, [Shapeless](https://github.com/milessabin/shapeless) is considered both as a stepping stone towards very advanced Scala constructs and a hard to learn (and to master) library. Unfortunately, Shapeless documentation is a bit sparse so users must find external resources to learn parts of the library.

My aim with this blog post is to provide a list of useful resources that may help you understand [Shapeless](https://github.com/milessabin/shapeless) and how your project can benefit from using it.

## Why Shapeless

First of all you may want to know what are the benefits of using Shapeless. Is it only relevant for library authors, or is it a library you want to use on your production codebase?

These [slides](https://speakerdeck.com/nigewarren/introduction-to-shapeless) from [Nigel Warren](https://twitter.com/nigewarren) show some realistic use cases for Shapeless. A short read that can give you an idea on what you could achieve with it.

This [video](https://www.youtube.com/watch?v=JKaCCYZYBWo) from [Valentin Kasas](https://twitter.com/valentinkasas?lang=en) at [Scalar 2016](http://www.scalar-conf.com) shows a practical use case of Shapeless and HList, with example code.

The above links are introductions to the library and, as such, limited in scope. But you can already see a common theme, via the use of HList constructs: to provide a single implementation that works with all your types, instead of one implementation for every single type.

This approach has obvious advantages: less code means less bugs and less surface to be tested, while the fact it works for any case class makes the code more robust against new types introduced in the future.

I won't deny the type signatures are a bit off-putting, but that is a small price to pay for the flexibility you can obtain.

## A Business Case

Even after reading the links above you may still be a Shapeless skeptic, with the belief that is a tool with little benefit 'in the real world' (whatever that means to you). Confession time: I also was one, and it was a real-world issue at work what changed my mind.

The scenario is simple: we had a set of case classes representing different value types, and we needed to render them as Html, with reasonable expectations of adding many more types in the near future. So we wanted a simple way to convert exiting types plus any other type we would create later on.

If you have read some tutorials on Shapeless you may recognise this case as a common example to introduce some of the functionalities of the library, and this is so for a good reason: Shapeless excels at this task.

I am not allowed to publish all the code, but you can see a relevant snippet below:

```scala
object ShowHtml {

  implicit val hnilEncoder: ShowHtml[HNil] =
    new ShowHtml[HNil] {
      def showHtml(t: HNil): NodeSeq = NodeSeq.Empty
    }

  implicit def hlistEncoder[H, T <: HList](
                            implicit
                            hEncoder: Lazy[ShowHtml[H]],
                            tEncoder: ShowHtml[T]
                          ): ShowHtml[H :: T] =
    new ShowHtml[H :: T] {
      def showHtml(hlist: H :: T): NodeSeq = hlist match {
        case h :: t => hEncoder.value.showHtml(h) ++ tEncoder.showHtml(t)
      }
    }

  implicit val cnilEncoder: ShowHtml[CNil] =
    new ShowHtml[CNil] {
      def showHtml(t: CNil): NodeSeq = NodeSeq.Empty
    }

  implicit def coproductEncoder[H, T <: Coproduct](
                    implicit
                    hEncoder: Lazy[ShowHtml[H]],
                    tEncoder: ShowHtml[T]
                  ): ShowHtml[H :+: T] =
    new ShowHtml[H :+: T] {
      def showHtml(hlist: H :+: T): NodeSeq = hlist match {
        case Inl(h) => hEncoder.value.showHtml(h)
        case Inr(t) => tEncoder.showHtml(t)
      }
    }

  implicit def genericEncoder[A, R](
                   implicit
                   gen: Generic.Aux[A, R],
                   enc: Lazy[ShowHtml[R]]
                 ): ShowHtml[A] =
    new ShowHtml[A] {
      def showHtml(a: A) = enc.value.showHtml(gen.to(a))
    }


  implicit def stringShow: ShowHtml[String] = new ShowHtml[String] {
    def showHtml(t: String): NodeSeq = <ul>{t}</ul>
  }

  implicit def booleanShow: ShowHtml[Boolean] = new ShowHtml[Boolean] {
    def showHtml(b: Boolean) = stringShow.showHtml(b.toString)
  }

  implicit def intShow: ShowHtml[Int] = new ShowHtml[Int] {
    def showHtml(n: Int) = stringShow.showHtml(n.toString)
  }
}
```

I won't explain the code itself, that's not the aim of this post and in any case it's not complete. What matters is that this snippet is the core of a fragment of code that thanks to methods `hlistEncoder`, `coproductEncoder`, and related definitions will convert any case class in the codebase to HTML. This includes any future case class we create later on, no changes required.

As a developer, it hardly gets better than this :)

## Effortless Shapeless

You may not be convinced of the benefits of Shapeless (ok, keep reading then) or maybe you feel learning Shapeless requires an amount of effort and time you cannot spare. I have good news for you: you don't need to learn Shapeless to benefit from it.

If you browse the [Scala index](https://index.scala-lang.org/) and search for `shapeless` you'll see a lot of results. Besides Shapeless itself you will find entries like:

* [Argonaut Shapeless](https://index.scala-lang.org/alexarchambault/argonaut-shapeless) which provides automatic derivation of codecs for your case classes
* [Shapeless Contrib](https://index.scala-lang.org/typelevel/shapeless-contrib) which enables integration of Shapeless with libraries like Scalaz, which benefit from automatic derivation

And many more. These libraries make your coding experience easier by leveraging shapeless. But you are not exposed to Shapeless itself, that's hidden from you. For example, [Argonaut Shapeless](https://index.scala-lang.org/alexarchambault/argonaut-shapeless) provides json codecs for your case classes automatically. So, as per the library documentation, this just works:

```scala
import argonaut._, Argonaut._, ArgonautShapeless._

sealed trait Base
case class First(i: Int) extends Base
case class Second(s: String) extends Base

// encoding
val encode = EncodeJson.of[Base]

val json = encode(First(2))
json.nospaces == """{"First":{"i":2}}"""

// decoding
val decode = DecodeJson.of[Base]

val result = decode.decodeJson(json)
result == DecodeResult.ok(First(2))
```

As you can see, no encoder nor decoder have been defined in the code, that being a tedious and repetitive task. Any new case class or ADT you add to your codebase benefits from this behaviour, automatically.

By using these libraries you will understand what Shapeless offers you much better, and they may be your 'gateway library' to learning Shapeless.

## Learning Shapeless

You have been convinced and want to learn Shapeless. Now what?

A while ago that would mean scouring lots of links and blog posts online, to find information about the most recent release of the library. Nowadays there is a much straightforward solution, thanks to [Dave Gurnell](https://twitter.com/davegurnell) and [Underscore](http://underscore.io/): read the [Shapeless book](https://github.com/underscoreio/shapeless-guide).

Yes, there is a free ebook that explains how to use Shapeless, and it is a great book. Thanks Dave!

Not only that, but [47 Degrees](http://www.47deg.com/) have released [Scala Exercises](https://www.scala-exercises.org/), a free website where you can practice some of the Shapeless concepts.

And for the cases not covered by [Scala Exercises](https://www.scala-exercises.org/), [Scala Fiddle](https://scalafiddle.io/) allows you to select Shapeless as an available library (see *Libraries* section on the left-hand panel), so that you can test your Shapeless snippets online. Who needs an IDE?

This means you can easily read documentation on Shapeless and solve some exercises to test your newly acquired knowledge. What's your excuse? Go and start learning!

## Additional Guides

The existence of the [Shapeless book](https://github.com/underscoreio/shapeless-guide) and [Scala Exercises](https://www.scala-exercises.org/) makes learning Shapeless much easier, but I would be remiss if I dismissed other guides you can find online.

I find it very useful, when trying to learn a new and complex subject, to read many posts about the same idea. The repetition of the concepts breeds familiarity (hopefully without contempt!) with the concepts, and an array of examples allows for better understanding of the core ideas plus some of their nuances.

To this aim I recommend you to read the following posts, either before starting the book or as complementary documentation to flesh out the trickier concepts:

* [Julien](https://twitter.com/skaalf) wrote an [introduction to Shapeless](http://jto.github.io/articles/getting-started-with-shapeless/) which describes (at a very high level) the main components of the library
* [Edoardo Vacchi](https://twitter.com/evacchi) wrote a good [primer on Shapeless](http://rnduja.github.io/2016/01/19/a_shapeless_primer/) that delves into a bit more detail than Julien's article.
* [Anatolii Kmetiuk](https://twitter.com/AKmetyuk) wrote a couple of posts that describe both [HList](http://akmetiuk.com/blog/2016/09/30/dissecting-shapeless-hlists.html) and [Poly](http://akmetiuk.com/blog/2016/10/09/dissecting-shapeless-poly.html) in much more detail.
* [Vladimir Pavkin](https://twitter.com/vlpavkin) shows how to [implement a typesafe request builder](http://pavkin.ru/implementing-typesafe-request-builder/) using Shapeless, a more practical example.
* And, lastly, if you want to see [Travis Brown](https://twitter.com/travisbrown) doing some magic with Shapeless to solve a [Project Euler problem](https://projecteuler.net/problem=2) please read [this stack overflow answer](http://stackoverflow.com/questions/31615371/scala-shapeless-code-for-project-euler-2/31640467#31640467)

As mentioned, these links are complementary to the book but worth reading.

That's all for now, I hope this was informative and useful. As always, feedback via Twitter/Email is more than welcome. Cheers!
