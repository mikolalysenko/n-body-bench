var TOTAL_TIME = 10000
var SIZE = 2000
var RADIUS = 1
var COUNT = 9001
var SIMULATORS = [
  require("./brute-force.js"),
  require("./nbp.js")
]

console.log("Starting benchmark...")
for(var i=0; i<SIMULATORS.length; ++i) {
  var simCons = SIMULATORS[i]
  var sim = new simCons(COUNT, SIZE, RADIUS)
  var score = 0
  var prev = new Date()
  var start = prev
  while(true) {
    sim.step()
    var cur = new Date()
    var d = (cur - start)|0
    if(d > TOTAL_TIME) {
      score += (TOTAL_TIME-((prev-start)|0)) / (cur - prev)
      break
    } else {
      ++score
      prev = cur
    }
  }
  console.log(simCons.name + ": " + Math.floor(score*6) + " ticks/hour")
}