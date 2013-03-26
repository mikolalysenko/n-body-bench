"use strict"

var SIZE = 500
var RADIUS = 10

var SIMULATORS = [
  require("./brute-force.js"),
  require("./nbp.js")
]


var canvas = document.createElement("canvas")
canvas.width = canvas.height = SIZE
document.body.appendChild(canvas)
var context = canvas.getContext("2d")
var simulator = null
var ftime = 0.0

var container = document.createElement("div")
document.body.appendChild(container)
var particleCount = document.createElement("select")
for(var i=50; i<100000; i*=5) {
  var opt = document.createElement("option")
  opt.text = i
  opt.value = i
  particleCount.add(opt, null)
}
container.appendChild(particleCount)
particleCount.addEventListener("change", restartSimulator)

var simSelect = document.createElement("select")
for(var i=0; i<SIMULATORS.length; ++i) {
  var opt = document.createElement("option")
  opt.text = SIMULATORS[i].name
  opt.value = i
  simSelect.add(opt, null)
}
container.appendChild(simSelect)
simSelect.addEventListener("change", restartSimulator)

var timeDisplay = document.createTextNode("0.0")
container.appendChild(timeDisplay)

function restartSimulator() {
  var sim = SIMULATORS[simSelect.value|0]
  var count = particleCount.value|0
  simulator = new sim(count, SIZE, RADIUS)
  var d = new Date()
  simulator.step()
  ftime = new Date() - d
}

require("raf")(canvas).on("data", function() {
  context.fillStyle = "rgba(255,255,255,1)"
  context.fillRect(0, 0, SIZE, SIZE)
  if(!simulator) {
    return
  }
  context.strokeStyle = "#000"
  for(var i=0, len=simulator.points.length; i<len; ++i) {
    var p = simulator.points[i]
    if(simulator.colors[i]) {
      context.fillStyle = "rgba(255, 0, 0, 0.5)"
    } else {
      context.fillStyle = "rgba(255, 255, 255, 0)"
    }
    context.beginPath()
    context.arc(p[0], p[1], 0.5*RADIUS, 0, 2.0*Math.PI, false)
    context.closePath()
    context.fill()
    context.stroke()
  }
})

setInterval(function() {
  if(simulator) {
    var d = new Date()
    simulator.step()
    var e = (new Date()) - d
    ftime = 0.9 * ftime + 0.1 * e
  }
  timeDisplay.nodeValue = ftime + " ms"
}, 1)

restartSimulator()