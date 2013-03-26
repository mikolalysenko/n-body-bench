var numeric = require("numeric")
var initNBP = require("n-body-pairs")

function NBodyPairsSimulator(n, size, radius) {
  this.colors = numeric.rep([n], 0)
  this.size = size
  this.radius = radius
  this.points = numeric.mul(size, numeric.random([n, 2]))
  this.velocities = numeric.add(-0.5,numeric.random([n,2]))
  this.nbp = initNBP(2, n)
  this.collisions = 0
}

NBodyPairsSimulator.prototype.step = function() {
  var len = this.points.length
  var size = this.size
  var radius = this.radius

  //Move points
  for(var i=0; i<len; ++i) {
    var P = this.points[i]
    var V = this.velocities[i]
    for(var j=0; j<2; ++j) {
      P[j] += V[j] * 2.0
      if(P[j] < 0) {
        P[j] = 0
        V[j] *= -1
      } else if(P[j] > size) {
        P[j] = size
        V[j] *= -1
      }
    }
    this.colors[i] = 0
  }
  
  //Handle collisions
  var colors = this.colors
  var count = 0
  this.nbp(this.points, radius, function(i,j,d2) {
    colors[i] = colors[j] = 1
    count++
  })
  this.collisions = count
}

module.exports = NBodyPairsSimulator
