+++
title = "Renaming Files"
date = 2010-05-09

[taxonomies]

categories = ["miscellanea"]
tags = ["miscellanea", "files"]
+++


I own a Lacie Big5 to backup my files, which amount to almost 2 Tb right now. Lately I've had some compatibility issues as some files I copied from my Windows Vista machine were not readable from my Kubuntu 9.10.

<!-- more -->

After checking I've seen the issue arose from Spanish characters like 'á'. Surprising, as Linux should support them, but oh well. A bit of Googling and the solution was found: [Métamorphose](http://file-folder-ren.sourceforge.net/).

Run it with the following reg exp:

```
[ñÑáéíóúÁÉÍÓÚüÜ@¡¿—àèìòùÀÈÌÒÙ$£¥€¢ƒäÄïÏöÖçÇãêß]
```

and issue solved! You may need to tweak the reg exp according to your language if you use some extra "non-ASCII" characters, but it's easy to do.
