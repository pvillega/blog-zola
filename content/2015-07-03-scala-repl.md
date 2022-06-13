+++
title = "Scala REPL"
date = 2015-07-03

[taxonomies]

categories = ["scala"]
tags = ["scala", "repl"]
+++


One of the things people love about Scala is the [REPL](https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop). I have to be honest;
I never paid too much attention to it as IntelliJ provides a handy [Scala Worksheet](http://blog.jetbrains.com/scala/2014/05/23/meet-the-new-scala-worksheets-in-intellij-idea/). But it is time to fix this..

<!-- more -->

The main reason is that my old desktop started misbehaving and running IntelliJ slows it down to a crawl. While I find a suitable replacement, I had to settle with using Sublime Text 2 to toy around with some Scala code. Is at this point that my lack of knowledge of the REPL became obvious, and a hindrance. And what better way to help fix that issue than to document the relevant parts :)

Most likely you are using the new [Activator](http://www.typesafe.com/community/core-tools/activator-and-sbt) to generate your projects. Activator has a lot of commands:

```
$ ./activator
[info] Loading project definition from /home/pvillega/Dropbox/Projectes/scala-fp-exercises/project
[info] Set current project to scala-fp-exercises (in build file:/home/pvillega/Dropbox/Projectes/scala-fp-exercises/)
> help

  help                                    Displays this help message or prints detailed help on requested commands (run 'help <command>').
  completions                             Displays a list of completions for the given argument string (run 'completions <string>').
  about                                   Displays basic information about sbt and the build.
  tasks                                   Lists the tasks defined for the current project.
  settings                                Lists the settings defined for the current project.
  reload                                  (Re)loads the current project or changes to plugins project or returns from it.
  projects                                Lists the names of available projects or temporarily adds/removes extra builds to the session.
  project                                 Displays the current project or changes to the provided `project`.
  set [every] <setting>                   Evaluates a Setting and applies it to the current project.
  session                                 Manipulates session settings.  For details, run 'help session'.
  inspect [uses|tree|definitions] <key>   Prints the value for 'key', the defining scope, delegates, related definitions, and dependencies.
  <log-level>                             Sets the logging level to 'log-level'.  Valid levels: debug, info, warn, error
  plugins                                 Lists currently available plugins.
  ; <command> (; <command>)*              Runs the provided semicolon-separated commands.
  ~ <command>                             Executes the specified command whenever source files change.
  last                                    Displays output from a previous command or the output from a specific task.
  last-grep                               Shows lines from the last output for 'key' that match 'pattern'.
  export <tasks>+                         Executes tasks and displays the equivalent command lines.
  exit                                    Terminates the build.
  --<command>                             Schedules a command to run before other commands on startup.
  show <key>                              Displays the result of evaluating the setting or task associated with 'key'.
  all <task>+                             Executes all of the specified tasks concurrently.

More command help available using 'help <command>' for:
  !, +, ++, <, alias, append, apply, eval, iflast, onFailure, reboot, shell
```

The snippet above only shows the most relevant ones, but there are plenty more (278 as I write this) although just a few are used very often:

```
> projects        # lists the projects available
> project <name>  # changes to the given project (run will execute the selected project now)
> plugins         # lists all plugins
> reload          # reloads all the config and plugins without leaving the session
> run             # runs the current project
> ~test           # runs the tests. The initial ~ means it will run them all every time a source file changes, handy for TDD
> exit            # leaves activator
> console         # launches Scala REPL
```

As you can see with a few commands you cover most of your development needs. But as we were talking about REPL the command I want to focus on is `console`, which starts a REPL in the currently selected project:

```
> console
[info] Starting scala interpreter...
[info]
Welcome to Scala version 2.11.6 (Java HotSpot(TM) 64-Bit Server VM, Java 1.8.0_45).
Type in expressions to have them evaluated.
Type :help for more information.

scala> :help
All commands can be abbreviated, e.g., :he instead of :help.
:edit <id>|<line>        edit history
:help [command]          print this summary or command-specific help
:history [num]           show the history (optional num is commands to show)
:h? <string>             search the history
:imports [name name ...] show import history, identifying sources of names
:implicits [-v]          show the implicits in scope
:javap <path|class>      disassemble a file or class name
:line <id>|<line>        place line(s) at the end of history
:load <path>             interpret lines in a file
:paste [-raw] [path]     enter paste mode or paste a file
:power                   enable power user mode
:quit                    exit the interpreter
:replay [options]        reset the repl and replay all previous commands
:require <path>          add a jar to the classpath
:reset [options]         reset the repl to its initial state, forgetting all session entries
:save <path>             save replayable session to a file
:sh <command line>       run a shell command (result is implicitly => List[String])
:settings <options>      update compiler options, if possible; see reset
:silent                  disable/enable automatic printing of results
:type [-v] <expr>        display the type of an expression without evaluating it
:kind [-v] <expr>        display the kind of expression's type
:warnings                show the suppressed warnings from the most recent line which had any
```

As you can see there aren't many commands in the REPL, which makes it very easy to use even for the uninitiated. Some of them deserve additional attention as you will run them often.


For example `:implicits` will show a list of all implicits in scope. Given implicits are problematic (judging by [Stack Overflow](http://stackoverflow.com/search?q=[scala]+implicit) questions), this may help when debugging your app.

One of the main drawbacks of a REPL is to type all the context (imports, type definitions, etc) you need before you can test stuff. Two commands remove this pain: `:load <path>` will read and interpret a file as if you had typed it into the terminal; the command `:paste` works similarly by starting a *paste mode* that allows you to copy-paste relevant code into the REPL.

```
scala> :paste
// Entering paste mode (ctrl-D to finish)

val s = 3
def g = (x: Int) => x*x

// Exiting paste mode, now interpreting.

s: Int = 3
g: Int => Int
```

Alongside `:load` there is a corresponding `:save <path>` command which saves the current status of the REPL into a file that can be loaded later on to continue your work at that point.

There are other commands you may want to check, like `:require` or `:history`, but with just the ones above working inside the REPL becomes a much more pleasant experience and not having a full fledge IDE is less of an issue.

That's all. As always, feedback via Twitter/Email is more than welcome. Cheers!
