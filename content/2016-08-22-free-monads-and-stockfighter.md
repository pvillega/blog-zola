+++
title = "Free Monads and Stockfighter"
date = 2016-08-22

[taxonomies]

categories = ["scala"]
tags = ["scala", "monad", "fp", "free monad", "stockfighter"]
+++


[StockFighter](https://www.stockfighter.io/) is a game by [Patrick McKenzie](https://twitter.com/patio11/) (Hi Patrick!) and [others](https://www.starfighters.io/about) that makes you compete in a virtual Stock Exchange to accomplish certain objectives. They use it as a recruitment tool (kind of, read their website) but it's a very entertaining game, even if you are not looking for a new job.

<!-- more -->

Why am I talking about [StockFighter](https://www.stockfighter.io/)? Well, as you can guess from the title, because [Free Monads](http://typelevel.org/cats/tut/freemonad.html)! Care to join?

## The Mission

[StockFighter](https://www.stockfighter.io/) provides an environment which is limited in scope, but still complex enough that showcases limitations/strengths for a given tool. I've had in my backlog, for a looong while, the *mission* of completing the game. Building an API to do so using Free seemed like the perfect match.

The aim was to build a Free Monad wrapper on top of the [Stockfighter API](https://starfighter.readme.io/docs/), using [Freek](https://github.com/ProjectSeptemberInc/freek), which allows us to solve the levels of the game. The API would only focus on the *Trading* part of the game as the other component, *Jailbreak*, is not fully ready to be used.

## Caveats

Before we start, I want to make you aware that I am a beginner regarding Free. I've heard a lot about the subject, and I previously wrote two posts about them: [Free Monad](/understanding-free-monads) and [Freek and Free Monads](/freek-and-free-monads) as a result of my research around the concept.

But these posts approached the subject in a very theoretical way; they described how to build a Free Monad and potential applications, but you don't really understand something until you have used it in production or, at least, in a realistic environment.

This is my first *real(ish)* experience using Free for something more than a proof of concept, and as such I may have missed something obvious. If you believe so, please contact me via twitter ([@pvillega](https://twitter.com/pvillega)) as I'm very keen on fixing gaps in my knowledge :)

## The Implementation

Releasing your code to the public is scary, isn't it? Oh, well, [here you have it](https://github.com/pvillega/stockfighter). The code took longer than I wanted, as during its conception I realised several misconceptions I had regarding Free Monads and their implementation. I also experimented a bit with unrelated stuff which delayed this post *slightly* more. Ah, shiny baubles...

You may want to start by opening `Introduction.scala` and reading it top to bottom, as it exposes the API and usage cases.

If we ignore all the stuff not purely related to Free Monads, there are three files to focus on: `LogApi.scala`, `TradeApi.scala`, and `TradingAppHelpers.scala`.

### The Free Monads

Files `LogApi.scala` and `TradeApi.scala` implement the Free Monads for the library. I won't enter into the implementation details as they should be straightforward, and you can refer to my previous post on [Freek](/freek-and-free-monads) for guidance.

What I want to discuss is: why these two DSL and not more?

We can argue about the abstraction levels, but I've come to these two as a natural evolution of the API. My initial idea was to build everything based on Free. When I say *everything* I mean it: my http calls would be a Free DSL (Get, Post, etc). Logs? Free. Free all the way down (and then turtles). It even sounded easy: Freek [examples](https://github.com/ProjectSeptemberInc/freek/blob/master/src/test/scala/AppSpec.scala) showcase a Log and Http DSL, so why not?

Well, it may be possible, in fact it's my next aim (v 2.0?) to experiment more around this area. But it makes things more complex than needed.

Let's take an example: Http DSL. Given the way natural transformations work, and that you want a generic DSL, you'll end up with two DSL for your Http calls: a *request* one and one to manage *responses*. This is ok, the problem comes when you want to start defining `TradeAPI` using these DSL.

A natural transformation converts a monad into another. Although Free is a monad, I had lots of problems trying to compile a Natural transformation from `TradeApi.DSL` to `Task` that internally used `Http.DSL`, as it wasn't a one-to-one transformation, but a one-to-for-comprehension transformation. It just didn't work.

The easy solution was to implement the calls in `TradeApi` as for-comprehensions that used `Http.DSL` to define the behaviour. So `buy` would call the corresponding `Http.DSL` helpers, and so on. Something like:

```scala
def buy(stock: String) = for {
	body <- Post(buyUrl, toBody(stock))
	rsp <- DecodeResponse[OrderStatus](body)
} yield rsp
```

At this point, though, we won't have an interpreter for `TradeAPI`, only for `Http.DSL`. And there may be scenarios where we want to go that path. But, in this one, we may as well use our own interpreter for `TradeAPI` that manages the http calls and decoding inside, like a black box. We end up using a single interpreter anyway, but a slightly saner one.

`LogApi` survived because, despite the option of doing the logging within the interpreter, it makes sense to allow the user to document the intention of programs built using `TradeAPI`.

So, in the end, we only need these two. Yes, we could go deeper and replace `TradeAPI` by several lower-level API, but the current form seemed simpler and more usable.

### Helper class

`TradingAppHelpers.scala` is mostly support methods and declarations: it defines the Onion we will use in our program, as well as some common methods like `run` to abstract calling the interpreter for our program and managing the lifecycle of our http client (to avoid leaking connections). I believe the comments in the file suffice to explain the intentions.

There are three parts of its code I want to elaborate a bit on.

#### Onion type

Below we have the declaration for API and Onion, as usual when using Freek to work with several DSL at once.

```scala
type API = LogApi.PRG :||: TradeApi.PRG
val API = Program[API]
type O = Result[?] :&: List :&: Bulb
```

Note that the Onion declaration, `O`, includes both `Result` (an alias to `Xor`) and `List`. Without adding `List` I could not make it compile with result types of the form `Result[List[A]]`.

The side effect of this is that using the Onion causes all the programs to return `Result[List[A]]` results. We can avoid this if we know we won't use a call that return `Result[List[A]]` inside a program. In that case we may avoid the Onion and obtain just `Result[A]` at the end (using `.freek` and not `.freeko`), but I've provided no helper methods similar to `run` for this use case. Feel free to send a pull-request with one ;)

There's a better discussion on the matter in [this issue](https://github.com/mandubian/freek/issues/5).

#### Task Interpreter

Our Task interpreter, the natural transformation from the DSL to `Task`, is declared as:

```scala
def taskInterpreter(httpClient: /*...*/) = LogApiTaskInterpreter :&: new TradeApiTaskInterpreter(/*...*/)
```

In this implementation `TradeApiTaskInterpreter` depends on an `httpClient` to be able to contact Stockfighter. Encapsulating the `httpClient` inside the interpreter is problematic, as we can't control the lifecycle of the client itself. At no point during the natural transformation are you aware that this is the last step (unless you add an explicit *last step* command, but kind of defeats the point). Which means that closing your http connections needs to be done outside the interpreter itself.

I know it sounds obvious, and it is. But the examples I've seen regarding interpreters and natural transformations showcase them as static objects with no dependencies, although the interpreters are the areas where we will perform side effects, like an http request. This mislead me, initially, to try to encapsulate everything inside the interpreter itself. I'm open to suggestions on improving the code, if you believe there's a better way to manage the client.

#### Run the Onion

The code to run an interpreter on a given Onion is always the same, which means we can abstract it:

```scala
def run[A](program: OnionT[Free, API.Cop, O, A], waitTime: Duration = 10 seconds) = {
    val client = new GigahorseHttpClientManager()
    try {
      val interpreter = taskInterpreter(client)
      val taskResult = program.value.interpret(interpreter)
      Await.result(taskResult.runAsync, waitTime)
    } finally {
      client.close()
    }
  }
```

As you can see the function `run` instantiates its own `TradeApiTaskInterpreter` to manage the `httpClient`, as discussed in the previous section.

The relevant part of this code is the type of the parameter `program`: `OnionT[Free, API.Cop, O, A]`. It's another obvious thing, but when I tried to generalise the signature from my existing programs the values `sbt` gave me didn't compile properly due to several implicit-related errors. Freek uses quite a few of them implicits, and you can find yourself in a tangle trying to derive the implicit you need for your program. Next time, just copy this method's signature.

Or, as I discovered a bit too late (to my chagrin) pay more attention when reading the Freek instructions. That type is declared in the Readme file. D'oh!

### The case for Freek

I want to explicitly comment on [Freek](https://github.com/ProjectSeptemberInc/freek), as it deserves all praise I can give it.

My experience building these monads is a vindication for the library. Honestly, if you are going to use Free Monads in your code, add it to your dependencies. Right now. I'll wait. Done?

I tried the Cats approach I described in my old post about [Free Monad](/understanding-free-monads) to implement the API, stubborn in *keeping it simple and using few dependencies*. The pain was real, oh so real, when trying to work with the different answer types the DSL provides.

In fact, it didn't work. Without Freek, the compiler was beating me. No chances, full surrender.

Yes, it is not perfect. For example see [this issue](https://github.com/mandubian/freek/issues/5) related to the return types of Onions. It's slightly cumbersome to having to manually peel responses each time you use the Onion. But given the alternative, I found it perfectly acceptable. And, come on, it's barely version 0.6.0 and improving fast!

If you are a Scala magician at the level of Pascal, Travis, or Miles you may not need it. Otherwise, just use it and spend your valuable time in something else.


## What are Free Monads for

Based on the, arguably limited, experience I've had while building the API and running programs using it there are several things to consider when using Free.

### Free Monads are for API

Free Monads are intended to abstract your API. You define your DSLs, you build a program that uses them, and your construct interpreters to match. They are not for doing business logic, though.

What do I mean by that?

When I read about them, my naive mind thought you could buy a stack of Free on top of Free and only at the end you'd use the interpreter, creating a kind of pure universe untouched by side effects. Crazy, maybe.

Let's start by the fact that Free doesn't (can't?) implement `filter`. This removes the capability of using `if` statements inside your for-comprehension. At some point in your application you'll need to make decisions based on results, and avoiding `filter` gets complicated, fast.

For example, using the API provided try to create a program that buys a stock if the quote is lower than a value, and otherwise sells but only if you have enough shares and doing so would generate a benefit. Most likely you will end up with programs that mix Free statements with non-Free statements. You may argue the API is limited, so how complex do you want it to become to cover all particular once-off cases?

So, Free is great when you define a contract to hide implementation details. Think interfaces that do IO behind the scenes, or other side-effects, or combine calls to several services in one go. But it's doubtful you'll build your application (unless trivial) with *only* Free.

### DDD ready

[DDD](https://en.wikipedia.org/wiki/Domain-driven_design) is popular and you most likely use it. Bounded contexts and ubiquitous languages are a great fit for Free.

Your context is defined by a contract, an API that other components will use. Your logic will often use more than one context to achieve something, for example communicating with Authentication, User data, and Image storage to get the information it needs. Free are perfectly suited for this task.

### Interpreters are your IO Monad

I hear somebody screaming due to this statement. Apologies! But, in a sense, your interpreters can be considered a black box that will have side effects inside, which you don't care much about.

Your Free programs define steps to be done against a certain API, but nothing else. They are pure, no side effects, nothing, just a list of steps. Only when interpreted is when they really do something useful.

This means all the side effects happen in your interpreter. And that is good. We want to isolate side-effects in our codebases, but when trying to do so we may end up with some cumbersome stuff:

> This is your return type: Int.
> This is your return type on microservices: IO (Logger (Either HttpError Int))
> - Credit to [Kris Jenkins](https://twitter.com/krisajenkins/status/762901550696194048)

Jokes aside, we want to push side effects to the boundaries, which means we get horrible return types piling Task on top of Writer on top of Xor on top of any other monad we found. Within the interpreter we don't need that. We know things will happen there, we can be ok with logging and running an IO fest within that black box. Because it's isolated, and won't leak, and we run it at the end, anyway.

And we get a cleaner return type as a consequence.

### Interpreters should be your test target

In the codebase you'll see a blunder I realised too late. Initially I tried to test programs by using an accumulating interpreter that stored the calls to the api in a State monad, returning some default values. This allowed me to compare expected output of the program vs the real output.

The accumulating interpreter can be good to see what happens with a program (print all the calls, to the bottom of the stack), but it's not a great fit for testing due to hardcoded values. I experimented with another interpreter that allowed me to mock expected responses, so I could test most complex values, but this wasn't ideal nor satisfactory.

Then I realised I was approaching it wrong.

Without Free, what I'd usually do is test a method for expected outputs given certain input. And that's what I tried to do here. But with Free your method is nothing. I mean, it's a description, so the test will be fully tangled with the program you defined.

What you want to test is the interpreter, or its core. You want to make sure the output for a given DSL call is what you expect. In our scenario, `TradeApiTaskInterpreter` uses a client to to http calls. The return types are enforced during compilation of the DSL (we know a call to `buy` will return an object of a certain type), but we may want to guarantee we are passing values like `price` or `quantity` correctly, or that if the http client returns an error we are capturing it and returning the proper `Left`.

This is where we want to focus our test efforts, which incidentally reduces the surface of code to be tested a lot, arguably giving us much robust code. Of course, there will be methods that mix Free monads with logical statements (if x call this monad, otherwise the other) which you will want to test as usual. But for methods that only use Free, focus on testing the interpreters.

### Beware the layers

I talked about it when discussing why I implemented the two DSL I chose, but it's worth repeating.

Remember that your interpreter (as a natural transformation) has limitations. Start with the top level API and consider if you need a lower level DSL for your purposes. It may be, as in our case, that a single layer is good enough. It may as well be that you have a case that justifies building your Free on a lower layer.

In any case, stacking Free is not trivial and may cause pain. Thread carefully.

### They are not easy

People talking about Free mention they are not easy and that new teams (or teams without much experience in functional programming) should not adopt them directly. I realised I didn't fully understand the warning when I started using them for this library. They seem easy, they are misleadingly so. But you will find yourself scratching your head many, many times, due to subtleties that arise when using them.

Don't underestimate them.

## Aims achieved?

I have to make a confession: I've not completed StockFighter. I got sidetracked while experimenting with the API  using their test server, so I've only solved the first (and trivial) level. Someday I'll finish it :) I failed that aim.

But it's been an enlightening experiment, which made me realise the limitations and strengths of Free. That said, it's a first step on the path and most likely in a few months I'll revisit this and realise I was wrong. But, hey, learning. Or something ;)

So, yes, Free Monad are useful, but they are no silver bullet. What a surprise, isn't it? Like everything else in IT.

That's all for now, I hope this was informative and useful. As always, feedback via Twitter/Email is more than welcome. Cheers!
