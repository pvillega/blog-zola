+++
title = "Enums to JSON in Scala"
date = 2013-09-21

[taxonomies]

categories = ["scala"]
tags = ["scala", "json", "enumerations"]
+++

Scala gives the developer the possibility of using [Enumerations](http://www.scala-lang.org/api/current/index.html#scala.Enumeration). If they should be used or if [Case Classes](http://docs.scala-lang.org/tutorials/tour/case-classes.html) are better is a debate I'm not going to start here. They exist and they can be used.

<!-- more -->

The reason I mention enumerations is that in a personal project (which I hope to publish soon, but I digress) I've been using them inside some *case classes*. In the same project I'm using [Play-JSON](https://github.com/mandubian/play-json-alone), a standalone version of the [Play Framework JSON libraries](http://www.playframework.com/documentation/2.2.x/ScalaJson), which turn working with JSON into a boilerplate-free pleasure. All was grand until I added my first enumeration as a parameter in a case class. The compiler started to complain and it took me a while to find how to fix it.

The solution was provided by, who else, [StackOverflow](http://stackoverflow.com/questions/15488639/how-to-write-readst-and-writest-in-scala-enumeration-play-framework-2-1/15489179#15489179) which [in just 5 years](http://blog.stackoverflow.com/2013/09/five-years-ago-stack-overflow-launched-then-a-miracle-occurred/) has become an invaluable resource. I thought this may be useful to other people, so I created some basic sample code showing the solution to the issue and pushed it to a [Github repository](https://github.com/pvillega/scala_enum_json). As always, feel free to clone and comment.

# The issue

Let's assume we have the following code structure:

```
// Enum sample #1
object EnumType1 extends Enumeration {
  type EnumType1 = Value

  val N = Value("N")
  val D = Value("D")
  val A = Value("A")
  val C = Value("C")
  val L = Value("L")
  val P = Value("P")
}

// Enum sample #2
object EnumType2 extends Enumeration {
  type EnumType2 = Value

  val OPTION_A = Value("OPTION_A")
  val OPTION_B = Value("OPTION_B")
  val OPTION_C = Value("OPTION_C")
  val OPTION_D = Value("OPTION_D")
  val OPTION_E = Value("OPTION_E")
  val OPTION_F = Value("OPTION_F")
}

// Case class that uses enums
case class EnumCaseClass(name: String, enum1: EnumType1, enum2: EnumType2)
```

We can take advantage of *Play-JSON* and create a companion object for our case class that will helps us serializing instances of this class from or into JSON.

```
object EnumCaseClass {
  // Support object to convert EnumCaseClass to Json using Play-JSON
  implicit val fmt = Json.format[EnumCaseClass]

  def fromJson(json: JsValue) = Json.fromJson[EnumCaseClass](json).get

  def toJson(enumCaseClass: EnumCaseClass) = Json.toJson(enumCaseClass)
}
```

Unfortunately, when compiling we will get errors due to the enumerations missing valid *Reads* and *Writes*. We can test this by removing the enum parameters from the case class and replacing them by simple types as shown below. The code works and converts the case class into JSON, which proves that the issue is the enumeration type that can't be managed by *Play-JSON*.

```
case class EnumCaseClass(name: String, enum1: Int, enum2: Int)
```

# Solution

The solution is, obviously, to provide *Reads* and *Writes* for the enumerations. But we would like to do it in a generic way, to avoid duplication of very similar code. [StackOverflow](http://stackoverflow.com/questions/15488639/how-to-write-readst-and-writest-in-scala-enumeration-play-framework-2-1/15489179#15489179) provides an example of a support class that can accomplish this:

```
object EnumUtils {
  def enumReads[E <: Enumeration](enum: E): Reads[E#Value] =
    new Reads[E#Value] {
      def reads(json: JsValue): JsResult[E#Value] = json match {
        case JsString(s) => {
          try {
            JsSuccess(enum.withName(s))
          } catch {
            case _: NoSuchElementException =>
               JsError(s"Enumeration expected of type: '${enum.getClass}',
                      but it does not appear to contain the value: '$s'")
          }
        }
        case _ => JsError("String value expected")
      }
  }

  implicit def enumWrites[E <: Enumeration]: Writes[E#Value] =
    new Writes[E#Value] {
      def writes(v: E#Value): JsValue = JsString(v.toString)
    }

  implicit def enumFormat[E <: Enumeration](enum: E): Format[E#Value] = {
    Format(enumReads(enum), enumWrites)
  }
}
```

This creates an object that provides generic *Reads*, *Writes* and *Format* methods that can be used with any enumeration. We can use the methods in our enumerations, adding some implicit vals of type *Reads* and *Writes* that will redirect the execution flow to the support object, as follows:

```
object EnumType1 extends Enumeration {
  type EnumType1 = Value

  val N = Value("N")
  val D = Value("D")
  val A = Value("A")
  val C = Value("C")
  val L = Value("L")
  val P = Value("P")

  implicit val enumReads: Reads[EnumType1] = EnumUtils.enumReads(EnumType1)

  implicit def enumWrites: Writes[EnumType1] = EnumUtils.enumWrites

}

object EnumType2 extends Enumeration {
  type EnumType2 = Value

  val OPTION_A = Value("OPTION_A")
  val OPTION_B = Value("OPTION_B")
  val OPTION_C = Value("OPTION_C")
  val OPTION_D = Value("OPTION_D")
  val OPTION_E = Value("OPTION_E")
  val OPTION_F = Value("OPTION_F")

  implicit val enumReads: Reads[EnumType2] = EnumUtils.enumReads(EnumType2)

  implicit def enumWrites: Writes[EnumType2] = EnumUtils.enumWrites
}
```

By adding this support object and the enumeration-specific *vals*, we can now compile the project and serialize our *case class* into JSON.

Go to the [Github repository](https://github.com/pvillega/scala_enum_json) and experiment with the code.
