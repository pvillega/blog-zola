---
title: "Breaking the 1000ms Time to Glass Mobile Barrier"
publishDate: 2013-08-26
draft: false
categories:
  - "development"
tags:
  - "webapp"
  - "performance"
  - "mobile"
---

Mobile is the new king and HTML 5 allows developers to, at last, build once and run everywhere: tablets, phones, desktops...

<!-- more -->

Nothing controversial in that sentence, but unfortunately Mobile is still *slow*. And even if we see again and again that we should do *mobile first* when building a web site, that doesn't seem to work. At east judging by the rendering time of a normal page in my smartphone. And [page load time is money][2].

[Breaking the 1000ms Time to Glass Mobile Barrier][1] is an amazing video from Ilya Grigorik in which he explains how to prepare your website to it renders fast in mobile. Fast as in under 1s.

The video is completely worth your time, but as a kind of *TL;DR* some of the most relevant hints in it:

* Render in *100ms* feels instant, *250ms* is the maximum for a good usability experience
* Mobile leaves you *400-500ms* for server and client processing due to network innate slowness
* This means we have *100ms* for server processing, *100ms* for client processing and *200ms* to download external resources and run javascript. Tight!
* Reuse connections, do bulk transfers and compress data to fight the mobile network latency
* Do progressive enhancement
* Optimizing images for size is a must
* Turn javascript *async* whenever possible
* Inline the critical CSS (the one to render things above the fold) and load the rest asynchronously via javascript
* Minimize the use of javascript, don't use any in the critical rendering path, only after loading the page
* Chrome has a critical path explorer to highlight the fragments that block rendering
* Chrome can also *audit* the page for unused CSS styles

And with this, you can render your app *fast*.

[1]: http://youtu.be/Il4swGfTOSM
[2]: http://www.fastcompany.com/1825005/how-one-second-could-cost-amazon-16-billion-sales
