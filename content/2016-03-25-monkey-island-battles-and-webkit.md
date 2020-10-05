+++
title = "Monkey Island Battles and WebKit"
date = 2016-03-25

[taxonomies]
categories = ["development"]
tags = ["lambda", "development", "webkit"]
+++


Have you heard about [AWS Lambda](http://docs.aws.amazon.com/lambda/latest/dg/welcome.html)? Do you like [Monkey Island](https://en.wikipedia.org/wiki/Monkey_Island_(series))? Are you into [Insult Sword Fighting](http://monkeyisland.wikia.com/wiki/Insult_Sword_Fighting)? Then, come along, this may interest you ;)

<!-- more -->

## Backstory

I've been wanting to try [AWS Lambda](http://docs.aws.amazon.com/lambda/latest/dg/welcome.html) for a while. To be honest I've not yet done so due to laziness: my experience with AWS is that it needs more configuration and tweaking than I care for. Give me a [Heroku](https://www.heroku.com/) any day (pros and cons, lengthy discussion for another day).

But going through my 'list of stuff you should read' I recently saw an [Underscore blog-post](http://underscore.io/blog/posts/2016/02/01/aws-lambda.html) by [Richard Dallaway](https://twitter.com/d6y). AWS again, maybe it's time to do something that uses it!

That got me started: sure there must be alternatives, something akin to "Heroku for Lambdas"? Yes, I'm aware AWS Lambdas are simple to use, but well, procrastination... So I started looking for options and I landed on a [Quora question](https://www.quora.com/Are-there-any-alternatives-to-Amazon-Lambda) which pointed me to [WebTask.io](https://webtask.io/).

## Using WebTask

[WebTask.io](https://webtask.io/) sounds exactly like what I was looking for. And, oh boy, it is simple to use!

I followed their instructions to install their [cli](https://webtask.io/cli), which gives you a very intuitive command `wt` with options you'd expect (create, rm, ls). In just a few minutes I had my own endpoint running. Neat.

Now I needed something to test this a bit more. Enter [Monkey Island](https://en.wikipedia.org/wiki/Monkey_Island_(series)). If you have played those games you most likely remember their [Insult Sword Fighting](http://monkeyisland.wikia.com/wiki/Insult_Sword_Fighting) scenes. Even if you didn't play it you may know what they are, due to popularity in certain circles.

Implementing a service that given a specific insult returns the correct answer seemed like a very straightforward task that would let me test the service and find any obvious hurdles. So that's what I built; you can get the code in [my github repo](https://github.com/pvillega/webtask-monkey-island).

The service has a very basic behaviour:

* If you just call the endpoint (GET request), returns a random pair of insult-answer (in Json)
* If you call the endpoint with an `insult` parameter it will return the correct response for that insult
* If you call the endpoint with an invalid/unknown `insult` the response will notify you so

The interaction is all via `GET` requests, and it returns `Json` (no `404` codes for invalid insults). As I said, a very basic implementation to test how hard is to use that service (note: not hard at all). Webkit  provides the tools to implement all this properly, it's just I didn't use them ;)


## Testing the service

I published a Webtask endpoint at:

```
https://webtask.it.auth0.com/api/run/wt-pere_villega-gmail_com-0/sword-fight?webtask_no_cache=1 .
```

Be aware it is under a free plan, so it may be rate limited and disappear in 30 days. If you want to try it yourself, remember the sample code is available in [my github repo](https://github.com/pvillega/webtask-monkey-island).

Let's see how it works. If we run the request without any additional parameter, we should obtain a random pair of insult-response.

```bash
$ curl https://webtask.it.auth0.com/api/run/wt-pere_villega-gmail_com-0/sword-fight\?webtask_no_cache\=1
```

returns:

```json
{
	"received":"Nobody's ever drawn blood from me and nobody ever will.",
	"answer":"You run THAT fast?"
}
```

We can provide a parameter with our *insult* to receive the right response:

```bash
$ curl  https://webtask.it.auth0.com/api/run/wt-pere_villega-gmail_com-0/sword-fight?webtask_no_cache=1&insult=You%27re%20the%20ugliest%20monster%20ever%20created!
```

which, as expected, returns:

```json
{
	"received":"You're the ugliest monster ever created!",
	"answer":"If you don't count all the ones you've dated."
}
```

If we provide an insult that is not recognised, like:

```bash
$ curl  https://webtask.it.auth0.com/api/run/wt-pere_villega-gmail_com-0/sword-fight?webtask_no_cache=1&insult=baka!
```

the lambda complains:

```json
{
	"received":"baka!",
	"answer":"Incorrect insult!"
}
```

Working as expected!

# Future Work

To be honest, I just wanted to dabble with this so I didn't put much more effort into it. An obvious improvement is to allow the user to *fight* against the machine, although this would require preserving some state in the server-side.

Fortunately WebTask provides limited support for [storage](https://webtask.io/docs/storage), which could be used to manage score for a given user, storing all the information in a map. But there'll be concurrency issues with very low loads, so it may not be such a good idea after all. Something stateless like [left-pad.io](http://left-pad.io/) fits the lambda model better ;)

As an aside, WebTask mentions in their documentation how their service can be used to enhance the security of your application by hiding api keys and other sensitive resources inside lambdas. It's an interesting concept worth a bit of research, as it may be a good pattern to adapt in your standard deployment.


In any case, that's all for now. As always, feedback via Twitter/Email is more than welcome. Cheers!
