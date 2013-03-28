"use strict"

var numeric = require("numeric")
var jsQuad = require("./src/MXCIFQuadTree")

var Circle = function(x, y, r, id) {
  this.x = x
  this.y = y
  this.r = r
  this.id = id
};
Circle.prototype = {
  // jsQuad methods
  QTsetParent: function(parent) {
    this.QTparent = parent;
  },
  QTgetParent: function() {
    return this.QTparent;
  },
  QTenclosed: function(xMin,yMin,xMax,yMax) {
    var x0 = this.x-this.r, x1 = this.x+this.r;
    var y0 = this.y-this.r, y1 = this.y+this.r;
    return x0 >= xMin && x1 <= xMax && y0 >= yMin && y1 <= yMax;
  },
  QToverlaps: function(xMin,yMin,xMax,yMax) {
    var x0 = this.x-this.r, x1 = this.x+this.r;
    var y0 = this.y-this.r, y1 = this.y+this.r;
    return !(x1 < xMin || x0 > xMax || y1 < yMin || y0 > yMax);
  },
  QTquadrantNode: function(node, x, y) {
    var x0 = this.x-this.r, x1 = this.x+this.r;
    if (x0 > x) {
      var y0 = this.y-this.r, y1 = this.y+this.r;
      if (y0 > y) {
        return node.q1;
      } else if (y1 < y) {
        return node.q4;
      } else {
        return null;
      }
    } else if (x1 < x) {
      var y0 = this.y-this.r, y1 = this.y+this.r;
      if (y0 > y) {
        return node.q2;
      } else if (y1 < y) {
        return node.q3;
      } else {
        return null;
      }
    } else {
      return null;
    }
  },
};


function jsQuad_MXCIFQuadTreeSimulator(n, size, radius) {
  this.colors = numeric.rep([n], 0)
  this.size = size
  this.radius = radius
  this.points = numeric.mul(size, numeric.random([n, 2]))
  this.velocities = numeric.add(-0.5,numeric.random([n,2]))
  var qdepth = Math.ceil(Math.log(0.5*size/radius))
  this.tree = new jsQuad(0, 0, size, size, qdepth)  
  this.circles = new Array(this.points.length)
  for(var i=0; i<this.points.length; ++i) {
    this.circles[i] = new Circle(this.points[i][0], this.points[i][1], radius, i)
    this.tree.insert(this.circles[i])
  }
  this.collisions = 0
}

jsQuad_MXCIFQuadTreeSimulator.prototype.step = function() {
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
    
    //Update quadtree
    var C = this.circles[i]
    C.x = P[0]
    C.y = P[1]
    this.tree.reinsert(C)
  }

  //Check for collisions
  var ncol = 0
  var colors = this.colors
  for(var i=0; i<len; ++i) {
    var P = this.points[i]
    this.tree.applyOverlapping(P[0]-radius,P[1]-radius,P[0]+radius,P[1]+radius, function(t) {
      if (t.id < i) {
        var dx = P[0] - t.x;
        var dy = P[1] - t.y;
        var d2 = dx*dx+dy*dy;
        if (d2 <= r2) {
          ncol++
          colors[i] = colors[t.id] = 1
        }
      }
    })
  }
  this.collisions = ncol
}

module.exports = jsQuad_MXCIFQuadTreeSimulator