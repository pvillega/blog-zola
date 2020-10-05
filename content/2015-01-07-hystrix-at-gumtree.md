+++
title = "Hystrix at Gumtree"
date = 2015-01-07

[taxonomies]
categories = ["java"]
tags = ["java", "hystrix"]
+++

Happy new year! After many months, busy with the [responsive Gumtree](http://blog.gumtree.com/your-new-look-gumtree/) project, I wrote another post for [our developer blog](http://gumtree.com/devteam/). This time talking about [Hystrix](https://github.com/Netflix/Hystrix), a [Netflix](http://netflix.github.io/) library for application resilience.

<!-- more -->

When we built the responsive site we wanted to improve the back-end, specially after all the *Reactive* hype around and the desired properties associated to these systems: resilience, performance, etc. As a result, we decided to integrate Hystrix in our legacy code, and it has paid off. We recommend it, if you have a JVM-based app and calls to external system, use Hystrix. You will thank us later for the advice ;)

You can read the full article [here](http://www.gumtree.com/devteam/2015-01-06-integrating-hystrix.html).

As always, feedback via Twitter/Email is more than welcome.

Update: the post was lost when Gumtree moved blog :(
