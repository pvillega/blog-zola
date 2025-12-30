---
title: "What's the hype about durable computing?"
publishDate: 2024-12-27
draft: false
categories:
  - "software engineering"
tags:
  - "durable computing"
  - "saga pattern"
  - "event sourcing"
  - "data integrity"
---

Durable computing has emerged as a topic in systems design. It may just be my bubble, but it feels as if, suddenly, AI stopped being the next big thing and durable computing is going to solve all our problems.

I've also noticed some misunderstandings about the concept. Thus, I'm taking this chance to pen some explanation on what durable computing is, and why you should care. Or not. Let's start.

## The process to durable computing

I believe it is very important to understand the technological steps that brought us a technology. Otherwise, you end up with people not understanding that LLMs have randomness at their core. So I will start by tracing the origins of durable computing.

The first appearance of durable computing is something you are likely familiar with: database transactions. Jim Gray's seminal work on transactions and two-phase commit in the 1970s built the foundation for the first transactional systems with ACID semantics.

Transactions are a self-contained sequence of steps that either _all_ happen or _none_ happen, guaranteeing that the data stays consistent no matter what. This is also the core idea behind durable computing: preservation of state, and managing failure gracefully so that state doesn't degrade.

The next step came with the workflow engines of the 1990s. Microsoft BizTalk and similar products moved from handling atomic operations to managing long-running processes that could span arbitrary amounts of time. Like with transactions, these workflow engines are still in use. The concepts behind them are the foundation of a lot of current tooling, like some products for microservices orchestration.

This was a big step (pun not intended). At this stage, we don't rollback a few operations; we track state across multiple tasks, which may include interactions with other systems and human approval. The complexity is readily apparent, as we need to be able to respond to events and correct errors in the middle of a workflow without corrupting the state.

The issue with workflow engines is that they are complex products. There are tradeoffs to using them. This meant that some developers looked for simpler alternatives, and they found them when message queues (like RabbitMQ) and the Event Sourcing pattern started becoming more popular. Together, they enable a developer to achieve durability by ensuring message delivery even on consumer failure, while reducing the complexity of maintaining the system.

This change has some nuance, though. We move from a single monitoring system to multiple independent systems. Each service may use a database to handle internal state via transactions, maybe using STM (Software Transactional Memory) libraries. Communication with other services happens via queues, in asynchronous fashion. With both, we achieve durability and decoupling, and each piece is simple to manage. But it is harder to get a view of the global state, as it involves more components.

Unfortunately, in some cases, queues are not enough. Some operations must be synchronous. For example, booking a trip. As we enter the era of microservices, we may have distributed transactions that span multiple other services, and the required synchronicity of the operation means we can't use queues for durability.

