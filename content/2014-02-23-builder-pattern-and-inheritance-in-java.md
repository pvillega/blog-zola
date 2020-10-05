+++
title = "Builder Pattern and Inheritance in Java"
date = 2014-02-23

[taxonomies]
categories = ["java"]
tags = ["java", "pattern", "builder"]
+++

At [Gumtree](http://www.gumtree.com/) we are currently doing some changes to the back-end of the site. To that aim we have spent some weeks building tools and scaffolding that will facilitate our next tasks. Planning is important if you want quality.

<!-- more -->

Given that for this particular project we are using [Spring MVC](http://docs.spring.io/spring/docs/current/spring-framework-reference/html/mvc.html), we wanted a way to build our model objects without duplication and to keep things in sync with minimal effort. The builder pattern is a fit, but adding inheritance makes things much more complex than they seem at first glance.

I've written about it in a post in our [Gumtree dev blog](https://medium.com/@GumtreeDevTeam/builder-pattern-and-inheritance-in-java-25ccd2d70c9d), where you can find some code samples along the explanation of the issue.

As always, feedback via Twitter/Email is more than welcome.
