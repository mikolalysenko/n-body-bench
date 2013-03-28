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
BruteForceSimulator: 138 ticks/minute
NBodyPairsSimulator: 7367 ticks/minute
jsQuad_MXCIFQuadTreeSimulator: 2532 ticks/minute
Crafty_HashSimulator: 1461 ticks/minute
JSTS_STRTreeSimulator: 1069 ticks/minute
```

Higher numbers are better.

About the Benchmark
===================
Besides brute force, this library the following codes for n-body collision detection:

* [n-body-pairs](https://github.com/mikolalysenko/n-body-pairs)
* [jsQuad](https://github.com/pdehn/jsQuad)
* [CraftyJS](http://craftyjs.com/)
* [JSTS](https://github.com/bjornharrtell/jsts)

If you want to add your own code to this list, open an issue or send a pull request!

Notes
=====

* I tried to benchmark [Mike Chambers' quad tree library](http://www.mikechambers.com/blog/2011/03/21/javascript-quadtree-implementation/), but it had too many bugs

* Crafty's hash table is slightly broken and does not remove duplicates correctly.  To fix this, I had to add in a second pass to remove all the extra pairs.  Without this, it is faster than MXCIFQuadTree by a decent amount, but still less than half the speed of n-body-pairs.

* jsQuad (MXCIFQuadTree) seems to very slightly under report collisions, which I think causes it to run a bit faster than it should.  These effects are small enough though that I think they can be ignored for the purposes of this benchmark, but I would still recommend against using it in a production environment.  It also has a very cumbersome interface, requiring you to reimplement the logic of the data structure into whatever objects you insert.

* Crafty is a good choice if you are already using the game engine, but the code is not very modular and probably not suitable for use in other projects.

* JSTS has a huge number of features, which may tip the scales slightly in its favor if you are already using the library, despite being very slow.

Credits
=======
(c) 2013 Mikola Lysenko. MIT License