The solution, and the last step in this evolution towards durable computing, is the [Saga pattern](https://microservices.io/patterns/data/saga.html#example-choreography-based-saga). A mechanism to manage distributed transactions in microservice architectures. Sagas break down long-running processes into a series of smaller, local transactions, each with a corresponding compensating transaction that can undo its effects if something goes wrong.

Sagas are a great insight building on top of all the previous experience. The compensation mechanism ensures that we don't corrupt the state, and we can always retry from the point where a failure occurred. For those using existing durable computer services, this is the pattern that services like Temporal.io force you to follow when you declare a workflow with AddCompensation steps.

And that's how we reached durable computing.

## Is that really it?

Yes, that's it. Durable computing is a simple concept, albeit not an easy one to implement correctly.

Traditional computing operates on the principle that a program's state exists only while it's running. When the program stops, its state is lost unless explicitly saved.

Durable computing, in contrast, automatically preserves program state across failures, restarts, and even machine boundaries.

Need an example? Think Microsoft Word (running locally) vs. Google Docs. With Word, you need to save (or enable Autosave) to avoid losing your progress due to an unexpected crash. With Google Docs, data is automatically preserved, and you can recover without losing state after a crash .

As I mentioned, the concept is simple. The implementation, however, is not. When implementing durable computing patterns, you'll inevitably face CAP theorem tradeoffs. For instance:

- Saga Pattern implementations often sacrifice immediate consistency for availability. When a distributed transaction is in progress, different services might temporarily show different states. This is a direct consequence of choosing AP (Availability and Partition Tolerance) over C (Consistency).
- Event Sourcing systems typically favor eventual consistency, making them AP systems. This means they can continue operating during network partitions, but there's a window where different parts of the system might see different states. This is particularly relevant in globally distributed systems.
- Some durable computing platforms attempt to provide CP (Consistency and Partition Tolerance) guarantees by using consensus protocols like Paxos or Raft. While this ensures strong consistency, it can impact availability during network partitions. Temporal.io uses this approach.

Understanding these tradeoffs is crucial when choosing your durable computing implementation. For example, a financial system might require strong consistency and choose to sacrifice some availability, while a content delivery system might prefer high availability with eventual consistency.

However, the core concept remains as explained in the previous section. It's not a revolution but an evolution, and platforms that market themselves as durable computing solutions are simply making certain choices for you.

## Why should a business care?

The technology spiel is very nice, but in the end, we serve a business. Should it care? The answer is yes. This is important for the same reason transactions are important for a business. You want data integrity.

Some business processes may take a long time and require manual approval of some steps. Others must be synchronous, due to customer expectations or the nature of the process itself. In both cases, data consistency is important. But modern applications consist of multiple services, which make ensuring that consistency harder.

Thus, the concept of durable computing is something important, even critical, to your business. That said, what you care about is the data integrity part. The label, not so much.

Caring about data integrity also surfaces another truth: not all your systems need to be durable, implementing all the patterns we mentioned. Let's not forget that adding compensating mechanisms makes the code more complex, to start with.

Not only that, durable computing patterns themselves add overhead to the system. Event Sourcing adds I/O overhead, event replay can increase latency, and consensus protocols in CP systems (as discussed above) can require multiple round trips.
State reconstruction takes time. Due to all these factors, among other unmentioned issues, it is not unusual to see performance drops as high as 20%. This has direct cost implications, as more (or larger) servers are needed to provide the same service.

There are business processes which are fine with eventual consistency and Event Sourcing alone. For other processes, discarding the full task and starting again may be a valid step. Using durable computing for them can be a waste of resources, both developer time and compute.

In all likelihood, only a few business processes will benefit from durable computing. But for those cases, we want to ensure that we are resilient to errors, and we want to implement all the patterns we can to avoid problems later on.

## Can I add durable computing to my system?

There are many options for you to start using durable computing without having to migrate to a specific platform. Start using Event Sourcing if you are not doing so, and the Saga pattern on relevant operations in your services.

If you are using the JVM, the Axon framework provides a SagaEventHandler annotation, among others, for Saga management. Or you can use Akka, which provides persistent actors which are, in essence, durable computing interfaces.

If you are using Go, there are libraries like [Go-Saga](https://github.com/itimofeev/go-saga) to help you. You will likely find equivalent libraries for your language of choice.

For AWS users, you can rely on [Step Functions](https://aws.amazon.com/step-functions/) as a mechanism for durable computing. Just beware, as at scale they are expensive even by AWS standards. Azure has the equivalent functionality with [Durable Functions](https://learn.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-overview?tabs=in-process%2Cnodejs-v3%2Cv1-model&pivots=csharp).

Users of the Cloudflare ecosystem can rely on [workflows](https://blog.cloudflare.com/building-workflows-durable-execution-on-workers/) in their workers, along with Durable Objects, for durable computing.

As you can see, you probably don't need to migrate to a new platform or learn a new language. It is completely possible to achieve this with your current stack and provider.

There are many new platforms like [Temporal.io](https://temporal.io) that promote themselves as the true way to achieve durable computing. They may be better in some cases, and they will provide bells and whistles that may make the developer experience simpler. Just beware of the costs of adopting a new technology.

An important note on the above: I've seen the proliferation of several services that promote themselves as the only true way to do durable computing. Due to some cursed history I wish I wasn't aware of, I suspect a few are not being honest with their marketing or benchmarks.

That is my way of saying that, please, test your use cases properly. Those services may charge you a premium over what you could already achieve in-house with existing tools. They may be worth it. But don't trust their word at all. Run your tests, your failure scenarios, before you commit to using them. Evaluate if you can do the same in your current platform and stack. Worst case, you are then convinced they fulfill your needs. Best case, you avoid a headache later on, when their marketing reveals itself empty.

## That's all

The concept of durable computing is not a complex concept, nor something as innovative as it may seem at first glance.

It is important for a business. There is also a lot of marketing muddling things, as we are prone to do in the software world. But data consistency matters.

The question is not if you need durable computing. The question is if you need a new platform to achieve it. Avoid all hype, always test and verify first.
