---
author: Pere Villega
pubDatetime: 2016-05-28
title: On Free Monads
draft: false
tags:
  - scala
  - monad
  - fp
  - free monad
description: "The concept of Free Monad is becoming popular, or at least I've seen plenty of mentions about it in the Scala Functional Programming community as of late. Why is it relevant?"
---


The concept of [Free Monad](http://typelevel.org/cats/datatypes/freemonad.html) is becoming popular, or at least I've seen plenty of mentions about it in the Scala Functional Programming community as of late. Why is it relevant?

<!-- more -->

A couple of warnings before I start. Judging by the code I wrote, this will be a *very long* post. You can look at the [code](https://github.com/pvillega/free-monad-sample) and come back to read this post later. Also, I'm going to take a *practical* approach to Free Monad. I'll provide a list of relevant links at the end you can use to learn more about Free Monad and its nuisances, including Cat's explanation on [the theory behind Free](http://typelevel.org/cats/datatypes/freemonad.html#what-is-free-in-theory). But no theory here, sorry :)

Let's do this.

## Why should I care about Free Monad?

Anything related to [Monads](http://typelevel.org/cats/typeclasses/monad.html) seems scary and complex for the uninitiated. Why should I spend time learning that? What's the benefit?

There are descriptions of [Free Monad](http://typelevel.org/cats/datatypes/freemonad.html) that give a good overview on why to use it. In my humble opinion, the main benefit that Free provides is separation between the program definition and its execution.

You start by building an embedded DSL, which can be understood by the business. Using that language, you define a program as a series of actions that cover a business case, without any implementation details associated.

At this point you can test the business-defined logic in isolation (with fast unit tests, no need of mocks). You can *talk the same language* as the business. And only at the end, when needed, you provide a *real-world* implementation that interacts with 3rd party services and such.

This has the potential to provide more robust code, that can be tested easily, and which is a better fit to the business requirements. Also, replacing implementations (say, you change your sms provider) has minimal impact in the codebase as you only modify the interpreter, nothing else. Wether you do [DDD](https://en.wikipedia.org/wiki/Domain-driven_design) or not, all this must sound *very appealing* ;)

In addition, implementations of Free Monad (both in Cats and Scalaz) provide other benefits, for example the use of Trampolining for stack-safe recursion.

A bit like with [Monad](http://typelevel.org/cats/typeclasses/monad.html), a [Free Monad](http://typelevel.org/cats/datatypes/freemonad.html) is a relatively simple concept behind a scary name. Easier than it seems, and very useful. Either that, or I've understood nothing and need to go back to the study desk ;)

## A business case

I'll start with a very simplistic business case. We want to implement an application to buy and sell stocks. Our standard approach may generate code similar to:

``` scala
object Orders {
	type Symbol = String
	type Response = String
	def buy(stock: Symbol, amount: Int): Response = ???
	def sell(stock: Symbol, amount: Int): Response = ???
}
```

But we have heard about this new thing called `Free Monad` and we want to use it. We start by creating a DSL, a business language, that describes our actions. For example, we convert

``` scala
  def buy(stock: Symbol, amount: Int): Response
```

into

``` scala
  case class Buy(stock: Symbol, amount: Int) extends Orders[Response]
```

You can see there is an equivalence in meaning between the two forms: case class parameters and method parameters, return value and type parameter in our case class (specifically in `Orders[Response]`). We are converting our methods into a language, but one that has no implementation associated.

If we do this with both methods, we get:

``` scala
  sealed trait Orders[A]
  case class Buy(stock: Symbol, amount: Int) extends Orders[Response]
  case class Sell(stock: Symbol, amount: Int) extends Orders[Response]
```

Please take a moment to see and understand the parallelisms between the above implementation, using case classes, and our original methods. Note that the parent trait `Orders` is similar to a `Functor` (a structure with a hole); this is a requirement of `Free`, all the languages you define *must* follow a similar structure.

So, what do we have at this point? We have a language that defines buying or selling a stock. But it has no logic associated, and creating an instance does nothing (besides instantiating the case class). Furthermore, we can't try to compile something like:

``` scala
  for {
	r <- Buy("FB", 100)
  } yield r
```

as it won't work. We need to turn this into a Monad, somehow.

## Lifting to Free

To be able to use the language in our programs, we want to convert it into something we can run. For example, a Monad. That's the task of a Free Monad, and Cats provides a very easy way to do that:

``` scala
  import cats.free.Free

  type OrdersF[A] = Free[Orders, A]
```

We have defined a new type, a `Free` Monad on `Orders` and a parameter `A`. But that's not enough, we need to map our case classes to instances of `Free`. Thankfully `Free` itself makes this step easy:

``` scala
  import cats.free.Free._

  def buy(stock: Symbol, amount: Int): OrdersF[Response] = liftF[Orders, Response](Buy(stock, amount))
  def sell(stock: Symbol, amount: Int): OrdersF[Response] = liftF[Orders, Response](Sell(stock, amount))
```

Notice that the return types of the methods, `OrdersF[Response]`, match the Free Monad (as defined above). Also, the type parameter returned, `Response`, matches the parameter in the `extends` portion of our case class definition, which we mapped to work akin to *return type* when converting from methods to case classes.

Now we can use these support methods, `buy` and `sell`, to obtain our monads. And it works:

``` scala
  val flatMapThat = buy("APPL", 100).flatMap(rsp => sell("GOOG", 100))
```

The code above builds and returns a `Free` structure. This means that we can use the monads to define some business logic. For example, we can define a smart algorithm to buy and sell shares:

``` scala
val smartTrade: OrdersF[Response] = for {
    _ <- buy("APPL", 50)
    _ <- buy("MSFT", 10)
    rsp <- sell("GOOG", 200)
  } yield rsp
```

We are using a for-comprehension to chain a series of actions. `buy` and `sell` are used to obtain the monads that define the steps of the algorithm. As you can see, the return type is `OrdersF[Response]` as expected by the logic, which yields the result of calling `sell`.

At this point we have built a language for our business case, along algorithms that use that language. But this code still does nothing else than defining the steps, we have no way to obtain a result from it. We need a way to execute, or interpret, our language.

## Our first interpreter

An interpreter is something that will read our program and do something with it. Technically, an interpreter is a `natural transformation`, but as I said at the start I don't want to focus on the theory right now. The key thing to know is that an interpreter requires a monad as the end-part of the transformation. This means you can use an interpreter to obtain `Option`, `Xor`, or some other monad, but not to obtain anything that is not a monad.

As usual an example is better than a thousand words, so let's use the simplest monad, `Id`, to build an interpreter:

``` scala
import cats.{Id, ~>}

def orderPrinter: Orders ~> Id =
    new (Orders ~> Id) {
      def apply[A](fa: Orders[A]): Id[A] = fa match {
        case Buy(stock, amount) =>
          println(s"Buying $amount of $stock")
          "ok"
        case Sell(stock, amount) =>
          println(s"Selling $amount of $stock")
          "ok"
      }
    }
```

This squiggly sign `~>` is the syntax sugar for `natural transformation`. Note that in the interpreter we do a pattern match over each member of our language. As `Buy` is of type `Order[Response]` (equivalent to `Order[String]` in this scenario), the method signature forces us to return a result of `Id[String]`. The same for `Sell`.

As you can see, we are also executing some `println` statements before returning the result. The only restriction given by the signature is the return type, we can have side effects in our code (as we do in this case). Obviously this is not advisable, but it can be useful when we create interpreters for testing purposes.

We have our interpreter, which means that we have all the pieces we need to execute the program. We can do this via the `foldMap` operation:

``` scala
 smartTrade.foldMap(orderPrinter)
```

and we will see the result of the `println` operations in our terminal:

```
Buying 50 of APPL
Buying 10 of MSFT
Selling 200 of GOOG
```

It's working! We have built our first Free Monad, and it works. Take your time to understand what we have done, and remember the [code](https://github.com/pvillega/free-monad-sample) is available to download.

## Xor Interpreters

We have built our first interpreter, but let's be honest: `Id` is not so useful, and we want to avoid side-effects in our code. If we aim to do something akin to [railway oriented programming](http://fsharpforfunandprofit.com/posts/recipe-part2/) we may want to use `Xor` instead.

But this reveals a slight issue: the natural transformation expects a monad with shape `G[_]`, and `Xor` is `Xor[+A, +B]`. There is a mismatch in the number of *holes*. Thankfully we can fix that with a small trick, by fixing the type of the left side of `Xor`, like:

``` scala
type ErrorOr[A] = Xor[String, A]
```

This creates a new monadic type with a single type parameter, which fits the requirements of natural transformation. You may want to use an ADT instead of `String` on the left side, to make it more flexible. In any case, we can now construct a new interpreter:

``` scala
import cats.syntax.xor._
import cats.data.Xor

def xorInterpreter: Orders ~> ErrorOr =
 new (Orders ~> ErrorOr) {
   def apply[A](fa: Orders[A]): ErrorOr[A] =
     fa match {
       case Buy(stock, amount) =>
         s"$stock - $amount".right
       case Sell(stock, amount) =>
         "Why are you selling that?".left
     }
 }
```

and if we execute it

``` scala
 smartTrade.foldMap(xorInterpreter)
```

we will see that the result is a left:

```
Left(Why are you selling that?)
```

Which brings us to a very important point: you are using your interpreter in a for-comprehension (usually). If you return a monadic value that would usually shortcut the process, like `Xor.Left` or `Nil` or `None`, the remainder of the program won't we executed.
This may be what you want, but be aware of this behaviour. For a relevant example, if we had a case class extending `Orders[Unit]` and a natural transformation to `Option`, we may want to return `Some(())` instead of `None` to avoid this behaviour.

Ok, so we have built another interpreter, and it works. But our language is still very simple, let's make it a bit more useful.

## Extending the language

We want smart algorithms, and hardcoding the stocks to buy won't help. We are aiming to build programs similar to:

``` scala
 val smartTradeWithList: Free[Orders, String] = for {
    st <- listStocks()
    _ <- buy(st, 100)
    rsp <- sell("GOOG", 100)
  } yield rsp
```

So we can start by defining a new case class and lifting it to a Free Monad instance:

``` scala
case class ListStocks() extends Orders[List[Symbol]]

def listStocks(): OrdersF[List[Symbol]] =
  liftF[Orders, List[Symbol]](ListStocks())
```

If you execute the program above (`smartTradeWithList`) you will see it doesn't compile. The reason is that `buy` expects a single `Symbol`, but `st` is `List[Symbol]`. Ah, but of course! We are flatmapping over `OrdersF[A]` and, as expected, the left side of the for-comprehension binds to the `A` value. In our case, as `listStocks` returns `OrdersF[List[Symbol]]` then `st` will be `List[Symbol]`.

So what now? If we couldn't work around this restriction, the utility of Free Monads would be very limited, as this is a common use case. Luckily, the [Traverse](http://eed3si9n.com/herding-cats/Traverse.html) typeclass solves exactly this kind of issue. We can rewrite our program as:

``` scala
import cats.std.list._
import cats.syntax.traverse._

val smartTradeWithList: Free[Orders, String] = for {
    st <- listStocks()
    _ <- st.traverseU(buy(_, 100))
    rsp <- sell("GOOG", 100)
  } yield rsp
```

and, with slightly more verbose code, it will compile. We could always hide the extra verbosity behind a helper method, if we want. We must also update our `orderPrinter` to tackle the new `ListStocks` case:

``` scala
 def orderPrinter: Orders ~> Id =
    new (Orders ~> Id) {
      def apply[A](fa: Orders[A]): Id[A] =
	  fa match {
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

And now we can execute the new program:

``` scala
smartTradeWithList.foldMap(orderPrinter)
```

to see the expected output:

```
Getting list of stocks: FB, TWTR
Buying 100 of FB
Buying 100 of TWTR
Selling 100 of GOOG
```

The language works. We can now build our smart programs and release into production to, hopefully, earn us a lot of money. Well, almost. The programs work, but if someone makes a mistake, how will we know? We might want to add some logging, but we don't want to use side effects. How to do it?

## Adding Logs

Logging is a language in itself. We want to embed log messages in the application, but how to manage them is another matter: we may want to ignore them on testing, to send them to a log file, or even to several destination. As such, using a Free Monad for logs makes sense. So let's define the language and create the associated Free Monad:

``` scala
sealed trait Log[A]

case class Info(msg: String) extends Log[Unit]

case class Error(msg: String) extends Log[Unit]

type LogF[A] = Free[Log, A]

def info(msg: String): LogF[Unit] =
  liftF[Log, Unit](Info(msg))

def error(msg: String): LogF[Unit] =
  liftF[Log, Unit](Error(msg))

def logPrinter: Log ~> Id =
  new (Log ~> Id) {
    def apply[A](fa: Log[A]): Id[A] =
	  fa match {
        case Info(msg) =>
		  println(s"[Info] - $msg")
        case Error(msg) =>
		  println(s"[Error] - $msg")
      }
  }
```

We have seen this before, nothing new here. We can now log `info` and `error` messages and we have an interpreter to `Id` that will send some output to the terminal. Let's add some logging to our program, then:

``` scala
val smartTradeWithLogs = for {
    _ <- info("I'm going to trade smartly")
    _ <- buy("APPL", 100)
    _ <- info("I'm going to trade even more smartly")
    _ <- buy("MSFT", 100)
    rsp <- sell("GOOG", 100)
    _ <- error("Wait, what?!")
  } yield rsp
```

and, no, this doesn't compile. The reason is clear once you look at the signature of `flatMap`, `flatMap[A,B](a: F[A])(f: A => F[B]): F[B]`. The initial and final monad must be the same when using `flatMap`, but in here we are mixing `OrdersF` and `LogF` monads in the same for-comprehension. So it won't compile.

The solution, in Cats, is to use an alternative way to lift our case classes to Monads. Instead of using the `liftF` method from `Free` we will use a slightly more complex structure that will help us later to mix both Monads. Let's start with an example:

``` scala
import cats.free.{Free, Inject}

class OrderI[F[_]](implicit I: Inject[Orders, F]) {
  def buyI(stock: Symbol, amount: Int): Free[F, Response] = Free.inject[Orders, F](Buy(stock, amount))

  def sellI(stock: Symbol, amount: Int): Free[F, Response] = Free.inject[Orders, F](Sell(stock, amount))
}

// We need this implicit
implicit def orderI[F[_]](implicit I: Inject[Orders, F]): OrderI[F] = new OrderI[F]
```

As you can see we create a class `OrderI` that contains two methods which will lift our case classes into monads, by using `Free.inject`. The key part here is the implicit `Inject[Orders, F]` which, on compilation, will resolve to a type that binds everything together. The implicit method `orderI` is there to facilitate using this construct in our program, as we will see later on.

Take this as a template to follow, a bit of boilerplate to lift case classes into monads, no need to understand all the details right now. Note that we can use both `liftF` and this *new* way to lift our case classes into monads, they are not exclusive nor incompatible.

Let's do the same for our new language `Log`:

``` scala
import cats.free.{Free, Inject}

class LogI[F[_]](implicit I: Inject[Log, F]) {
  def infoI(msg: String): Free[F, Unit] =
    Free.inject[Log, F](Info(msg))

  def errorI(msg: String): Free[F, Unit] =
    Free.inject[Log, F](Error(msg))
}

implicit def logI[F[_]](implicit I: Inject[Log, F]): LogI[F] = new LogI[F]
```

Now that we have a way to lift both languages into monads, we need a way to use both in a for-comprehension. The solution here is given by `Coproduct` (explanation on this typeclass outside of the scope, sorry!) which will allow us to wire both types together.

``` scala
import cats.data.Coproduct

type TradeApp[A] = Coproduct[Orders, Log, A]
```

With this we can now define our program, again:

``` scala
def smartTradeWithLogs(implicit O: OrderI[TradeApp],
                                L: LogI[TradeApp]): Free[TradeApp, Response] = {
  import L._
  import O._

  // Look, ma, both monads at once!
  for {
    _ <- infoI("I'm going to trade smartly")
    _ <- buyI("APPL", 100)
    _ <- infoI("I'm going to trade even more smartly")
    _ <- buyI("MSFT", 100)
    rsp <- sellI("GOOG", 100)
    _ <- errorI("Wait, what?!")
  } yield rsp
}
```

This compiles. We are using the implicit methods defined before to create instances of `OrderI` and `LogI`. By receiving our `Coproduct` as the type parameter, their implicit `Inject` will help us build a compatibility layer between both monads. You can check the source code of `Inject` to understand how this works.

We have our program, with both behaviour and logs in it. Now we want to execute it. Unfortunately, the interpreters we defined before can't be used as they are, we need an interpreter for the new `TradeApp` type. The good news are that this new interpreter can be built on top of the existing ones:

``` scala
def composedInterpreter: TradeApp ~> Id = orderPrinter or logPrinter
```

This interpreter is defining a natural transformation from `TradeApp` (a monad) to `Id` (another monad). As `TradeApp` is a `Coproduct`, and we already have interpreters from each of its elements to `Id`, we can take advantage of the `or` method in a natural transformation and delegate the task to our existing interpreters. Reuse is always good :)

We can run this:

``` scala
smartTradeWithLogs.foldMap(composedInterpreter)
```

and we will see the output in our terminal, including the logs:

```
[Info] - I'm going to trade smartly
Buying 100 of APPL
[Info] - I'm going to trade even more smartly
Buying 100 of MSFT
Selling 100 of GOOG
[Error] - Wait, what?!
```

There you have it. Two full languages working together to define a program, that we can later on run with a specific interpreter. Isn't it neat? Although the code seems more verbose that with the original example, remember that we are defining all these elements (implicit classes and interpreters) just once, and they will work with all our programs using these languages. Not a bad trade-off.

## What's better than 2 languages?

So we can build programs with two languages, but... what if we want three? We are managing money and shares, so besides logs we may be required to add auditing to the application. How easy is that? Let's start by defining a third language, `Audit`, as we just did with the other two:

``` scala
sealed trait Audit[A]

case class UserActionAudit(user: UserId, action: String, values: List[Values]) extends Audit[Unit]

case class SystemActionAudit(job: JobId, action: String, values: List[Values]) extends Audit[Unit]

class AuditI[F[_]](implicit I: Inject[Audit, F]) {
  def userAction(user: UserId, action: String, values: List[Values]): Free[F, Unit] =
    Free.inject[Audit, F](UserActionAudit(user, action, values))

  def systemAction(job: JobId, action: String, values: List[Values]): Free[F, Unit] =
    Free.inject[Audit, F](SystemActionAudit(job, action, values))
}

implicit def auditI[F[_]](implicit I: Inject[Audit, F]): AuditI[F] = new AuditI[F]

def auditPrinter: Audit ~> Id =
  new (Audit ~> Id) {
    def apply[A](fa: Audit[A]): Id[A] =
	  fa match {
        case UserActionAudit(user, action, values) =>
		  println(s"[USER Action] - user $user called $action with values $values")
        case SystemActionAudit(job, action, values) =>
		  println(s"[SYSTEM Action] - $job called $action with values $values")
      }
}
```

Again, you have seen all this before. We have a language, we lift the case classes to Free Monad and we create an interpreter to `Id`. Easy. The complex part comes when we want to define our `Coproduct` and the typeclass is declared as `Coproduct[F[_], G[_], A]`, which means we have room for only two monads, `F` and `G`. But we need 3. Ouch!

But, wait! In the previous section we defined the `TradeApp` coproduct. Which is a coproduct, yes, but also behaves like our Free Monads, so we can consider it a Monad (I'm not sure if it is technically correct to call it a Monad, but let's ignore that by now). This means, in fact, we have only two monads: `Audit` and `TradeApp`. So we can build the `Coproduct`:

``` scala
type AuditableTradeApp[A] = Coproduct[Audit, TradeApp, A]
```

A note of interest: due to the way `Inject` is implemented, our `TradeApp` class needs to be on the right hand side, otherwise this code won't compile.

We have the type, what about the interpreter? Yes, we can reuse our existing ones, this has not changed:

``` scala
def auditableInterpreter: AuditableTradeApp ~> Id = auditPrinter or composedInterpreter
```

Notice that in the interpreter the order also matters, due to the implementation details of `or`. But, at this point, we have all the pieces we need and we can build our program:

``` scala
def smartTradeWithAuditsAndLogs(implicit O: OrderI[AuditableTradeApp],
                                         L: LogI[AuditableTradeApp],
										 A: AuditI[AuditableTradeApp]
							    ): Free[AuditableTradeApp, Response] = {
  import A._
  import L._
  import O._

  for {
    _ <- infoI("I'm going to trade smartly")
    _ <- userAction("ID102", "buy", List("APPL", "100"))
    _ <- buyI("APPL", 200)
    _ <- infoI("I'm going to trade even more smartly")
    _ <- userAction("ID102", "buy", List("MSFT", "100"))
    _ <- buyI("MSFT", 100)
    _ <- userAction("ID102", "sell", List("GOOG", "100"))
    rsp <- sellI("GOOG", 300)
    _ <- systemAction("BACKOFFICE", "tradesCheck", List("ID102", "lastTrades"))
    _ <- errorI("Wait, what?!")
  } yield rsp
}
```

and on execution

``` scala
smartTradeWithAuditsAndLogs.foldMap(auditableInterpreter)
```

we see

```
[Info] - I'm going to trade smartly
[USER Action] - user ID102 called buy with values List(APPL, 100)
Buying 200 of APPL
[Info] - I'm going to trade even more smartly
[USER Action] - user ID102 called buy with values List(MSFT, 100)
Buying 100 of MSFT
[USER Action] - user ID102 called sell with values List(GOOG, 100)
Selling 300 of GOOG
[SYSTEM Action] - BACKOFFICE called tradesCheck with values List(ID102, lastTrades)
[Error] - Wait, what?!
```

We did it. We have three languages working together in our program. And the only additional definitions are a couple of `Coproduct` types as well as interpreters, which are built reusing existing interpreters for our types. Not a lot of work for the benefits we get, if I can say so.

At this stage we could try to add more languages, but we see the pattern on how it would work. So let's try something different.

## Free Monads all the way down

Our original `Orders` language didn't specify how would we send an order to someone. We could code that into an interpreter, true. But we can safely assume that Orders will be propagated via either HTTP requests or Messages to some system. Given the recent popularity of event-sourcing and Kafka, let's say some publish-subscribe system. It would be wasteful to redefine the details to interact with that system in each interpreter that needed so.

In fact, we can think that a language exists to interact with that system, so we should be able to define a Free Monad to work with that language. Let's do so:

``` scala
sealed trait Messaging[A]
case class Publish(channelId: ChannelId, source: SourceId, messageId: MessageId, payload: Payload) extends Messaging[Response]
case class Subscribe(channelId: ChannelId, filterBy: Condition) extends Messaging[Payload]

type MessagingF[A] = Free[Messaging, A]

def publish(channelId: ChannelId, source: SourceId, messageId: MessageId, payload: Payload): MessagingF[Response] =
  liftF[Messaging, Response](Publish(channelId, source, messageId, payload))

def subscribe(channelId: ChannelId, filterBy: Condition): MessagingF[Payload] =
  liftF[Messaging, Payload](Subscribe(channelId, filterBy))

def messagingPrinter: Messaging ~> Id =
  new (Messaging ~> Id) {
    def apply[A](fa: Messaging[A]): Id[A] =
	  fa match {
        case Publish(channelId, source, messageId, payload) =>
          println(s"Publish [$channelId] From: [$source] Id: [$messageId] Payload: [$payload]")
          "ok"
        case Subscribe(channelId, filterBy) =>
          val payload = "Event fired"
          println(s"Received message from [$channelId](filter: [$filterBy]): [$payload]")
          payload
      }
   }
```

Nothing new here either, we defined another language, this time using `liftF`, along an interpreter to `Id` to print messages to the terminal. By now, you should be able to do this with your eyes closed ;)

We have the language. How to make `Orders` work with this language, such that we can define our orders in terms of operations against a publish-subscribe network? The answer is natural transformation. If you remember, a natural transformation allows us to convert our original language to a new monad. And `MessagingF` is a monad, a free one. Which means we can do the following:

``` scala
def orderToMessageInterpreter: Orders ~> MessagingF =
  new (Orders ~> MessagingF) {
    def apply[A](fa: Orders[A]): MessagingF[A] = {
      fa match {
        case ListStocks() =>
          for {
            _ <- publish("001", "Orders", UUID.randomUUID().toString, "Get Stocks List")
            payload <- subscribe("001", "*")
          } yield List(payload)
        case Buy(stock, amount) =>
          publish("001", "Orders", UUID.randomUUID().toString, s"Buy $stock $amount")
        case Sell(stock, amount) =>
          publish("001", "Orders", UUID.randomUUID().toString, s"Sell $stock $amount")
      }
    }
  }
```

This compiles (and works, as we will see later). And yes, you can use a for-comprehension inside the interpreter, as we do in our `ListStocks` case. This specific transformation is simpler due to the fact that `publish`, `buy` and `sell` have the same response type `Response`, but as you can see adapting the results wouldn't be a problem, if required.

That was easy, wasn't it? So what about our interpreter? How do we bridge from `Orders` to `Id` while using `MessagingF`? For this case we need to build a small bridge between interpreters. Let me show you what I mean:

``` scala
def messagingFreePrinter: MessagingF ~> Id =
  new (MessagingF ~> Id) {
    def apply[A](fa: MessagingF[A]): Id[A] =
	  fa.foldMap(messagingPrinter)
  }

def ordersToTerminalViaMessage: Orders ~> Id =
  orderToMessageInterpreter andThen messagingFreePrinter
```

We can chain natural transformations via their `andThen` method. In this case, though, we have a small mismatch of parameters: `orderToMessageInterpreter` returns a `MessagingF` but `messagingPrinter` expects `Messaging`. The solution is to create a new interpreter from `MessagingF` to `Id`. The good news is that this interpreter can reuse our existing `messagingPrinter` via `foldMap`, which means this bridge is not adding risk (as in new logic) to our application.

If we use all this together to run our original program, without logging nor auditing:

``` scala
smartTrade.foldMap(ordersToTerminalViaMessage)
```

we see

```
Publish [001] From: [Orders] Id: [c7f22b1e-b688-4f61-82cb-39b421b8ab6c] Payload: [Buy APPL 50]
Publish [001] From: [Orders] Id: [94bbf71d-1c95-4c26-97a3-ce0b970893aa] Payload: [Buy MSFT 10]
Publish [001] From: [Orders] Id: [27311809-97f9-4e04-b813-7a2cf9743415] Payload: [Sell GOOG 200]
```

So now we are running our orders via another Free Monad that represents a lower-level layer in the stack. This means we can compose this new monad with other languages, as needed. This has the benefit that improvements to the interpreters of this new `Messaging` language will be automatically propagated to any program indirectly using it, as well as reducing the amount of code that needs to be tested thanks to reuse.

We have one last task left: use this new `Messaging` language with our program that has logs and audit commands.

## All together

The last step is to put all this together. We have a program, `smartTradeWithAuditsAndLogs`, that has logging and auditing. We want to run it against an interpreter that also uses our `Orders` to `Messaging` to `Id` interpreter defined above, `ordersToTerminalViaMessage`.

To do this, we need to define two new interpreters. The reason is that our original `TradeApp ~> Id` interpreter wasn't running through our `Messaging` language, and by changing the interpreter for `TradeApp` we will also need to define a new one for `AuditableTradeApp`:

``` scala
def composedViaMessageInterpreter: TradeApp ~> Id =
  ordersToTerminalViaMessage or logPrinter

def auditableToTerminalViaMessage: AuditableTradeApp ~> Id =
  auditPrinter or composedViaMessageInterpreter
```

As before, the good news is that we are reusing our previous original interpreters, just modifying how we combine them. When you think about it, we have only 4 interpreters to `Id`, one per language. All the other interpreters are combinations of these. Which means that, although it seems we are reimplementing them often, in fact we are not.

With this last interpreter we can run our full program:

``` scala
smartTradeWithAuditsAndLogs.foldMap(auditableToTerminalViaMessage)
```

and see in our terminal

```
[Info] - I'm going to trade smartly
[USER Action] - user ID102 called buy with values List(APPL, 100)
Publish [001] From: [Orders] Id: [1198b3b5-c4bd-4f96-90e7-56553f0d2a54] Payload: [Buy APPL 200]
[Info] - I'm going to trade even more smartly
[USER Action] - user ID102 called buy with values List(MSFT, 100)
Publish [001] From: [Orders] Id: [98b19c50-6b61-4f92-b28e-59395c103362] Payload: [Buy MSFT 100]
[USER Action] - user ID102 called sell with values List(GOOG, 100)
Publish [001] From: [Orders] Id: [8f95b6ae-47d4-4a70-aea3-feca73d63e7a] Payload: [Sell GOOG 300]
[SYSTEM Action] - BACKOFFICE called tradesCheck with values List(ID102, lastTrades)
[Error] - Wait, what?!
```

And that's it. We have defined a program using 4 different languages, used at different levels of abstraction. Quite a comprehensive case, if the length of this post is any indication :) I hope this showcases the main uses of Free Monad and gives you a better understanding on the subject.

Remember that you can clone the [code](https://github.com/pvillega/free-monad-sample) to play with all this yourself.

Now, let's talk about a couple of issues with Free Monads.

## Performance impact

Every time we add an abstraction, performance may diminish. I've not done any tests on performance using Free Monads as doing a proper benchmark is very hard, but I found a couple of references on the subject which may help understanding the impact.

This [Free Monad explanation](http://okmij.org/ftp/Computation/free-monad.html) is quite comprehensive, and it says about performance:

> Do we have to pay for all the benefits of free and freer monads in performance?
> With the simplest free and freer monads described so far: yes, the performance suffers.
> One should keep in mind that performance does not always matter: a large portion of software
> we successfully interact with every day is written in Python, Perl or Ruby, and which are not
> exactly speed kings.

I agree with the statement above in that most of our applications are not performance sensitive, within certain limits. For most operations the overhead introduced by Free Monad is not relevant, but don't use it if performance is critical to your business case.

[Pascal Voitot](https://twitter.com/mandubian) wrote last year a post on [better implementations](http://mandubian.com/2015/04/09/freer/) of Free. As far as I understand, some of the concepts are already implemented in Cats and may reduce the impact of Free a bit.

As usual, each use case is different. You should test your implementation to ensure resulting performance is acceptable to you.

## The criticisms

I've left this part to the last, at the point where saw a full implementation of Free and we can judge the criticisms from a more informed perspective. Shouldn't come as a surprise that not everybody likes Free Monad, and there are some justified criticisms to it.

As an example, recently [Alexandru Nedelcu](https://twitter.com/alexelcu), of [Monix](https://monix.io/) fame, tweeted a series of [opinions](https://twitter.com/alexelcu/status/736090380999888898) where he highlights some trade offs you make when you decide to use Free Monads.

This [talk](http://event.scaladays.org/scaladays-nyc-2016#!#schedulePopupExtras-7558) by [Kelley Robinson](https://twitter.com/kelleyrobinson) gave a bit more detail on situations in which Free Monad may not be a good fit. The video has not been published yet, but there are [slides](http://www.slideshare.net/KelleyRobinson1/why-the-free-monad-isnt-free-61836547) available.

Unfortunately I've lost a couple of references I had with people raising concerns about Free Monad. But I hope these two give you an idea of the general issues people have with this pattern.

In the end, you have to remember the Free Monad is just a tool, and no tool is a silver bullet. It may be a perfect fit for your application and team, right now, but you should understand the trade offs you are accepting. Unfortunately you can only understand that through experience; my advice is to start using it in areas of the code where the impact will be small and spread it as you learn.

## Thanks

With concepts like Free Monad, existing literature and people's help are crucial to navigate the hard parts. It would be unfair to not mention all contributions that helped me to understand (or so I hope) Free Monad, and to write this post.

There's plenty of information online that has been extremely useful. The most relevant links are listed in the next section. A big thanks to all the authors, the time spent on that documentation has helped at least one person :)

I need to thank [Miles Sabin](https://twitter.com/milessabin), [Channing Walton](https://twitter.com/channingwalton), and [Lance Walton](https://twitter.com/lancewalton), as experimentation we did with Free Monad provided a foundation for this post.

Many thanks to [Julien Truffaut](https://twitter.com/julientruffaut). He pointed to `traversableU` as the solution to mixing `List` results in the program for `Orders`. I got stuck in that case and, without his contribution, I'd be giving a horribly wrong solution to you, my reader.

Last, but not least, I need to thank [Cat's Gitter channel](https://gitter.im/typelevel/cats), in particular [Adelbert Chang](https://twitter.com/adelbertchang), as he corrected a few misconceptions I had whilst porting a Free Monad built using Scalaz to a version using Cats.

## References

I've used a lot of sources to improve my understanding on Free Monad. Below you can find a list of links that I found very relevant and helpful:

* Cats definition (very good explanation): [http://typelevel.org/cats/datatypes/freemonad.html](http://typelevel.org/cats/datatypes/freemonad.html)
* Free Monad technical explanation: [http://okmij.org/ftp/Computation/free-monad.html](http://okmij.org/ftp/Computation/free-monad.html)
* Tim Perrett's blog post (uses Scalaz): [http://timperrett.com/2013/11/21/free-monads-part-1/](http://timperrett.com/2013/11/21/free-monads-part-1/)
* Underscore post by Noel Welsh (uses Scalaz): [http://underscore.io/blog/posts/2015/04/14/free-monads-are-simple.html](http://underscore.io/blog/posts/2015/04/14/free-monads-are-simple.html)
* A second post by Noel Welsh: [http://underscore.io/blog/posts/2015/04/23/deriving-the-free-monad.html](http://underscore.io/blog/posts/2015/04/23/deriving-the-free-monad.html)
* The always useful Tutorial for Cats: [http://eed3si9n.com/herding-cats/Free-monads.html](http://eed3si9n.com/herding-cats/Free-monads.html)
* *A year living Freely* by Chris Myers: [https://www.youtube.com/watch?v=rK53C-xyPWw](https://www.youtube.com/watch?v=rK53C-xyPWw)
* A post by John A De Goes (uses Haskell) [http://degoes.net/articles/modern-fp](http://degoes.net/articles/modern-fp)


That's all for now, I hope this was informative and useful. As always, feedback via Twitter/Email is more than welcome. Cheers!

PS: Hold the door.
