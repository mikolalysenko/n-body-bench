n-body-bench
============
Test your collision detection library on a simple benchmark.  Think you can do better?  Fork this library and submit a pull request.  You can also view the demos in your browser!


Running the Benchmark
=====================
First clone the repo into a local directory, then do:

    npm install
    
To configure all the files.  To run the benchmark type in:

    node bench.js

Here is the result I got running the benchmark on my machine:

```
Starting benchmark...
BruteForceSimulator: 139 ticks/hour
NBodyPairsSimulator: 3676 ticks/hour
```

(Higher means better)


Credits
=======
(c) 2013 Mikola Lysenko. MIT License