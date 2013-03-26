var numeric = require("numeric")

function BruteForceSimulator(n, size, radius) {
  this.colors = numeric.rep([n], 0)
  this.size = size
  this.radius = radius
  this.points = numeric.mul(size, numeric.random([n, 2]))
  this.velocities = numeric.add(-0.5,numeric.random([n,2]))
}

BruteForceSimulator.prototype.step = function() {
  var len = this.points.length
  var size = this.size
  var radius = this.radius
  var r2 = radius * radius

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
  for(var i=0; i<len; ++i) {
    var A = this.points[i]
    for(var j=0; j<i; ++j) {
      var B = this.points[j]
      var d2 = 0.0
      for(var k=0; k<2; ++k) {
        d2 += (A[k] - B[k])*(A[k] - B[k])
      }
      if(d2 <= r2) {
        this.colors[i] = this.colors[j] = 1
      }
    }
  }
}

module.exports = BruteForceSimulator
