Promise Pipeline for JSX
========================

This is a JSX implementation of futures and promises pattern. This module is aiming the followings:

* Providing high efficiency task management for parallel environment (for QtScript's QThreadPool).
* Providing complex task management they have dependencies with each other.
* Supporting very big batch task processing with cache.

Basic Concept
-------------

Basic idea is come from original futures and promises pattern:

* http://en.wikipedia.org/wiki/Futures_and_promises

There are many other implementations of it (Python 3.3, Java, Scala, Qt and so on), but they are implemented as "thread pools easy to use".
The original futures and promises pattern was a designed as a task pipeline for actor model. These tasks are processed concurrently.
This library was designed for pipeline model to solve thousands tasks and they have dependencies to each other efficiency.

I uses the Scala's naming rule. "Future" means a result of calculation, it doesn't finished yet.
"Promise" is a contract to provide a variable value "Future", actual calculation program.
Task processing codes with futures will be processed when all futures will have actual value.

Futures and promises is similar to system of linear equations equations of mathematics. Writing expression with unknown value "X" and "Y".
Each equation is a "Promise". If other value will be came from outside, these equations provides a valuable value, "Future".

License
-------

http://shibu.mit-license.org/

The MIT License
~~~~~~~~~~~~~~~

Copyright (c) 2013 Yoshiki Shibukawa (DeNA Co.,Ltd, and ngmoco LLC)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
