"use strict"

var numeric = require("numeric")
var HashMap = require("./src/CraftyHashTable").HashMap
var uniq = require("uniq")

function Crafty_HashSimulator(n, size, radius) {
  this.colors = numeric.rep([n], 0)
  this.size = size
  this.radius = radius
  this.points = numeric.mul(size, numeric.random([n, 2]))
  this.velocities = numeric.add(-0.5,numeric.random([n,2]))
  this.rects = new Array(n)
  for(var i=0; i<n; ++i) {
    this.rects[i] = {
      _x: this.points[i][0]-radius,
      _y: this.points[i][1]-radius,
      _w: 2*radius,
      _h: 2*radius,
      id: i
    }
  }
  this.collisions = 0
}

Crafty_HashSimulator.prototype.step = function() {
  var len = this.points.length
  var size = this.size
  var radius = this.radius
  var r2 = 4*radius * radius

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
    
    //Update rectangle
    var R = this.rects[i]
    R._x = P[0] - radius
    R._y = P[0] + radius
  }
  var grid = new HashMap(4*radius)

  //Insert points into quad tree
  var ncol = 0
  for(var i=0; i<len; ++i) {
    var items = grid.search(this.rects[i], false)
    var P = this.points[i]
    for(var j=0, jlen=items.length; j<jlen; ++j) {
      items[j] = items[j].id
    }
    items.sort()
    uniq(items)
    for(var j=0, jlen = items.length; j<jlen; ++j) {
      var b = items[j]
      var Q = this.points[b]
      var dx = P[0] - Q[0]
      var dy = P[1] - Q[1]
      if(dx*dx + dy*dy <= r2) {
        this.colors[i] = this.colors[b] = 1
        ncol++
      }
    }
    grid.insert(this.rects[i])
  }
  this.collisions = ncol
}

module.exports = Crafty_HashSimulator