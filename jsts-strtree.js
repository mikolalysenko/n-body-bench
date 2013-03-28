"use strict"

if(typeof(window) !== "undefined") {
  window.GLOBAL = window
}

var numeric = require("numeric")
var jsts = require("jsts")
var STRTree = jsts.index.strtree.STRtree
var Envelope = jsts.geom.Envelope

function JSTS_STRTreeSimulator(n, size, radius) {
  this.colors = numeric.rep([n], 0)
  this.size = size
  this.radius = radius
  this.points = numeric.mul(size, numeric.random([n, 2]))
  this.velocities = numeric.add(-0.5,numeric.random([n,2]))
  this.rects = new Array(n)
  for(var i=0; i<n; ++i) {
    this.rects[i] = new Envelope(0, 0, radius, radius)
  }
  this.collisions = 0
}

JSTS_STRTreeSimulator.prototype.step = function() {
  var len = this.points.length
  var size = this.size
  var radius = this.radius
  var r2 = 4.0 * radius * radius

  //Move points
  this.collisions = 0
  var tree = new STRTree(4)
  var ncol = 0
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
    
    //Update rectangle
    var R = this.rects[i]
    R.minx = P[0] - radius
    R.maxx = P[0] + radius
    R.miny = P[1] - radius
    R.maxy = P[1] + radius
    tree.insert(R, i)
  }
  
  for(var i=0; i<len; ++i) {
    var P = this.points[i]
    var items = tree.query(this.rects[i])
    for(var j=0, jlen=items.length; j<jlen; ++j) {
      if(items[j] < i) {
        var Q = this.points[items[j]]
        var dx = P[0] - Q[0]
        var dy = P[1] - Q[1]
        if(dx*dx + dy*dy <= r2) {
          this.colors[i] = this.colors[items[j]] = 1
          this.collisions++
        }
      }
    }
  }
}

module.exports = JSTS_STRTreeSimulator