+++
title = "WebAssembly, Rust, and Edge Computing"
date = 2019-05-07

[taxonomies]

categories = ["rust"]
tags = ["rust", "edge computing", "webassembly"]
+++

[Serverless](https://en.wikipedia.org/wiki/Serverless_computing) has been out there for a while, seemingly surviving the hype cycle. In fact it has recently received an upgrade of sorts with [Edge Computing](https://en.wikipedia.org/wiki/Edge_computing). In this blog post I write about my experience using [Cloudflare Workers](https://developers.cloudflare.com/workers/about/) to build a worker that calculates simple linear regression over a set of data.

<!-- more -->

If you want to skip the blog post and just play with the code, download the source of the [linear regression calculator](https://github.com/pvillega/edge-sample) and run it in [Cloudflare workers](https://developers.cloudflare.com/workers/).

## What is Edge Computing

[Edge Computing](https://en.wikipedia.org/wiki/Edge_computing) is a term that has evolved from the original concept. Originally it was coined with the raise of [IoT](https://en.wikipedia.org/wiki/Internet_of_things) and the consequences of having thousands (or even more) devices connecting to your servers for each task. All these connections require network bandwith and server resources, which become expensive given the amount of connections we are talking about.

A solution is to delegate some of these computation to the IoT devices themselves, so they don't need to connect to the server. That is, given a network formed by the server and the IoT devices, we move some of the computations 'to the edge' of the network, to the devices themselves. This comes with its own set of trade-off, as you need a more capable CPU in the IoT devices as well as building effectively a distributed computing cluster for some of your operations, but it reduces the requirements of bandwith and CPU of the central servers.

The term has been coopted by hosting and CDN companies, which now use it to refer to operations resolved in the 'edges' of their own networks, which can comprise hundreds of nodes in several geographical locations. The edges selected to run the computation are usually the edges closer to the user generating the request, which as a consequence reduces latency considerably.

At its core, Edge is just an evolution of Serverless with simplified deployment across geographical areas and reduced latency for the user. The fact AWS offers both [Lambda](https://aws.amazon.com/lambda/) and [Lambda@Edge](https://aws.amazon.com/lambda/edge/) should be a clear hint of this. but with reduced latency for the end user due to having the server in a network closer to their physical location.

## Edge Computing in Cloudflare

The Edge Computing implementation in Cloudflare is called [Workers](https://developers.cloudflare.com/workers/about/). You can deploy workers associated to a domain in Cloudflare, and have them execute on some or all of the requests against the domain.

For those familiar with JEE, they work similarly to Servlet filters. You receive the request and you can decide to either send a response or to forward the request to some underlying service. Note that there is no need for any underlying service to exist, the workers can generate a response by themselves. You can also take advantage of a KV store (currently in Beta).

Your code can be written in Javascript (not Node.js, mind you, but Javascript for V8 engine) or WebAssembly compiled from Rust. If that's your choice, Cloudflare provides a tool [wrangler](https://developers.cloudflare.com/workers/webassembly/) to facilitate working with your code.

## Cloudflare Workers vs Serverless

There are already several articles like [this one](https://www.smashingmagazine.com/2019/04/cloudflare-workers-serverless/) comparing Workers and other offers like AWS Lambda.

Most of the comparisons focus on the following benefits:

- Deployment is as easy (or even easier) as with AWS Lambda,

- Workers are much cheaper than AWS Lambda. Workers bill per request, while Lambda bills for CPU used during the request. Running equivalent code in both can be 10x times cheaper in Workers

- Workers are much faster to start up and serve a request than Lambda, up to 8x times faster in some benchmarks.

Note that some of the benefits like speed are due to the way Workers are constructed, using V8 directly instead of containers. This means you work with a faster but specialised platform in which you will only run  either Javascript or WebAssembly. If you want a platform that can support Go, Python, and others then Workers are not for you.

Another big difference between Lambda and Workers is execution time allowed for your function. In Workers the free tier gives you 5ms of CPU per request, while the top tiers provide 50ms. In Lambda you could take up to 30s to answer a request (although that would be quite expensive given you are billed per time spent). The smaller time windows allocated in workers justify running WebAssembly to make the most of it, but if your calls have to interact with several external components even WebAssembly won't be enough and you should either stay in Lambda or consider if that call should be a function at all.

One area where Lambda has clearly the edge is the dashboard to manage your functions. Workers' dashboard needs some love: I am not able to see the execution time per request on my worker, and tasks like assigning routes to a worker are not intuitive. Furthermore, the editor is only supported in Chrome by default. There's room for improvement here.

Another concern I have with workers is the process for managing QA environments or canary deployments. You can test your worker implementation using `wrangler preview` but I can't find documentation on how to do a proper blue/green deployment with Workers. Given that they sit in front of most of the requests to your app, this scares me a bit. A faulty deployment can have serious consequences.

## When to use Edge Computing

I have to acknowledge that I am skeptical of 'serverless' as I feel it shares the same pitfalls of microservices, where we went from 'everything must be a microservice' to 'give me back my monoliths, please'. But it would be a mistake to ignore [compelling use cases](https://www.troyhunt.com/serverless-to-the-max-doing-big-things-for-small-dollars-with-cloudflare-workers-and-azure-functions/) for which serverless or edge architectures can provide a tangible benefit.

Cloudflare documentation promotes many uses ranging from [hotlink protection](https://developers.cloudflare.com/workers/recipes/hotlink-protection/) to [A/B testing](https://developers.cloudflare.com/workers/recipes/a-b-testing/) to [request aggregation](https://developers.cloudflare.com/workers/recipes/aggregating-multiple-requests/). And as per [this comment](https://news.ycombinator.com/item?id=17447355) [Discord](https://discordapp.com/) is making the most of Workers, using them to serve pre-rendered sites or even to override build artefacts sent to clients.

You usually don't want to run long computations in Lambda, due to overall cost for execution, so the CPU restrictions in Workers shouldn't matter much. In theory, most things you may want to run as a Lambda can be a fit for Workers. In practice there is a big difference: if your functions need to talk to external services, managing those requests may eat a lot of your CPU allocation in Workers.

This means that, as it currently stands, there's a subset of use cases which are not a good fit for Workers. You may want to split your code between both platforms, taking advantage of the cheaper and faster Workers for as many tasks as you can, while using Lambda for operations that rely heavily on 3rd party connections. But, of course, this comes with its own overhead.

## Can we please talk about code?

Yes, let's talk about the code. As a test I've implemented a small [linear regression calculator](https://github.com/pvillega/edge-sample) based on [this blog post](https://cheesyprogrammer.com/2018/12/13/simple-linear-regression-from-scratch-in-rust/).

The idea is to have some functionality that requires a lot of calculations to test the performance of WebAssembly in the Workers environment. Doing a simple linear regression fits the bill as we can work with the data the user sends each request in isolation and without requiring a database to store intermediate results.

The `wrangler` tool that Cloudflare provides creates a template you can use to start building your worker. I won't go over every line of the codebase, but we have the following main components:

Modules `linreg` and `math` are taken from the [simple linear regression post](https://cheesyprogrammer.com/2018/12/13/simple-linear-regression-from-scratch-in-rust/). They are pure Rust code without any changes needed to make it work in WebAssembly, which is great as it shows that we can reuse our Rust libraries for our workers.

The file `worker.js` is where we load our WebAssembly modules using specific API calls like `wasm_bindgen`. It extracts values from the request received, sends them to the WebAssembly function, and returns a response to the user once the regression has been calculated. It also catches errors.

The file `lib.rs` is the entry point to our WebAssembly code, and the link between Rust and Javascript. We use some macros (`wasm_bindgen`) to indicate this has to be compiled as WebAssembly. The code in the `linear_regression` method itself is pure Rust, and we make use of the `linreg` module. Most of it would be standard Rust in another codebase,

The main difference comes in the input and output types for the function, which are not the standard choices for Rust. Currently WebAssembly doesn't work well with `Vec` so we need to define our input parameters as `Box<[f32]>`, which means we need to do some extra work to convert those into the `Vec` structures expected by our modules.

Another issue comes with the output parameters. Rust is not mapping `Vec` nor some structs to WebAssembly when returning them as a function result. As a consequence, if we want to return some complex data structure the easiest solution is to serialise it to Json, which we do using `serde`. Luckily this is not a complex process, but it is something to consider when planning what functions you want to define.

One last question may be: why WebAssembly and not just Javascript? Why to do all this extra work, wiring Rust and Javascript, while we could do it all with pure Javascript?

We talked about performance and how CPU is at a premium in Workers, due to restrictions on execution. That by itself may be a good enough reason. But there is more: WebAssembly has been considered by some as the realisation of what the JVM should have been, a 'write once run anywhere' platform. Given that, it is not a bad idea to use any chance you have to evaluate this stack. If this prediction comes true, you may soon be compiling to WebAssembly all your code.

## Conclusions

Edge Computing as deployed by Cloudflare and other vendors is an evolution of Serverless with its own set of trade-off, on top of the ones you have by using Serverless. Workers allow you to improve performance and reduce cost on a subset of your Serverless calls.

WebAssembly is a great tool for developing your Worker's code. Not only helps you obtain optimised code in a platform where CPU is at a premium, you can potentially share most of that code with the rest of your components.

Unfortunately Worker are currently not a full replacement of platforms like Lambda as they have some limitations, both in user experience (dashboard, blue/green deployments) as in how much can you do within the allocated CPU time.

The expected use case is to move some Lambda functions to Workers as a way to increase performance and reduce cost, while leaving other functions in AWS. If the benefits are worth the extra complexity, that will depend on your specific use case.


That's all for now, I hope this was informative and useful. As always, feedback via Twitter/Email is more than welcome. Cheers!
