n-body-bench
============
Test your collision detection library on a simple benchmark!  Think you can do better?  Fork this library and submit a pull request.  You can also view the demos in your browser!

[http://mikolalysenko.github.com/n-body-bench/](http://mikolalysenko.github.com/n-body-bench/)

Running the Benchmark
=====================
First clone the repo into a local directory, then do:

    npm install
    
To configure all the files.  To run the benchmark type in:

    node bench.js

Here is the result I got running the benchmark on my machine:

```
Starting benchmark...
BruteForceSimulator: 144 ticks/minute
NBodyPairsSimulator: 7440 ticks/minute
MXCIFQuadTreeSimulator: 2471 ticks/minute
CraftyHashSimulator: 3946 ticks/minute
```

Higher numbers are better.

About the Benchmark
===================
Besides brute force, this library the following codes for n-body collision detection:

* [n-body-pairs](https://github.com/mikolalysenko/n-body-pairs)
* [jsQuad](https://github.com/pdehn/jsQuad)
* [CraftyJS](http://craftyjs.com/)

I also tried to benchmark [Mike Chambers' quad tree library](http://www.mikechambers.com/blog/2011/03/21/javascript-quadtree-implementation/), but it had too many bugs (or perhaps I was not using it correctly?)

If you want to add your own code to this list, open an issue or send a pull request!

Credits
=======
(c) 2013 Mikola Lysenko. MIT License