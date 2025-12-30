---
title: "The Cloud Exit Mirage: A Practical Guide to AWS Alternatives"
publishDate: 2024-11-12
draft: false
categories:
  - "software engineering"
tags:
  - "aws"
  - "cloud"
  - "cloud alternatives"
  - "cloud economics"
---

There's a trend that has been going on for a while now. Companies [announce](https://ziglang.org/news/migrate-to-self-hosting/) they are leaving "The Cloud" (meaning, usually, AWS), for huge savings. This seems counter to all they have ever told us about the benefits of the cloud. But a lot of people seem to be copying the cool guys. In an industry where new trends get adopted without a second thought that is not a surprise.

Understanding that you are not copying trends thoughtlessly, then the question is: should you do it? And, if so, where should you go? In this post I'll summarise some of the reasons why the Cloud has lost its appeal for some companies, and what alternatives there are.

## The incumbent

"The Cloud", in effect AWS and a sprinkle of GCP and Azure, have dominated the landscape for many years. There is a generation of developers that have never known a world without it: EC2 came into public beta in 2006\. 18 years ago.

I'm not going to rehash [the history](https://techcrunch.com/2021/08/28/how-amazon-ec2-grew-from-a-notion-into-a-foundational-element-of-cloud-computing/) of the first services offered by AWS, like EC2 and S3\. What we need to remember is what was the status-quo at the time. When you needed a server, you couldn't just get one. You had to buy one of [these](https://www.delltechnologies.com/asset/en-us/products/servers/technical-support/poweredge-r260-spec-sheet.pdf), get it delivered in a few weeks if lucky, get space in your data center, and go to install it. Compare that with doing a few clicks on a website and waiting 15 minutes. It was revolutionary: cheaper and faster than the current way of working. 

The cloud had another benefit: it allowed turning CAPEX into OPEX. Not long after, the post-2008 financial crisis period and the ZIRP environment started. That meant it was a better choice for companies to use the cloud. This is important: capital preservation was a key motivation for moving towards the cloud

But, as the Cloud became more and more popular, complexity arrived. Over a [hundred new services](https://www.youtube.com/watch?v=BtJAsvJOlhM) in AWS. <a href="">Kubernetes</a> release. Serverless. In the meantime, no real competitor appeared for AWS, with GCP and Azure still far behind in market share even today. All this had consequences.

## The broken promises

The cloud delivered value, that can't be argued with. Many companies wouldn't be possible without it. Why, then, this growing disenchantment with it?

First of all, it would be unfair to not acknowledge that the customers themselves share some of the blame. As I mentioned before the industry loves copying, particularly anything that big tech does. This is how we ended with companies using Hadoop or Spark for Big data, despite their big data fitting in memory in a single machine.

The core of the issue is that the original promises of the cloud are currently not true. The AWS cloud was a better and cheaper way to provision servers. That's not such a clear proposition anymore, at least with the hyper-scale cloud.

The first big issue is the value for money proposition. The [instance types page](https://docs.aws.amazon.com/ec2/latest/instancetypes/co.html) in AWS shows that a C5.large instance is using a CPU architecture from 2017, with 4Gb of RAM, at $0.085. For comparison, Hetzner offers a server with a CPU from the same year and 8 GB of RAM at €0.0238 ($0.03 at current rate). For the $0.08 that AWS costs, you can get dedicated servers with 64Gb RAM and a CPU from 2023. This server performs 2x better in single core tasks, and 40% better in multithreaded tasks. I'm [not the only one](https://www.linkedin.com/posts/anilgarggiit_recently-during-a-cloud-implementation-for-activity-7232650822491238400-4JEw/) noticing the disparity.

As we can see, you get a much worse deal with AWS. Hetzner is one example, but there are other providers (Digital Ocean, Linode, Vultr, and so on) with the same advantages. Yes, Amazon has saving plans with use commitment, but it is not the only platform that offers that.

The cost issue goes further than that. AWS surprise bills are not uncommon, to the point that there are [articles](https://www.lastweekinaws.com/blog/an-aws-free-tier-bill-shock-your-next-steps/) explaining what to do when it happens. And the billing can be so confusing that whole [companies](https://www.duckbillgroup.com) exists to help you manage that part of your operations. To be fair, runaway costs are [not exclusive](https://x.com/shoeboxdnb/status/1643639119824801793) to AWS, with some serverless providers being another notorious culprits. But it is a big risk for a smaller company.

And now that I mention serverless, there are also broken promises with serverless. Serverless should be about not caring about scaling your app, either up or down. The price per hour is more expensive, but you only pay for the real use. So it ends up being cheaper (unless you have 24/7 use, in which case you want an EC2 instance). That should mean that the service scales down to 0 when no one is using it. That is [not always true](https://www.lastweekinaws.com/blog/no-aws-aurora-serverless-v2-is-not-serverless/).

This muddling of the name comes along another issue, specific to serverless in AWS. The proliferation of services mean you may end up with architecture diagram like this one:

![](https://d2908q01vomqb2.cloudfront.net/ca3512f4dfa95a03169c5a670a4c91a19b3077b4/2019/10/11/main_architecture_diagram.png)

Proponents of serverless argue this is exposing the real complexity of the app. It may be, but these components add very strong coupling and contribute to vendor locking. Additionally, all these extra services are billable. In several cases the billing rules are arcane. The end result is an increase of the cost of running the application.

To summarise: the cloud provided economic advantages, without extra development work. But, recently, the value proposition doesn't seem to be there anymore. And the complexity around some services has increased, making the benefits of the trade-off less clear.

## Swapping Clouds

Is The Cloud (understood as AWS) bad, then? No, of course not. If you are a company like Netflix, it makes sense to use this flavour of the cloud. Or if you have specific regulatory compliance needs (say, HIPAA). Or for many other scenarios.

But I suspect that too many companies use AWS because it is the default. We underestimate the power of inertia. When most of the industry uses Terraform, AWS (or similar platforms), and Kubernetes, what will they choose for their next project?

And we also underestimate how much it is possible in modern hardware. The days of [C10K](https://en.wikipedia.org/wiki/C10k_problem) are far behind. WhatsApp was serving [2 million connections](https://blog.whatsapp.com/1-million-is-so-2011) from a single server, in 2012\. Pieter Levels was running [all his startups](https://levels.io/how-i-build-my-minimum-viable-products/) in a single Linode box, in 2014\. StackOverflow run the site [in just 9 servers](https://www.datacenterdynamics.com/en/news/stack-overflow-still-on-prem-runs-qa-platform-off-just-nine-servers/), taking advantage of vertical scaling. More than 8 years ago, computers were already powerful, imagine nowadays.

In an era where servers with dedicated CPU are not expensive, and the hardware can do so much more, it is time to rethink our infrastructure. Yes, there is no silver bullet, but do we need to go all-in with AWS? Are there no alternatives for us?

I need to clarify what I'm **not** proposing. I'm not telling you to go back to on-prem. Yes, that [DHH post](https://www.linkedin.com/posts/david-heinemeier-hansson-374b18221_our-cloud-exit-savings-will-now-top-ten-million-activity-7252755548859727874-k5V2 ) with their savings by doing moving to om-prem is popular. It works for them, but it is not sure if it will work for you. There is a set of pre-requirements to do that, which are not universal. From staff that has experience managing the servers in the data center, to CAPEX capability.

What I am suggesting is to look at alternatives to AWS, and understand if there is a reason why you could not use them. Companies running applications in AWS connect routinely to SaaS offerings like [Aiven](https://aiven.io), [Papertrail](https://www.papertrail.com), or [Honeycomb](https://www.honeycomb.io). They get extra functionality outside AWS, using AWS mainly for their compute workloads. Is there a reason you must pay more for a worse compute service? Is there some critical service in AWS itself you need and forces that decision? Or can you move away?

Let me show you what I mean, by going over alternatives you have depending on your preferences.

### You really like AWS/GCP/Azure

You like The Cloud, you have nightmares thinking about the times before EC2. Or, maybe, you have never experienced an alternative way of doing things. You would need convincing to leave your walled garden.

That is understandable, and I'm not going to say it is a mistake. But I would suggest that you develop a framework to test if it may be worth considering other options. I am going to write an example next. It is an example, it is not exhaustive, and it should be adapted to the reality of your business. But it will give you an idea of what to ask:

- What are your compliance needs? If you need HIPAA, working in AWS may be easier. For SOC2, alternative platforms are good enough.

- Do you need global presence? If you only serve one region (for example, Europe), multi-region is less valuable. For global presence, current edge solutions like Fly.io or Cloudflare may be enough. Or your business may need multi-region AWS for other reasons.

- What are your usage patterns? Predictable workloads, with little change between peak and off-peak, work well with dedicated servers. Very volatile or event-based traffic is more cost-effective with serverless or cloud elasticity. If you use a lot of spot instances, the economics may not differ that much.

- How much are you spending in AWS now, and how much would it cost in another platform? How much engineering effort you need to move? If it takes a huge effort, you may not recover the cost in a long while, making the investment not worthy. But what if the break even point is just 6 months? It turns into a more enticing proposition.

- What are the skills of your team? If you needed to hire people to make this happen, then it is not an option. You can (and should) upskill the team, but that will increase the total cost of the migration.

As I mentioned, those are some examples. You should ask yourself questions about the current infrastructure, team, and costs, and see if a move could work. Even if you are not planning to move, it may be a good exercise, helping you detect waste in your infrastructure.

### You like Kubernetes

Kubernetes is not my cup of tea, but it would be foolish to deny the tool. It is a industry standard for a reason. Now, you can be lucky and use managed Kubernetes in GCP, and there you will have a decent experience, compute premiums aside. But I've often heard that managed Kubernetes in AWS is, at best, subpar. AWS is the dominant cloud, which means it is likely your Kubernetes experience is not great.

If that is the case, and your operations team have the skills, you should look at [Reclaim the Stack](https://reclaim-the-stack.com). It is a Kubernetes-based deployment platform designed to work like a PaaS (think Heroku). It provides you with most of what you need: Gitops, Ingres, Databases, Observability, and more.

### You don't like managing servers

Your ideal platform was Heroku, but that is not a good choice anymore. Managing a server is a big responsibility. Security updates, avoiding downtime, managing the load, and the myriad of tiny annoyances that come with the task. You could use Kubernetes, but then again that brings its own set of problems. You can try the following:

- [Cloudflare:](https://developers.cloudflare.com) the Cloudflare ecosystem is one of the most impressive for serverless I've seen up to now. More so considering the price, with a generous free allowance and a subscription that includes plenty of compute. Cloudflare Pages works out of the box with many popular frameworks, making deployment a breeze. And there are the extra services: databases (D1), storage (R2, cheaper than S3 and without transfer fees), Durable objects, and more. No, I'm not paid by Cloudflare, but I like their service.

- [Digital Ocean Apps](https://www.digitalocean.com/products/app-platform): you can deploy a Docker container or code from a Github/Gitlab repository directly. You can also connect to the other services offered, like Redis, Postgres, local S3, etc. One of the closest replacements for Heroku that I've seen. That said databases can become expensive as traffic grows, and you need a more powerful setup.

- [Render](https://render.com) is a service like Digital Ocean Apps, where you can deploy your app into managed nodes, with the option to add databases and other services. As Digital Ocean, it can become pricey at some level of use. But worth considering when you start.

- [Railway](https://railway.app) is another app service. They provide an environment in which you can deploy many services, and you only pay per real use. The risk with this model is any unexpected costs. Luckily they provide the option of purchasing prepaid credits, which can limit exposure.

Special mention to [Unison](https://www.unison.cloud), a revolutionary service. Unison provides a supercomputer for your software. The tradeoff is that you need to code in the Unison language. In exchange, you don't have to worry about deployments, versioning, and many other tasks that we have normalised in the era of the microservice. As it is common, it offers a free tier. I'd recommend you to check it out.

### You are ok with some infrastructure work

Managing a server is ok, but you would like some automation. Tooling has improved, we are in 2024 after all. There are common operations that you should find preconfigured. You want to limit the time spent in Terraform and Ansible, while having more control.

You are in luck, there are services for that too:

- [Cleavr.io](https://cleavr.io) : this service works on top of your servers, which you have to provision separately on a VPS (see the next section for that). But for $15 per month, you get the full package: securing servers, database backups, monitoring, push to deploy, and more. The downside? It's geared to deploying node and php apps, so it won't be as useful if you use other programming languages.

- [Cloud66](https://www.cloud66.com) is an alternative to Cleavr. It allows you to work in any programming language as it supports Docker deployments, but in exchange it is more pricey ($25 per month). Besides that, the offering is similar, it manages the machines you provisioned in your VPS.

- [Coolify](https://coolify.io) is a service like Cleaver and Cloud66, but with an important difference: it is open source. So you can download it and host it yourself. Or you can contribute to the development, by using their cloud offering, which is very affordable. It offers a complete package of functionality, but the documentation for some functionality is lacking.

- [Dokku](https://dokku.com) is an opensource project that tries to reproduce the functionality of Heroku. It requires you to set it up in a server, and then you are ready to go, you can target other servers for deployment.

- [Fly.io](https://fly.io) is slightly different. You can deploy applications with a single docker image, and scale them as needed, and you pay per usage. But you are responsible for any backup of data stored in the Fly Machines.

### You are old school, bring the bare metal

You have seen the old times, with data centers and bare metal. You just want to provision servers faster, without having to travel to the location. You can handle the setup. I have good news for you.

The gold standard currently is [Hetzner.](https://www.hetzner.com) It offers a variety of servers, from dedicated to managed to VPS, all via their web console.

But that is not the only alternative. If you only care about VPS, [Vultr](https://www.vultr.com), [Linode](https://www.linode.com), [Digital Ocean](https://www.digitalocean.com), and many other providers have similar offerings . Choose your server and start working almost immediately. And, often, you can scale vertically as your workload grows without having to migrate the server.

## Conclusion

The list above is not exhaustive. There are services I have not listed intentionally due to their reputation (many customers are unhappy), and others that I am not aware of. There's no denial that we are spoiled for choice.

The industry defaults to AWS because, paraphrasing the old adage, no one has ever been fired by buying more AWS services. But the offerings in 2024 are not the ones we had 10 years ago, and it may be better for your project or company to look for an alternative platform. You may get better compute resources and save operational costs at the same time. And without taxing your teams with extra engineering work.