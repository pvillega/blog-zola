---
author: Pere Villega
pubDatetime: 2015-12-10
title: Scala Exchange 2015 Day One
draft: false
tags:
  - scala
  - scalax
description: Scala Exchange 2015 is on! I will be updating this entry with summaries on the talks I attended. Typos a plenty, be warned, but I hope this proves useful to somebody while we wait for the videos to...
---

[Scala Exchange 2015](https://skillsmatter.com/conferences/6862-scala-exchange-2015#program) is on! I will be updating this entry with summaries on the talks I attended. Typos a plenty, be warned, but I hope this proves useful to somebody while we wait for the videos to be made available. You can also read my [summary of day two](/scala-exchange-2015-day-two/).

<!-- more -->

# Keynote: Scaling Intelligence: moving ideas forward

By [Jessica Kerr](https://twitter.com/jessitron)

Scala as a language is about scaling. There is an inherent limit on development: what fits in our head (see this [other talk](http://www.infoq.com/presentations/complexity-simplicity-esb) by Jessica Kerr and Dan North). Given that limit, we need to scale outside of ourselves, use our team and community. People learn best in teams, people are not superstars by themselves, great teams create stars.

Most of what we do is not coding, nor learning, but teaching. We teach computer what to do, teach business about their own process (via requirement gathering), teach users via the UI we build, and we teach each other. Reusable code, flexible code, that is learnable code. A good commit message, that teaches what intention is behind the change. Documentation teaches what something does.

We want people in our community as only that way we can scale that knowledge that makes us better. There are two things we need to know about Scala which we can only learn from members and group diversity:

- Clarity: a teacher looks at the context of the learner, appreciates that context and adapts to that to teach. If something is not clear to you is not your fault, it is being explained wrong.
- Usefulness: if code is not useful then it doesn't matter how correct it is. Determined by aggregate support of the community.

Scala is designed to scale the community. Scala is supposed to be a staircase, to start by using features that make more sense to us and gradually learn more things and advance. But currently you can hit roadblocks due to lack of context when trying to learn something, which forces you to learn stuff you do't care about not or you are not ready to tackle.

You should write blogs, even for very basic information. Writing blogs helps less experienced people to find solutions to problems when they Google the error and they learn why something is that way. If many people do this we accelerate the community and help moving to next step in the language.

Documentation written by leaders or experts of a community that know too much on the subject is too sparse as they have too much context. They can't scale a community themselves. New joiners, with less experience, can help because they can identify what context is needed for an explanation. Scala can be hard, don't feel stupid for nto understanding! Write and collaborate.

Your contribution is valuable. If something (blog post, stack overflow question) helps you, writing a post pointing to it and saying that helped you and how it was useful makes Google raise its relevance and helps the community to find it easily, helping all. Writing that makes you part of Scala. A language by itself doesn't do anything, Scala is part of a programming system that includes libraries, tools, editors, AND the community.

We can learn a lot from the Ruby community (and they can learn about language form us :P) It is a community that has scaled and it is still growing, still writing very useful software in it. We can learn on how they interact with each other, we can bring the same community scale to us.

We can learn things like:

- Scala values evolution vs stability. Ruby solved this dilema because libraries have a lot of maintainers, so they can be upgraded and evolve while being stable. In Scala with Typesafe, Typelevel you are still good. But other groups (Twitter, Foursquare, etc) which have few maintainers you are at risk, you don't know when will they use newer idioms.

- What is idiomatic scala? Still not clear, everybody's Scala is different, and we spend time arguing about this while people leaves the community. We need to find a way, and only the community can do that, no one can tell us, no other community can offer us the solution. Ruby found a way to solve this issue and developed common idioms, we can too. Ruby spent time where people was reading each other's useful code (business code, not library code), which helps spreading knowledge.


You should approach code with humility and respect for the reader. Be a teacher. For example: always include imports on your code examples and be explicit on the imports you use (not just ._). Give context.

Beware symbolic representations.They make things harder than necessary. Words are clearer than symbols and can be Googled, so really make sure that symbol is necessary. Naming in scala is a very strong asset, we should use this power more. Naming is hard, but then if it is hard, do it more! It is hard because you need to think about the problem you solve. So do it.

Avoid words like simply, obviously, etc... They tell you are supposed to know something you may not know. As a teacher, help the students by being more clear, providing links, helping to set a context for the action. Use

Use Stack Overflow. Write blog posts. All that helps the community. We need to discuss not only the language and FP but also code style, tools, etc. Don't just show syntax, teach me why is that option better, what is the concept behind. Make documentation better and more complete.

Accept help from newer users. Saying 'no, that is not the right way' to a pull request you have closed the door of the community to that person. Accept pull-requests, even more so for documentation. If it is not great, help that person to improve but don't shut the community's door to new joiners.

Assuming context or acting like someone is stupid for not knowing context is a bad idea. That will alienate people and hurt us as a group. Don't define scala documentation in terms of learn you a Haskell. If you learn scala you want to learn Scala in Scala's context, asking me to learn Haskell is not the way. Don't ask me to learn category theory to write a useful business application. Give me the context I need to do what I want.

Finally, publish boring Scala code that teaches business domain and how to build useful things to the community. Use that hashtag  #blueSkyScala to spread that knowledge to the community.

***

# Functional Patterns for FP beginners

By [Clément Delafargue](https://twitter.com/clementd)

(Note: you should watch the video once released to see more detailed examples on the concepts)

Functional programmer, day to day work with Javascript, but what I learned from Scala helped to write better JS. This talk is about simple patterns for FP. Not common abstractions like Functors or Monads, no Category Theory, but the tools we can use to build these abstractions. This is a way (of many possible) to do these things. Customise it to your needs.

Scala documentation in FP refers mostly to Haskell documentation, but if you don't know Haskell that is a problem. Here we want to avoid that and focus on common FP patterns.

FP (functional programming) being 'programming with values', where everything is an expression and you tweak values to get to the desired result. For example `if` is not a block anymore, is an expression that returns a value. Pattern match is not a substitute for switch, is a way to produce a value.

We have Typed FP in Scala. All your expressions have types and you can type check the results, letting the compiler check the control flow and ensure correctness.

## Algebraic data types (ADT)

We use Algebraic Design, where you start with values, combine values and get desired values. Your workflow is data driven. So how do we model the data? Via Algebraic data types (ADT).

Algebraic because they have two properties:

- Product types: compound type created by combining two or more types. Example: Tuple; case class User(name: String, age: Int)
- Sum types (or Co-products): a simple example is a Json value, which can be either a string, object, array or number. A Sum type is a group of values. In Scala this is implemented via a `sealed trait` and we use pattern matching to work with them (deconstruct and inspect structure). Example:

```
sealed trait JsonElem

case classe JsonBoolean extends JsonElem

case classe JsonNumber extends JsonElem

```

Pattern matching raises compiler warnings if you forget a member of the Sum, which is handy. In Scala you can also combine Sum types to share elements across types. An example is Json is 'root elements' or Json values (which can be only object or array) vs all possible Json elements.


```
sealed trait JsonElem
sealed trait JsonValue

case classe JsonBoolean extends JsonElem

case classe JsonNumber extends JsonElem

case classe JsonObject extends JsonElem with JsonValue

case classe JsonArray extends JsonElem with JsonValue

```

OOP makes it easy to add cases, while FP makes it easy to add functions. Compiler helps in both cases, but there is a trade-off for the developer. Thankfully in Scala you can choose the way you want to implement things as it gives both options.

Should you hand roll your own ADT or use generic types (like tuples or Either)? ADT are preferred unless you are deconstructing the result right away, as when the application grows your own ADT will help you more (compiler works for you).

Sum and Product types keep properties of mathematical sum and product, like associativity, exponentials and factorisation. We have neutral value (Unit). For example:

```
A * 1  => A  and  (A, Unit) => A
A + 0  => A  and  A | Unit => A

(User("Me", 27), Pet("cat"))  and  UserWithPet("Me", 27, "cat")
// more examples in the video, watch it
```

These are equivalent but one gives more information via types:

```
sealed trait X
case class Bad(v: String) extends X
case class Good(v: String) extends X

case class Y(v: String, isGood: Boolean)
```

Please void booleans in ADT, you want to use the types to provide information. Types make you more precise and allow compiler to type check.

ADT are used to do Domain Driven Design, where you observe your data and build domain based on that. Much better than POJOs.


## Programming with Contextualised Values

We can program expressing into types if a computation failed, is asynchronous, etc.

### Error handling

`Option` type is useful when only one thing can go wrong. For example when you parse String to Integer, there is no need of extra precision. It is simple to use, but restricted, if many things can go wrong you are losing information.

`Either` is a Sum type (Left -> Error, Right -> value) which allows you to handle several errors cases. Please use ADT to describe errors as Strings provide less information on the error type. With ADT you can handle all error cases. Beware `Either` is not biased in Scala and doesn't work too well with type inference. You can use `Disjunction` from Scalaz which behaves better and it's biased (defaults to Right and provides flatMap operation to use inside a for-comprehension).

If chained, both `Either` and `Disjunction` fail on the first error. Sometimes you want to accumulate errors, then you should use `Validation` from Scalaz. The error list is a `NonEmptyList` to ensure we have error messages on failure.

Sometimes you want to accumulate errors, some times you want to fail on first error. Don't flatten your errors, decide what is what you want.

### Extend types

Type `Monoid` allows you to combine 2 values and provides a neutral element. With subclassing you can't declare a Zero element or extend Standard library classes (they are final). The workaround is to use `traits` that provide the desired behaviour and that you pass as additional parameter to functions.

To avoid the work of explicitly passing that new type as a parameter, you declare the new type as implicit so the compiler autowires the proper implementation. Just be careful with Typeclass convergence where a type could have multiple implementations of the same behaviours, which causes problems.

Simulacrum library helps you creating typeclasses and boilerplate for these types.

(see examples from the talk when the video is published)

Recommended to read Cats code as it is simple code and will help you understand.

Final tips as we are running out of time:

- Use property testing for everything
- Separate effects from logic (Free Monads?)
- Read FP in Scala book

***

# Building a CQRS application using the Scala Type System and Akka

By [Renato Cavalcanti](https://twitter.com/renatocaval)

Content of talk comes from current work done by Renato for the Belgium Government, so real world problems and lessons.

CQRS: the idea behind is to have 2 objects, one which accepts commands and produces events, another object which receives the events and generates views on the model. If you don't use event sourcing you need to produce event and save both write and read model in same transaction, otherwise you will lose event and data. If the commit fails, you have a problem. That is why event sourcing is important, as events can be stored and replayed.

## Command

Replaying events is very powerful, as you can use the stored events from production in a test environment to check all your components work as expected and produce the desired results. Facilitates verification of code.

The talk will show how to use CQRS in Akka, please watch video for full code examples. The examples uses mostly Akka-Http and Akka-Stream, two solutions for pretty well defined domains that help building the solution. The problem with Akka is that Akka is in fact a function to => Any, which means you lose type safety and has its own problems.

The solution is to build something on top of Akka that isolates you from these issue. You find the building blocks of a CQRS system, following DDD: `DomainCommand`, `DomainEvent` and `Aggregate`. These are traits that help you define your building blocks.
We also define some functions to validate events (which return a Future) and to construct Aggregates from DomainEvents.

That solved, we have another issue to tackle. We need to persist the events, which we can do via Akka Persistence. We don't store the message received in the actor, but the event generated as reaction to that message. If an Aggregate (implemented as an actor) is restarted, it can recover its status from reading the chain of events in the event-store.

But for all this to work we need a Protocol, a set of command and events for a given Aggregate. We also define the Behaviour (mapping between commands and events). We can create a DSL to facilitate generating Behaviours for an Aggregate.

[Renato now shows code showcases the implementation of a Protocol, the corresponding Behaviour DSL and an Aggregate. Please watch video for more details]

If I have Aggregate, Protocol and Behaviour then I can create an AggregateManager, an Actor, that creates AggregateActors and manages its life-cycle. Your AggregateService is fully typed, via the protocol, and the Manager abstracts the Akka details from you.


## Query

The Query side is about reading the events and producing Views on the data. We use Akka Persistence Query, an experimental feature. An actor generates a Projection from the events, so we don't need to recalculate the status every time (snapshot-style). Each projection has an id to identify it and provide versioning. The actor doesn't accept new events while generating a Projection, only after it has finished.

[Renato now shows code of the Query part of the system]

The Projection object is not typed, as usually you handle multiple events in a single projection. A future improvement is to strongly type projections, but not there yet. A Projection also has more data than the Aggregate stores, as there may be inferred data that is valuable for the business when viewing data, but we don't need to store explicitly.

The DSL used by Renato also provides methods to `watch` a Projection, so we can detect events and, for example, wait until all events required are received before generating a projection result.

## Takeways

Given a Protocol, Behaviour and Aggregate then you can have an actor that understand the life-cycle and a fully typed AggregateService.

Command validations can usually be asynchronous, but events must be pure and always succeed.


***

# Keynote: Without Resilience, Nothing Else Matters

By [Jonas Bonér](https://twitter.com/jboner)

If your application is not available, doing something useful, nothing else matters: quality, speed, etc.

"It isn't about how hard you hit, is about how hard can you be hit and keep moving forward. [...] That's how winning is done." (from Rocky Movie)

Fault tolerance is not enough. Resilience is beyond fault tolerance, and it's all that matters. Resilience is the ability to spring back into shape, to recover quickly from difficulties. Software today can be incredibly complex, and we need to understand resilience in the context of these complex systems.

A complicated system has multiple small parts that interact to do something. It can be understood, although it is hard. A complex system is made of many similarly interacting parts with simple rules (ala Game of Life). Those rules define emerging properties which are impossible to understand. You can understand individual rules, but not the full interactions and outcomes. Complicated is not the same a Complex.

Complex systems run in degraded mode. Complex systems run as broken systems. In a Complex system there is something failing somewhere, always! And humans make things worse, as complex systems are counterintuitive and when we use intuition we usually end up worsening the existing issues.

Complex systems operate at the edge of failure. There is the economic failure boundary, where you can run out of business. There is the unacceptable workload boundary where you can't cope with the work. There is the accident boundary, when an undefined event causes us to fail. The operating point moves between these boundaries, and if it crosses one of them we fail.

This means we have 3 pressures on the operating point. Management tries to minimise economic failure, workload tends to least effort, and as a result we are pushing the point towards the accident boundary which is undefined. We try to counteract with tools, systems, but this keeps happening as we can't understand all implications. The only solution is to add an error margin to protect us from failure, so when we get into dangerous territory we can act before we fail.

The problem is that we don't know much, if anything, about the failure boundary so it is hard to define a proper error boundary. And we keep pushing it closer to the failure boundary as the system looks stable to us, until the point where the boundary is not helping anymore and we fail.

We must embrace failure. We know complex systems always work as broken system, so we need to accept failure as normality. We must understand that resilience is by design, it can't be bolted in afterwards.

"In the animal kingdom simplicity leads to complexity which leads to resilience". Complexity may help building resilience. Another example on how complexity builds resilience is how the current world protects us: it feeds us, give sus shelter, etc. And it is very complex. So we can learn about resilience in both biological and social systems:

- Feature diversity and redundancy
- Interconnected network structure
- Wide distribution
- Capacity to self-adapt and self-organise

How does this apply to computer systems? We need to change the way we manage failure. Failure is natural and expected. One way: Let it crash, like Erlang does.

So we have Crash Only software (name of a paper). Stop is equal to crash safely. Start is equal to recover fast from a crash. We can apply this recursively and turn the big sledgehammer into a scalpel to tolerate failures at many levels. It is recommended to read the paper.

We need a way out of the 'State Tar Pit' (another paper). A lot of failure is related to data (partial data, wrong data, etc). We have input data, provided by customers, and derived data, data we compute from the input data. The critical one is input data, that we need to keep and take care of to avoid annoying users.

In the traditional way of managing state a error at the end of an input path will cause all the path to fail and we will lose the input data, which is an utterly broken way to manage this. We react to this by abusing defensive programming, adding try-catch blocks everywhere, etc.

"Accidents come from relationships, not broken parts." A Sane failure model means that Failures need to be:

- Contained to avoid cascading failures
- Reified as messages
- Signalled asynchronously
- Observed by at least 1 actor, up to N observers

Basically, the bulkhead pattern used by ship industry. If a compartment breaks the ship is not affected. But we can still do better, by adding Supervision: observe and manage failures from a healthy context. Components that fail should notify the Supervisor so something can be done about it. An 'Onion Later State & Failure management' or 'Error Kernel pattern'. The kernel delegates all work and supervises so the task is performed correctly, managing any errors as necessary. We apply this recursively, with a layer managing failures of the underlying level.

We can't put all eggs in same basket. We need to maintain diversity and redundancy. Servers crash, AWS goes down. We need multiple servers, even multiple data centers, which means running a distributed system. And they should be decoupled in time (to enable concurrency) and space (enables mobility of nodes). This gives a very solid base for resilience.

We need to decompose systems using consistency boundaries. We need to think about isolation of components. We need to start with the weakest consistency guarantees we can, and add stronger ones as we go if we need them. The less ACID and coordination you need, the better. Within the boundary we can have strong consistency (example: actors are single threaded with an inbox). Between boundaries it is a 'zoo', all bets are off, we need to manage failure as described above. But that is good, as weak coupling and other properties of the 'zoo' enhance our resilience.

Remember: strong consistency is the wrong default, it adds too strong coupling, but what we need is to decompose systems and create safe islands (consistency boundaries).

To conclude, let's talk about resilient protocols, the way to manage the 'zoo' outside consistency boundaries. They depends on asynchronous communication and eventual consistency. They must embrace ACID 2.0 (Associative, Commutative, Idempotent, Distributed); they must be tolerant to message loss, reordering, and duplication.

Remember: Complex systems run as borken systems. Something is always failing. Resilience is by design. Without resilience, nothing else matters.

***

# A purely functional approach to building large applications

By [Noel Markham](https://twitter.com/noelmarkham)

This talks follow a bit on his talk last year about 'Introduction to Scalaz'. We will look at tools and techniques and how to do things in a more purely functional manner. (Talk will be heavy on screen-coding, so please watch the video! I will try to summarise the concepts explained, but without seeing the code it may not make too much sense)

Start by breaking rules and using `import scalaz._; import Scalaz._` and other generic imports. Sorry Jessica Kerr ;)

Starting point are a couple of API which are not too flexible but we can't modify, they are external API.

First concept: let's talk about [`Markov Chains`](https://en.wikipedia.org/wiki/Markov_chain). We want to build a structure to, given 2 words, try to guess what would be the next word and a function that would use that to generate possible sentences. We could use a method that returns a `Future`, and use `Await.result` over the external API and then use the result to the generator. We can improve that by using a for-comprehension.

We can improve the code more by extracting the configuration. Side concept: we can compose functions (f andThen g), but a function can be considered a Functor, so it can be mapped over! So we can group all our configuration into a case class and create functions `Config => String` or `Config => Int` to extract config. And we can group those functions to extract several values at once. We can go further and use functions as Monads to extract config (via the functions) using a for-comprehension.

Given all we did above, we can create functions that given a config (as a parameter) return a function that will return what we want (tweets, other data). We can do the same for the string generator, to make it depend on config. And then we can use both in a for-comprehension as functions are Monads, although we still have the Future type around.

We can tackle that Future type by wrapping the function with a Reader type. Then we need to understand the concept of Monad transformers, which allows us to *unwrap* a monad to interact with it's element. For example, given a `Future[Option[Int]]` we can interact with the `Option` directly, without having to call a method in `Future`. In Scalaz that would be `OptionT[Future, Int]`. Given Monad transformers, we can then work with `ReaderT` which will allow us to ignore the Future in our methods until we really want to. This gives us a `ReaderT[Future, String, Int]` which allows us to work with all the elements of our computation independently ([kleisli](https://en.wikipedia.org/wiki/Kleisli_category)).

Going back to our example, we can then change our functions to become `kleisli` for `ReaderT[Future, Config, List[Tweet]]` or `ReaderT[Future, Config, String]`. We have separated constituent types and we can deal with each one as we need to. Which helps us produce a very sane for-comprehension, very legible and understandable. And we get as result a `Future[String]` but that is at the end of the calculation, so we block at a point after we defined all the task to do, decoupling task from execution.

An advantage is that this makes this code easier to test. Our methods take functions as arguments, a home-grown dependency injection system where we can plug anything we want (respecting types!) so we can test the code without interacting with 3rd party services or doing other steps of the process. No need to mock, just use simple stubs.

A suggestion to test is to use ScalaCheck. With ScalaCheck you suggest properties for your code, and the framework makes sure your properties hold by trying to find values that break them. (Also adding a dash of Shapeless, because why not). With this we can, for example, make sure our code doesn't modify the text of the tweets in any way by default.

We can still do better, let's try to abstract over ReaderT. Right now we are only using ReaderT as Mond, so we may as well replace it by `M[List[Tweet]]` and `M[String]` on our functions. Our for-comprehension doesn't change, but it has other benefits. For example, our test code can be simpler as we can use the `Id` (identity) monad to generate values.

Let's say we now want to add logging to it. How can we tackle this? Let's assume we are given a method `log` that returns a `Future`. We can integrate this as a parameter `String => M[Unit]` and we are done. Except we don't like side-effects and `Unit`. We can wrap the log in a `Writer` which allows us to do an operation and do an additional operation into a secondary store (basically, a log). With this we replace our `Reader` by `Writer` to integrate the logging, but both are Monads so the signatures and for-comprehension don't change, only implementation details. (Note: I may have missed some detail in that last part! Check the video.)

After all this process, we found nice ways to provide configuration, wire functions (akin to dependency injection) and abstract over Monads, all by leveraging the power of libraries like Scalaz, Shapeless, and ScalaCheck. And by using the libraries you reduce boilerplate and make code easier to understand.

**Important Note**: you really need to see the slides with the code to follow the talk fully, very recommended talk if you are interested in FP.

***

# Exploiting Dependent Types for Safer, Faster Code

By [Jon Pretty](https://twitter.com/propensive)

This is an advanced feature of Scala's type system. Not difficult to use, but writing libraries that use them can be complex.

The 'Slippery road' represent a dynamic language, where you can't control the types and you have no guidance. Throughout the talk an example library will be used: Raptured command-line.

Example: a bash command

```
ls -lah --sort time --width=120
```

We would like to convert that to Scala. We can try to parse the arguments into Scala values. We may even specify a type parameter so the parsing doesn't return a String but an Int. We may want to use several representations for a value (-s, --size). All this an be abstracted further into a value of type `Param[Int]('s', "size")`. Nothing too exciting.

Let's stash that for a moment and talk about Rapture I18N, a library to support I18N Strings in apps. The standard solution is to use string bundles, one per language, managed separately from the code itself. But what if you forget to add a translation for a sentence in a language? You get a runtime error. Rapture I18N embeds the languages in the source and makes the compiler check for completeness.

(Some examples of Rapture I18N follow)

A type behind Rapture I18N is:

```
class IString[L1] {
	def |[L2](that: IString[L2]): IString[L1 with L2] = ???
}
```

That gives us a type intersection, a type per language, and we track the contents of an IString as if it was a map of language type to string. The intersection type `En with De` means the type is both an `En` and a `De`. In Scala we can create an intersection between any two types, for example: `Int with String`. A type can exists even if we can't have instance of it.

These kind of types are called `phantom types` which exist purely for compiler benefit, they will never be instantiated. After compilation they get erased, they don't exist in bytecode (type erasure). But the compiler can use them to enforce constraints on other types and to drive implicit resolution.

For example we can use the constraint enforce to make sure `sayHi[Ru]` will fail compilation if we didn't define a `Ru` version of Hi. We can do that by requiring a supertype of the phantom type `V >:T`. Given `En with De`, `En` is a supertype and will compile, but `Ru` is not a supertype and it will fail compilation.

As all accesses are checked at compile time, we know they are safe operations and total functions, which we know won't fail. But we don't know which times we are going to access at compile time, we will know at runtime time. How can we convert the string indicating language from the user into a type? What if they send a request for a language that doesn't exist?

We can write parsers like `(en | de).parse(inputLang)` which becomes the only point of failure at runtime. We can't avoid that, but all the rest of the code has been checked at compile time, so we know we can handle the exceptional cases in there and do not worry anymore about I18N types. Narrowing failure points is good for programming.

(Quick demo on Rapture I18N follows)

After the demo, back to the Command Line problem stated at the start. We want to enforce some constrains on the parameters passed to a command line instruction. We can do it naively via pattern matching and for comprehension, but could do better and try to reduce this to a single point of failure as we did with the I18n library.

We potentially have a complex structure of conjunctions and disjunctions over parameter preferences and alternative representations. We can represent them in Scala types, so `A & B & C` becomes `Product[A with B with C]`. `A | B | C` becomes `CoProduct[A with B with C]`. And then we define combinators for `|` and `&` (see slides for definitions, basically pattern matching grouping parameters into `Product` or `CoProduct` instances). The result will be a complex type built following the defined combinations.

With these definitions we can do as we did with I18N, reducing the point of failure to `parse` (Note: you will need to see the slides/video to follow the code that generates all this, can't reproduce in this summary).

In summary: multiple failure points increase the burden on error handling. Instead we want to handle all failures together, up-front. Use total functions and many more operations are now dafe, with more code becoming free of distracting error handling. We have reduced the surface of failure.

Predictions: dependent types will be increasingly important in the future of typed languages. Work will be around make it easier to write. In Scala, error messages CAN be improved, we can have better tooling to manage them. Hopefully we will have more code that consists entirely of total functions, with very reduce surface for error. Lastly, this additional information provided by the types can offer opportunities to improve performance.

***

# Lighting Talks - Track 1

By [Andrew (Gus) Gustafson](https://twitter.com/ozgus4000) - Making your life easier with macros

Problem: write out a class using snake case JSON field names. By default you need to override a method provided by some JSON library to provide what you want. Or for example, if you want to convert an ADT to JSON, to process the parent sealed trait you need a (potentially big) pattern match for every possible child.

Macros are a simple way to generate this 'boilerplate' code, following a DRY principle. Write macro once, apply everywhere, without duplicating code.

Tips and Tricks for Macros:

- `println` is your friend. Auto-complete too. Keep typing until something good happens
- macro code needs to be in a separate codebase than your domain model

(Code example follows)


# Lighting Talks - Track 1

By [Jamie Pullar](https://twitter.com/jamiepullar) - Handling Partially Dynamic Data

Subtitle: exploring a DSL approach to lenses with Jsentric and Dsentric.

Examples of partially dynamic data:  given a JSON object we validate only fields of interest in the server. Or microservices supporting arbitrary content structures, they only care about specific fields and ignore the rest of the data.

The first challenge: how do we deserialise data to work with it? Use type safe structures (ADT vs Map[String, Any]).

How to extract the data we want? We can use Lenses to extract the fields we want. Lenses allow us to target parts of the data and operate with it. The issue is that it can become a bit unwieldy code wise.

To solve code verbosity we introduce a Contract structure, which defines the structure we care about. Then we can use it to pattern match over the input data (for example JSON) and work with the relevant values, while not relevant data is silently ignored. The Contract allows us to read, modify, and delete the relevant values. Using Shapeless we can improve usability by providing helpers which reduce boilerplate even more.

We can extend the Contract to add validations, as precise as we need (example: age > 0 and < 150). These validations can be type safe. Further extension allows us to build querying over the structures, so we can filter the data. All this is possible because the Contract is abstracting the data structure from our business logic.

Dsentric is custom contract configuration with Monocle.

# Lighting Talks - Track 1

By [Mikael Valot](https://twitter.com/leakimav) - Flexible data structures in Scala

(Talk heavy on code examples, check slides for more clarity)

Project `Strucs`. Case classes are not composable. How can I define common fields only once without using Shapeless records?

Structs enables you to concatenate case classes via `+` operator to generate new types. So you can create one case class per each field, and concatenate to generate a composite type. Compiler checks to avoid field duplication. You can compose these struct types, so having a `Person` and an `Address` you can then have a `Person with Address` that includes values of both.

These compositions can be used in structural types, so you can define a type parameter `T <: Age with Name` to ensure type safety of your operations.

Under the hood, a Struct is a `Struct[F](private val fields: Map[StructKey, Any])`, where all access to the map is via parametrised types, for example `get[T](implicit k: StructKeyProvider[T], ev: F <:< T): T`. This should avoid the issues usually related to using `Any`.

Struct enables us to provide automatic JSON encode/decode via macros.

# Lighting Talks - Track 1

By [Nick Pollard](https://twitter.com/nick_engb) - More Typing, Less Typing - Driving behaviour with types

Scala has a very powerful type system. What is it good for? Usually we though about Validation, what about generating behaviour? We do that all the time, for example when we overload methods or we use Typeclasses.

Typeclasses revisited: interface across type, common capability but varied behaviour by type. Each instance provides behaviour, implemented using `trait` and used via `implicit`. Instances are defined as implicit values and def. Implicit def can take another implicit as parameter.

When searching for an implicit the compiler can chain successive implicits if it will produce the required type.

How can we handle more complex types via implicits? We need an algebra for types. An algebra is just a group of objects and operators you can use on those objects. Like numbers and mathematical operators, or types and type operators.

How do we operate on types? What is a type? A type can be seen as a set of values. Example: `Boolean` is `Set(true, false)`. `Char` is `Set('a', 'b', ...)`. So we can use Set operators, of which we care about two, `product` (cartesian product) and `coproduct` (also named disjoint union, like Scalaz \/, or sum).

With this we can express types in the terms of operators. `Option[A] = () \/ A`.

If we can model types as operators in simple types, we can construct typeclasses from that. This is what Shapeless does for this.

Shapeless uses HList (heterogeneous lists). Equivalent to nested tuples `(A, (B, C))`. The base case is HNil, we can recurse over the list until we hit HNil. Shapeless also provides CoProduct, similar to Tuples of `\/` (simplifying).

How is that useful? It allows us, for example, to generate parsers for any type of case class by treating them as HList. Shapeless automatically turns ADTs into HList (it has implicits and macros to do that). This reduces boilerplate, we write a generic parser once and we can apply it to any present or future ADT we use.
