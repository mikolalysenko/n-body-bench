"use strict"

//This uses the quadtree code from:
//
//  http://www.mikechambers.com/blog/2011/03/21/javascript-quadtree-implementation/
//
//Unfortunately this code is quite broken and only returns a small fraction of the total number of collisions, sometimes missing collisions entirely.
//The fact that it drops so many collisions tends to make the code run a bit faster, but I suspect any performance advantages of this library will go away if it was properly debugged.
// -Mik

var numeric = require("numeric")
var QuadTree = require("./src/QuadTree-broken").QuadTree

function QuadTreeSimulator_Broken(n, size, radius) {
  this.colors = numeric.rep([n], 0)
  this.size = size
  this.radius = radius
  this.points = numeric.mul(size, numeric.random([n, 2]))
  this.velocities = numeric.add(-0.5,numeric.random([n,2]))
  var qdepth = Math.ceil(Math.log(0.5*size/radius))
  this.tree = new QuadTree({
    x: 0,
    y: 0,
    width: size,
    height: size
  }, qdepth, n)
  this.rects = new Array(this.points.length)
  for(var i=0; i<this.points.length; ++i) {
    this.rects[i] = {
      id: i,
      x: this.points[i][0]-radius,
      y: this.points[i][1]-radius,
      width: 2*radius,
      height: 2*radius
    }
  }
  this.collisions = 0
}

QuadTreeSimulator_Broken.prototype.step = function() {
  var len = this.points.length
  var size = this.size
  var radius = this.radius
  var r2 = 4*radius * radius

  //Move points
  this.tree.clear()
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
    R.x = P[0] - radius
    R.y = P[1] - radius
    R.width = 2 * radius
    R.height = 2 * radius
  }
  this.tree.insert(this.rects)

  //Insert points into quad tree
  var ncol = 0
  for(var i=0; i<len; ++i) {
    //Find collisions
    var items = this.tree.retrieve(this.rects[i])
    var P = this.points[i]
    for(var j=0, jlen=items.length; j<jlen; ++j) {
      var b = items[j].id
      if(b >= i) {
        continue
      }
      var Q = this.points[b]
      var dx = P[0] - Q[0]
      var dy = P[1] - Q[1]
      if(dx*dx + dy*dy <= r2) {
        this.colors[i] = this.colors[b] = 1
        ncol++
      }
    }
  }
  this.collisions = ncol
}

module.exports = QuadTreeSimulator_Broken