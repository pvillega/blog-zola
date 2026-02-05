---
author: Pere Villega
pubDatetime: 2016-05-30
title: Free Monads using FreeK
draft: false
tags:
  - scala
  - monad
  - fp
  - free monad
  - freek
description: My previous post on Free Monad implemented a few DSL using Free Monads. The same day I published it I discovered FreeK by Pascal Voitot. How does FreeK help you when building a Free Monad?
---


My previous post on [Free Monad](/understanding-free-monads) implemented a few DSL using Free Monads. The same day I published it I discovered [FreeK](https://github.com/ProjectSeptemberInc/freek) by [Pascal Voitot](https://twitter.com/mandubian). How does FreeK help you when building a Free Monad?

<!-- more -->

I've updated my [code](https://github.com/pvillega/free-monad-sample) on Free Monad with a sample using FreeK. The sample contains my previous implementation which only used [Cats](http://typelevel.org/cats/tut/freemonad.html) Free implementation, so you can compare both side by side.

I can say upfront that FreeK removed a bit of *boilerplate* and made the implementation slightly cleaner. I feel the main benefit of FreeK is not so much the Free Monad tooling (which, don't misunderstand me, is good!) but it's integration with monad transformers, as well as the way it manages what Pascal calls *monadic onions of result types*.

## Implementing Free with FreeK

The first step is, as expected, to define our languages. I assume (from now onwards) that you have read [my previous post](/understanding-free-monads) so I won't discuss details already tackled in there.

With FreeK we define our language like this:

``` scala
object Orders {
  sealed trait DSL[A]
  final case class ListStocks() extends DSL[List[Symbol]]
  final case class Buy(stock: Symbol, amount: Int) extends DSL[Response]
  final case class Sell(stock: Symbol, amount: Int) extends DSL[Response]
}
```

which is no different as how we were doing it before; a trait with case classes. The convention of calling the trait `DSL` and embedding it in the object is one I'll use from now on, but it's not exclusive of *FreeK*, can be used without it.

An interpreter is defined as:

``` scala
object OrderInterpreter extends (Orders.DSL ~> Id) {
  import Orders._

  def apply[A](a: Orders.DSL[A]) = a match {
    case ListStocks() =>
      println(s"Getting list of stocks: FB, TWTR")
      List("FB", "TWTR")
    case Buy(stock, amount) =>
      println(s"Buying $amount of $stock")
      "ok"
    case Sell(stock, amount) =>
      println(s"Selling $amount of $stock")
      "ok"
  }
}
```

which, again, is an alternative to the way we were defining interpreters before. Not *FreeK* exclusive, but nicer :)

So let's define the rest of our languages:

``` scala
// Log dsl
object Log {
  sealed trait DSL[A]
  final case class Info(msg: String) extends DSL[Unit]
  final case class Error(msg: String) extends DSL[Unit]
}

// Defining the interpreter for Log
object LogInterpreter extends (Log.DSL ~> Id) {
  import Log._

  def apply[A](a: Log.DSL[A]) = a match {
    case Info(msg) =>
      println(s"[Info] - $msg")
    case Error(msg) =>
      println(s"[Error] - $msg")
  }
}

// Audit dsl
object Audit {
  sealed trait DSL[A]
  final case class UserAction(user: UserId, action: String, values: List[Values]) extends DSL[Unit]
  final case class SystemAction(job: JobId, action: String, values: List[Values]) extends DSL[Unit]
}

// Audit interpreter
object AuditInterpreter extends (Audit.DSL ~> Id) {
  import Audit._

  def apply[A](a: Audit.DSL[A]) = a match {
    case UserAction(user, action, values) =>
      println(s"[USER Action] - user $user called $action with values $values")
    case SystemAction(job, action, values) =>
      println(s"[SYSTEM Action] - $job called $action with values $values")
  }
}

// Messaging dsl
object Messaging {
  sealed trait DSL[A]
  final case class Publish(channelId: ChannelId, source: SourceId, messageId: MessageId, message: String) extends DSL[Response]
  final case class Subscribe(channelId: ChannelId, filterBy: Condition) extends DSL[Payload]
}

// Messaging interpreter
object MessagingInterpreter extends (Messaging.DSL ~> Id) {
  import Messaging._

  def apply[A](a: Messaging.DSL[A]) = a match {
    case Publish(channelId, source, messageId, message) =>
      println(s"Publish [$channelId] From: [$source] Id: [$messageId] Payload: [$message]")
      "ok"
    case Subscribe(channelId, filterBy) =>
      val payload = "Event fired"
      println(s"Received message from [$channelId] (filter: [$filterBy]): [$payload]")
      List(payload)
  }
}
```

Ok, languages defined. Next, let's define our *Free* type (or *Coproduct* for multiple types)

## The Free/Coproduct type

In here is where *FreeK* provides the first big improvement. *FreeK* contains a specialised implementation of Shapeless `Coproduct` for higher-kinded structures. The result is that we can define a type that includes several languages in one go, instead of having to create the chain of `Coproduct` we built in the previous post.

With *FreeK* you use the same syntax for a Free that includes one or several languages:

``` scala
type PRGOne[A] = (Log.DSL :|: FXNil)#Cop[A]
// PRG is the one we will use in our code
type PRG[A] = (Log.DSL :|: Audit.DSL :|: Orders.DSL :|: FXNil)#Cop[A]
```

Interpreters get a similar benefit. You can leverage *FreeK* specific syntax to easily compose interpreters from multiple languages. The only restrictions are:

* the interpreters must all be transformations to the same Monad (as with any composition of Natural Transformations, nothing new here)
* they must be declared in the same order the types are defined in our `PRG` declaration.

``` scala
val interpreter: Interpreter[PRG, Id] = LogInterpreter :|: AuditInterpreter :|: OrderInterpreter
```

With this we have our *free type* and the *interpreter*. That was easy! We just need the program to execute, and we are done.

## The program

If you have noticed, in the previous post we created some kind of support methods that lifted our case classes to a Free Monad. But this time we have not built anything similar. So, how are we going to use our case classes in a for-comprehension?

The answer is given by *FreeK and a support method appropriately called `freek[A]`. Let's see an example of its usage by replicating the logic in our original program:

``` scala
val program: Free[PRG, Response] = for {
      _ <- Info("I'm going to trade smartly").freek[PRG]
      _ <- UserAction("ID102", "buy", List("APPL", "100")).freek[PRG]
      _ <- Buy("APPL", 200).freek[PRG]
      _ <- Info("I'm going to trade even more smartly").freek[PRG]
      _ <- UserAction("ID102", "buy", List("MSFT", "100")).freek[PRG]
      _ <- Buy("MSFT", 100).freek[PRG]
      _ <- UserAction("ID102", "sell", List("GOOG", "100")).freek[PRG]
      rsp <- Sell("GOOG", 300).freek[PRG]
      _ <- SystemAction("BACKOFFICE", "tradesCheck", List("ID102", "lastTrades")).freek[PRG]
      _ <- Error("Wait, what?!").freek[PRG]
    } yield rsp
```

As you can see we are using the case classes we defined with our languages, directly. The magic happens within the `freek[PRG]` call, which lifts our case class to a Free Monad of the `Coproduct` defined by `PRG`.

We have replaced support methods using `Free.liftF` or `Inject` with this call, which some people may argue is not a huge benefit, code wise. Personally, I believe it's a big win as we have less clutter around our languages, where now we just see case classes and interpreters, and all the extra syntax is located within the program itself. Also, adding new languages is much simpler. What's not to like?

We can execute this program to verify it works:

``` scala
println(s"Use interpreter on `program`: ${program.foldMap(interpreter.nat)}")
```

Oh, by the way, remember that program that was returning a `List` inside the monad, and thus required the use of traverse? Yes, we can also implement it using *FreeK*:

``` scala
val programWithList: Free[PRG, Response] = for {
  st <- ListStocks().freek[PRG]
  _ <- st.traverseU(Buy(_, 100).freek[PRG])
  rsp <- Sell("GOOG", 100).freek[PRG]
} yield rsp
```

We still need the `traverseU` trick, but it works the same, as `freek[PRG]` returns a monad an that fits the signature of `traverseU`. So we can port our programs, we are not losing any core functionality by using *FreeK*.

## Orders via Messages

The last use case explored in the previous post was to define `Orders` as a set of `Messaging` operations, by chaining natural transformations from `Orders`, to `Messaging`, and to `Id`. Can we do this with *FreeK*? Let's start by defining a new interpreter from `Orders` to `Messaging`:

``` scala
object OrdersToMessagesInterpreter extends (Orders.DSL ~> Messaging.DSL) {
  import Orders._
  import Messaging._

  def apply[A](a: Orders.DSL[A]) = a match {
    case ListStocks() =>
      Publish("001", "Orders", UUID.randomUUID().toString, "Get Stocks List")
      Subscribe("001", "*")
    case Buy(stock, amount) =>
      Publish("001", "Orders", UUID.randomUUID().toString, s"Buy $stock $amount")
    case Sell(stock, amount) =>
      Publish("001", "Orders", UUID.randomUUID().toString, s"Sell $stock $amount")
  }
}
```

Next step, let's integrate this interpreter into the interpreter chain we defined before. To do this, we need to replace `OrderInterpreter` by a composition of the new interpreter (from `Orders` to `Messaging`) and the existing interpreter from `Messaging` to `Id`:

``` scala
val interpreterWithMessaging: Interpreter[PRG, Id] =
  LogInterpreter :|: AuditInterpreter :|: (MessagingInterpreter compose OrdersToMessagesInterpreter)
```

and then we run our program:

``` scala
println(s"Use interpreter with Messaging on `program`: ${program.foldMap(interpreterWithMessaging.nat)}")
```

It works, so it seems we can do what we expected! Can't we?

Well, the astute reader (i.e.: one that has read up to this point... congratulations!) will notice that in our previous implementation we were using a for-comprehension in `OrdersToMessagesInterpreter` for the case of `ListStocks`. As we are working with case classes directly, not with monads, we can't build the for-comprehension.

I've tried to work around it by creating some additional types to lift the classes via `freek[A]`, so we can have the same code as before, but it's become a bit verbose which means that, most likely, I'm doing something wrong :) Just be aware this use case may require a bit more effort than the others.

## In summary

I like *FreeK*, as it simplifies working with Free Monads. There may be a couple of scenarios which need either more work or a better understanding of the library, but in general it seems like a robust solutions. Let's not forget it also provides utilities to mix monad transformers with our Free monads, which will solve several pains related to monad stacks.

So if you want to use Free monads in our code, please give *Freek* a go :)

That's all for now, I hope this was informative and useful. As always, feedback via Twitter/Email is more than welcome. Cheers!
