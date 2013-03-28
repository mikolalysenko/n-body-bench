;(function(e,t,n,r){function i(r){if(!n[r]){if(!t[r]){if(e)return e(r);throw new Error("Cannot find module '"+r+"'")}var s=n[r]={exports:{}};t[r][0](function(e){var n=t[r][1][e];return i(n?n:e)},s,s.exports)}return n[r].exports}for(var s=0;s<r.length;s++)i(r[s]);return i})(typeof require!=="undefined"&&require,{1:[function(require,module,exports){
module.exports = [
  require("./brute-force.js")
  ,require("./nbp.js")
  ,require("./mxcif-quadtree.js")
  ,require("./craftyhashtable.js")
  ,require("./jsts-strtree.js")
  //,require("./quadtree-broken.js")
]

},{"./brute-force.js":2,"./nbp.js":3,"./mxcif-quadtree.js":4,"./craftyhashtable.js":5,"./jsts-strtree.js":6}],7:[function(require,module,exports){
"use strict"

var SIZE = 500
var RADIUS = 10
var SIMULATORS = require("./simulators")

var canvas = document.createElement("canvas")
canvas.width = canvas.height = SIZE
document.body.appendChild(canvas)
var context = canvas.getContext("2d")
var simulator = null
var ftime = 0.0

var container = document.createElement("div")
document.body.appendChild(container)
var particleCount = document.createElement("select")
for(var i=50; i<20000; i*=5) {
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

var collideDisplay = document.createTextNode("0 collisions")
container.appendChild(collideDisplay)

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
    context.arc(p[0], p[1], RADIUS, 0, 2.0*Math.PI, false)
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
    timeDisplay.nodeValue = ftime + " ms"
    collideDisplay.nodeValue = simulator.collisions + " collisions"
  }
}, 1)

restartSimulator()
},{"./simulators":1,"raf":8}],8:[function(require,module,exports){
(function(){module.exports = raf

var EE = require('events').EventEmitter
  , global = typeof window === 'undefined' ? this : window

var _raf =
  global.requestAnimationFrame ||
  global.webkitRequestAnimationFrame ||
  global.mozRequestAnimationFrame ||
  global.msRequestAnimationFrame ||
  global.oRequestAnimationFrame ||
  (global.setImmediate ? function(fn, el) {
    setImmediate(fn)
  } :
  function(fn, el) {
    setTimeout(fn, 0)
  })

function raf(el) {
  var now = raf.now()
    , ee = new EE

  ee.pause = function() { ee.paused = true }
  ee.resume = function() { ee.paused = false }

  _raf(iter, el)

  return ee

  function iter(timestamp) {
    var _now = raf.now()
      , dt = _now - now
    
    now = _now

    ee.emit('data', dt)

    if(!ee.paused) {
      _raf(iter, el)
    }
  }
}

raf.polyfill = _raf
raf.now = function() { return Date.now() }

})()
},{"events":9}],10:[function(require,module,exports){
/*
Author: Patrick DeHaan <me@pdehaan.com>
Brief:  MX-CIF Quadtrees implementation in javascript.

Copyright (c) 2011 Patrick DeHaan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
var jsQuad = (function() {

var selection = [];

var Node = function(xMin, yMin, xMax, yMax, maxDepth, parent) {
	this.xMin = xMin;
	this.yMin = yMin;
	this.xMax = xMax;
	this.yMax = yMax;
	this.x = (xMax+xMin)/2;
	this.y = (yMax+yMin)/2;
	this.maxDepth = maxDepth === undefined ? 4 : maxDepth;
	this.children = [];
	this.q1 = null;
	this.q2 = null;
	this.q3 = null;
	this.q4 = null;
	this.parent = parent === undefined ? null : parent;
};

// It will run this itself, not you.
var subdivide = function(node, depth) {
	var xMin = node.xMin, yMin = node.yMin,
		xMax = node.xMax, yMax = node.yMax,
		x = node.x, y = node.y;
	node.q1 = new Node(x, y, xMax, yMax, depth, node);
	node.q2 = new Node(xMin, y, x, yMax, depth, node);
	node.q3 = new Node(xMin, yMin, x, y, depth, node);
	node.q4 = new Node(x, yMin, xMax, y, depth, node);
};

Node.prototype = {
	clear: function() {
		this.children.length = 0;
		this.q1.clear();
		this.q2.clear();
		this.q3.clear();
		this.q4.clear();
		this.q1 = null;
		this.q2 = null;
		this.q3 = null;
		this.q4 = null;
	},
	insert: function(child) {
		var node = this;
		// first establish the object is even in the node. If not, just make
		// it a child and move on. This
		if (child.QTenclosed(node.xMin,node.yMin,node.xMax,node.yMax)) {
			this._insert(child);
		}
		
		// TODO: non-enclosed objects should probably either throw an error or
		// cause the node to create parents for itself. This solutions keeps
		// track of the object, but will cause false positives when selection
		// boundaries enclose the node. Another possible solution is to create
		// a seperate container for them.
		else {
			node.children.push(child);
			child.QTsetParent(node);
		}
	},
	_insert: function(child) {
		var node = this;
		if (node.q1 === null && node.maxDepth > 0) {
			subdivide(node, node.maxDepth-1);
		}
		if (node.q1 !== null) {
			var q = child.QTquadrantNode(node, node.x, node.y);
			if (q !== null) {
				q._insert(child);
			} else {
				node.children.push(child);
				child.QTsetParent(node);
			}
		} else {
			node.children.push(child);
			child.QTsetParent(node);
		}
	},
	reinsert: function(child) {
		var parent = child.QTgetParent();
		parent._remove(child);
		parent._reinsert(child);
	},
	_reinsert: function(child) {
		if (child.QTenclosed(this.xMin, this.yMin, this.xMax, this.yMax)) {
			this._insert(child);
		} else {
			if (this.parent === null) { return; }
			this.parent._reinsert(child);
		}
	},
	remove: function(child) {
		// the child's parent is cached so this doesn't have to search half
		// the tree
		child.QTgetParent().remove(child);
	},
	_remove: function(child) {
		// search children to get the index of the child, then splice it out
		for (var i=0; i<this.children.length;i++) {
			if (this.children[i] === child) {
				this.children.splice(i,1);
			}
		}
	},
	getChildren: function() {
		selection.length = 0;
		this.selectChildren();
		return selection;
	},
	selectChildren: function() {
		// push all children into the list
		selection.push.apply(selection, this.children);
		
		// recurse if there are sub-nodes
		if (this.q1 !== null) {
			this.q1.selectChildren();
			this.q2.selectChildren();
			this.q3.selectChildren();
			this.q4.selectChildren();
		}
	},
	getEnclosed: function(xMin, yMin, xMax, yMax) {
		selection.length = 0;
		this.selectEnclosed(xMin, yMin, xMax, yMax);
		return selection;
	},
	selectEnclosed: function(xMin, yMin, xMax, yMax) {
		// move along if there isn't even a boundary overlap
		if (this.xMax < xMin || this.xMin > xMax || this.yMax < yMin || this.yMin > yMax) {
			return;
		}
		
		// entire node is enclosed, select everything
		if (xMin <= this.xMin && xMax >= this.xMax && yMin <= this.yMin && yMax >= this.yMax) {
			// node is entirely enclosed, select all children
			this.selectChildren();
		}
		// node is partially enclosed, search children and sub-nodes
		else {
			// search subnodes if we have them
			if (this.q1 !== null) {
				this.q1.selectEnclosed(xMin, yMin, xMax, yMax);
				this.q2.selectEnclosed(xMin, yMin, xMax, yMax);
				this.q3.selectEnclosed(xMin, yMin, xMax, yMax);
				this.q4.selectEnclosed(xMin, yMin, xMax, yMax);
			}
			// find enclosed children
			for (var i=0; i<this.children.length; i++) {
				if (this.children[i].QTenclosed(xMin, yMin, xMax, yMax)) {
					selection.push(this.children[i]);
				}
			}
		}
	},
	getOverlapping: function(xMin, yMin, xMax, yMax) {
		selection.length = 0;
		this.selectOverlapping(xMin, yMin, xMax, yMax);
		return selection;
	},
	selectOverlapping: function(xMin, yMin, xMax, yMax) {
		// move along if there isn't even a boundary overlap
		if (this.xMax < xMin || this.xMin > xMax || this.yMax < yMin || this.yMin > yMax) {
			return;
		}
		
		// entire node is enclosed, select everything
		if (xMin <= this.xMin && xMax >= this.xMax && yMin <= this.yMin && yMax >= this.yMax) {
			// node is entirely enclosed, select all children
			this.selectChildren();
		}
		// node is partially enclosed, search children and sub-nodes
		else {
			// search subnodes if we have them
			if (this.q1 !== null) {
				this.q1.selectOverlapping(xMin, yMin, xMax, yMax);
				this.q2.selectOverlapping(xMin, yMin, xMax, yMax);
				this.q3.selectOverlapping(xMin, yMin, xMax, yMax);
				this.q4.selectOverlapping(xMin, yMin, xMax, yMax);
			}
			// find enclosed children
			for (var i=0; i<this.children.length; i++) {
				if (this.children[i].QToverlaps(xMin, yMin, xMax, yMax)) {
					selection.push(this.children[i]);
				}
			}
		}
	},
	// TODO: the following methods are basically hacks built on the get methods,
	// they can run faster. The apply functions in particular should get a boost
	// by not needing to do list manipulation
	mapChildren: function(callback) {
		selection.length = 0;
		this.selectChildren();
		var n = selection.length;
		for (var i=0; i<n; i++) {
			selection[i] = callback(selection[i]);
		}
		return selection;
	},
	mapEnclosed: function(xMin, yMin, xMax, yMax, callback) {
		selection.length = 0;
		this.selectEnclosed(xMin, yMin, xMax, yMax);
		var n = selection.length;
		for (var i=0; i<n; i++) {
			selection[i] = callback(selection[i]);
		}
		return selection;
	},
	mapOverlapping: function(xMin, yMin, xMax, yMax, callback) {
		selection.length = 0;
		this.selectOverlapping(xMin, yMin, xMax, yMax);
		var n = selection.length;
		for (var i=0; i<n; i++) {
			selection[i] = callback(selection[i]);
		}
		return selection;
	},
	applyChildren: function(callback) {
		selection.length = 0;
		this.selectChildren();
		var n = selection.length;
		for (var i=0; i<n; i++) {
			callback(selection[i]);
		}
	},
	applyEnclosed: function(xMin, yMin, xMax, yMax, callback) {
		selection.length = 0;
		this.selectEnclosed(xMin, yMin, xMax, yMax);
		var n = selection.length;
		for (var i=0; i<n; i++) {
			callback(selection[i]);
		}
	},
	applyOverlapping: function(xMin, yMin, xMax, yMax, callback) {
		selection.length = 0;
		this.selectOverlapping(xMin, yMin, xMax, yMax);
		var n = selection.length;
		for (var i=0; i<n; i++) {
			callback(selection[i]);
		}
	}
};

return Node; })();

module.exports = jsQuad
},{}],11:[function(require,module,exports){
/**
* Spatial HashMap for broad phase collision
*
* @author Louis Stowasser
*/
(function (parent) {


	/**@
	* #Crafty.HashMap.constructor
	* @comp Crafty.HashMap
	* @sign public void Crafty.HashMap([cellsize])
	* @param cellsize - the cell size. If omitted, `cellsize` is 64.
	* 
    * Set `cellsize`.
    * And create `this.map`.
	*/
	var cellsize,

	HashMap = function (cell) {
		cellsize = cell || 64;
		this.map = {};
	},

	SPACE = " ";

	HashMap.prototype = {
	/**@
	* #Crafty.map.insert
	* @comp Crafty.map
    * @sign public Object Crafty.map.insert(Object obj)
	* @param obj - An entity to be inserted.
	* 
    * `obj` is inserted in '.map' of the corresponding broad phase cells. An object of the following fields is returned.
    * ~~~
    * - the object that keep track of cells (keys)
    * - `obj`
    * - the HashMap object
    * ~~~
	*/
		insert: function (obj) {
			var keys = HashMap.key(obj),
			entry = new Entry(keys, obj, this),
			i = 0,
			j,
			hash;

			//insert into all x buckets
			for (i = keys.x1; i <= keys.x2; i++) {
				//insert into all y buckets
				for (j = keys.y1; j <= keys.y2; j++) {
					hash = i + SPACE + j;
					if (!this.map[hash]) this.map[hash] = [];
					this.map[hash].push(obj);
				}
			}

			return entry;
		},

	/**@
	* #Crafty.map.search
	* @comp Crafty.map
    * @sign public Object Crafty.map.search(Object rect[, Boolean filter])
	* @param rect - the rectangular region to search for entities.
	* @param filter - Default value is true. Otherwise, must be false.
	* 
    * - If `filter` is `false`, just search for all the entries in the give `rect` region by broad phase collision. Entity may be returned duplicated.
    * - If `filter` is `true`, filter the above results by checking that they actually overlap `rect`.
    * The easier usage is with `filter`=`true`. For performance reason, you may use `filter`=`false`, and filter the result yourself. See examples in drawing.js and collision.js
	*/
		search: function (rect, filter) {
			var keys = HashMap.key(rect),
			i, j,
			hash,
			results = [];

			if (filter === undefined) filter = true; //default filter to true

			//search in all x buckets
			for (i = keys.x1; i <= keys.x2; i++) {
				//insert into all y buckets
				for (j = keys.y1; j <= keys.y2; j++) {
					hash = i + SPACE + j;

					if (this.map[hash]) {
						results = results.concat(this.map[hash]);
					}
				}
			}

			if (filter) {
				var obj, id, finalresult = [], found = {};
				//add unique elements to lookup table with the entity ID as unique key
				for (i = 0, l = results.length; i < l; i++) {
					obj = results[i];
					if (!obj) continue; //skip if deleted
					id = obj[0]; //unique ID

					//check if not added to hash and that actually intersects
					if (!found[id] && obj.x < rect._x + rect._w && obj._x + obj._w > rect._x &&
								 obj.y < rect._y + rect._h && obj._h + obj._y > rect._y)
						found[id] = results[i];
				}

				//loop over lookup table and copy to final array
				for (obj in found) finalresult.push(found[obj]);

				return finalresult;
			} else {
				return results;
			}
		},

	/**@
	* #Crafty.map.remove
	* @comp Crafty.map
	* @sign public void Crafty.map.remove([Object keys, ]Object obj)
	* @param keys - key region. If omitted, it will be derived from obj by `Crafty.HashMap.key`.
	* @param obj - need more document.
	* 
	* Remove an entity in a broad phase map.
	* - The second form is only used in Crafty.HashMap to save time for computing keys again, where keys were computed previously from obj. End users should not call this form directly.
	*
	* @example 
	* ~~~
	* Crafty.map.remove(e);
	* ~~~
	*/
		remove: function (keys, obj) {
			var i = 0, j, hash;

			if (arguments.length == 1) {
				obj = keys;
				keys = HashMap.key(obj);
			}

			//search in all x buckets
			for (i = keys.x1; i <= keys.x2; i++) {
				//insert into all y buckets
				for (j = keys.y1; j <= keys.y2; j++) {
					hash = i + SPACE + j;

					if (this.map[hash]) {
						var cell = this.map[hash],
						m,
						n = cell.length;
						//loop over objs in cell and delete
						for (m = 0; m < n; m++)
							if (cell[m] && cell[m][0] === obj[0])
								cell.splice(m, 1);
					}
				}
			}
		},

	/**@
	* #Crafty.map.boundaries
	* @comp Crafty.map
	* @sign public Object Crafty.map.boundaries()
	* 
    * The return `Object` is of the following format.
    * ~~~
	* {
    *   min: {
    *     x: val_x,
    *     y: val_y
    *   },
    *   max: {
    *     x: val_x,
    *     y: val_y
    *   }
    * }
    * ~~~
	*/
		boundaries: function () {
			var k, ent,
			hash = {
				max: { x: -Infinity, y: -Infinity },
				min: { x: Infinity, y: Infinity }
			},
			coords = {
				max: { x: -Infinity, y: -Infinity },
				min: { x: Infinity, y: Infinity }
			};

      //Using broad phase hash to speed up the computation of boundaries.
			for (var h in this.map) {
				if (!this.map[h].length) continue;

        //broad phase coordinate
				var map_coord = h.split(SPACE),
					i=map_coord[0],
					j=map_coord[0];
				if (i >= hash.max.x) {
					hash.max.x = i;
					for (k in this.map[h]) {
						ent = this.map[h][k];
						//make sure that this is a Crafty entity
						if (typeof ent == 'object' && 'requires' in ent) {
							coords.max.x = Math.max(coords.max.x, ent.x + ent.w);
						}
					}
				}
				if (i <= hash.min.x) {
					hash.min.x = i;
					for (k in this.map[h]) {
						ent = this.map[h][k];
						if (typeof ent == 'object' && 'requires' in ent) {
							coords.min.x = Math.min(coords.min.x, ent.x);
						}
					}
				}
				if (j >= hash.max.y) {
					hash.max.y = j;
					for (k in this.map[h]) {
						ent = this.map[h][k];
						if (typeof ent == 'object' && 'requires' in ent) {
							coords.max.y = Math.max(coords.max.y, ent.y + ent.h);
						}
					}
				}
				if (j <= hash.min.y) {
					hash.min.y = j;
					for (k in this.map[h]) {
						ent = this.map[h][k];
						if (typeof ent == 'object' && 'requires' in ent) {
							coords.min.y = Math.min(coords.min.y, ent.y);
						}
					}
				}
			}

			return coords;
		}
	};

/**@
* #Crafty.HashMap
* @category 2D
* Broad-phase collision detection engine. See background information at 
*
* ~~~
* - [N Tutorial B - Broad-Phase Collision](http://www.metanetsoftware.com/technique/tutorialB.html)
* - [Broad-Phase Collision Detection with CUDA](http.developer.nvidia.com/GPUGems3/gpugems3_ch32.html)
* ~~~
* @see Crafty.map
*/

	/**@
	* #Crafty.HashMap.key
	* @comp Crafty.HashMap
	* @sign public Object Crafty.HashMap.key(Object obj)
	* @param obj - an Object that has .mbr() or _x, _y, _w and _h.
    * Get the rectangular region (in terms of the grid, with grid size `cellsize`), where the object may fall in. This region is determined by the object's bounding box.
    * The `cellsize` is 64 by default.
    * 
    * @see Crafty.HashMap.constructor
	*/
	HashMap.key = function (obj) {
		if (obj.hasOwnProperty('mbr')) {
			obj = obj.mbr();
		}
		var x1 = Math.floor(obj._x / cellsize),
		y1 = Math.floor(obj._y / cellsize),
		x2 = Math.floor((obj._w + obj._x) / cellsize),
		y2 = Math.floor((obj._h + obj._y) / cellsize);
		return { x1: x1, y1: y1, x2: x2, y2: y2 };
	};

	HashMap.hash = function (keys) {
		return keys.x1 + SPACE + keys.y1 + SPACE + keys.x2 + SPACE + keys.y2;
	};

	function Entry(keys, obj, map) {
		this.keys = keys;
		this.map = map;
		this.obj = obj;
	}

	Entry.prototype = {
		update: function (rect) {
			//check if buckets change
			if (HashMap.hash(HashMap.key(rect)) != HashMap.hash(this.keys)) {
				this.map.remove(this.keys, this.obj);
				var e = this.map.insert(this.obj);
				this.keys = e.keys;
			}
		}
	};

	parent.HashMap = HashMap;
})(module.exports);
},{}],2:[function(require,module,exports){
var numeric = require("numeric")

function BruteForceSimulator(n, size, radius) {
  this.colors = numeric.rep([n], 0)
  this.size = size
  this.radius = radius
  this.points = numeric.mul(size, numeric.random([n, 2]))
  this.velocities = numeric.add(-0.5,numeric.random([n,2]))
  this.collisions = 0
}

BruteForceSimulator.prototype.step = function() {
  var len = this.points.length
  var size = this.size
  var radius = this.radius
  var r2 = 4*radius * radius

  var ncol = 0

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
        ncol++
      }
    }
  }
  this.collisions = ncol
}

module.exports = BruteForceSimulator

},{"numeric":12}],4:[function(require,module,exports){
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
},{"./src/MXCIFQuadTree":10,"numeric":12}],3:[function(require,module,exports){
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

},{"numeric":12,"n-body-pairs":13}],14:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],9:[function(require,module,exports){
(function(process){if (!process.EventEmitter) process.EventEmitter = function () {};

var EventEmitter = exports.EventEmitter = process.EventEmitter;
var isArray = typeof Array.isArray === 'function'
    ? Array.isArray
    : function (xs) {
        return Object.prototype.toString.call(xs) === '[object Array]'
    }
;
function indexOf (xs, x) {
    if (xs.indexOf) return xs.indexOf(x);
    for (var i = 0; i < xs.length; i++) {
        if (x === xs[i]) return i;
    }
    return -1;
}

// By default EventEmitters will print a warning if more than
// 10 listeners are added to it. This is a useful default which
// helps finding memory leaks.
//
// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
var defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!this._events) this._events = {};
  this._events.maxListeners = n;
};


EventEmitter.prototype.emit = function(type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        var args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var args = Array.prototype.slice.call(arguments, 1);

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {

    // Check for listener leak
    if (!this._events[type].warned) {
      var m;
      if (this._events.maxListeners !== undefined) {
        m = this._events.maxListeners;
      } else {
        m = defaultMaxListeners;
      }

      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' +
                      'leak detected. %d listeners added. ' +
                      'Use emitter.setMaxListeners() to increase limit.',
                      this._events[type].length);
        console.trace();
      }
    }

    // If we've already got an array, just append.
    this._events[type].push(listener);
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  var self = this;
  self.on(type, function g() {
    self.removeListener(type, g);
    listener.apply(this, arguments);
  });

  return this;
};

EventEmitter.prototype.removeListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var i = indexOf(list, listener);
    if (i < 0) return this;
    list.splice(i, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (this._events[type] === listener) {
    delete this._events[type];
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  if (arguments.length === 0) {
    this._events = {};
    return this;
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function(type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};

})(require("__browserify_process"))
},{"__browserify_process":14}],5:[function(require,module,exports){
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
},{"./src/CraftyHashTable":11,"numeric":12,"uniq":15}],6:[function(require,module,exports){
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
},{"numeric":12,"jsts":16}],12:[function(require,module,exports){
(function(global){"use strict";

var numeric = (typeof exports === "undefined")?(function numeric() {}):(exports);
if(typeof global !== "undefined") { global.numeric = numeric; }

numeric.version = "1.2.6";

// 1. Utility functions
numeric.bench = function bench (f,interval) {
    var t1,t2,n,i;
    if(typeof interval === "undefined") { interval = 15; }
    n = 0.5;
    t1 = new Date();
    while(1) {
        n*=2;
        for(i=n;i>3;i-=4) { f(); f(); f(); f(); }
        while(i>0) { f(); i--; }
        t2 = new Date();
        if(t2-t1 > interval) break;
    }
    for(i=n;i>3;i-=4) { f(); f(); f(); f(); }
    while(i>0) { f(); i--; }
    t2 = new Date();
    return 1000*(3*n-1)/(t2-t1);
}

numeric._myIndexOf = (function _myIndexOf(w) {
    var n = this.length,k;
    for(k=0;k<n;++k) if(this[k]===w) return k;
    return -1;
});
numeric.myIndexOf = (Array.prototype.indexOf)?Array.prototype.indexOf:numeric._myIndexOf;

numeric.Function = Function;
numeric.precision = 4;
numeric.largeArray = 50;

numeric.prettyPrint = function prettyPrint(x) {
    function fmtnum(x) {
        if(x === 0) { return '0'; }
        if(isNaN(x)) { return 'NaN'; }
        if(x<0) { return '-'+fmtnum(-x); }
        if(isFinite(x)) {
            var scale = Math.floor(Math.log(x) / Math.log(10));
            var normalized = x / Math.pow(10,scale);
            var basic = normalized.toPrecision(numeric.precision);
            if(parseFloat(basic) === 10) { scale++; normalized = 1; basic = normalized.toPrecision(numeric.precision); }
            return parseFloat(basic).toString()+'e'+scale.toString();
        }
        return 'Infinity';
    }
    var ret = [];
    function foo(x) {
        var k;
        if(typeof x === "undefined") { ret.push(Array(numeric.precision+8).join(' ')); return false; }
        if(typeof x === "string") { ret.push('"'+x+'"'); return false; }
        if(typeof x === "boolean") { ret.push(x.toString()); return false; }
        if(typeof x === "number") {
            var a = fmtnum(x);
            var b = x.toPrecision(numeric.precision);
            var c = parseFloat(x.toString()).toString();
            var d = [a,b,c,parseFloat(b).toString(),parseFloat(c).toString()];
            for(k=1;k<d.length;k++) { if(d[k].length < a.length) a = d[k]; }
            ret.push(Array(numeric.precision+8-a.length).join(' ')+a);
            return false;
        }
        if(x === null) { ret.push("null"); return false; }
        if(typeof x === "function") { 
            ret.push(x.toString());
            var flag = false;
            for(k in x) { if(x.hasOwnProperty(k)) { 
                if(flag) ret.push(',\n');
                else ret.push('\n{');
                flag = true; 
                ret.push(k); 
                ret.push(': \n'); 
                foo(x[k]); 
            } }
            if(flag) ret.push('}\n');
            return true;
        }
        if(x instanceof Array) {
            if(x.length > numeric.largeArray) { ret.push('...Large Array...'); return true; }
            var flag = false;
            ret.push('[');
            for(k=0;k<x.length;k++) { if(k>0) { ret.push(','); if(flag) ret.push('\n '); } flag = foo(x[k]); }
            ret.push(']');
            return true;
        }
        ret.push('{');
        var flag = false;
        for(k in x) { if(x.hasOwnProperty(k)) { if(flag) ret.push(',\n'); flag = true; ret.push(k); ret.push(': \n'); foo(x[k]); } }
        ret.push('}');
        return true;
    }
    foo(x);
    return ret.join('');
}

numeric.parseDate = function parseDate(d) {
    function foo(d) {
        if(typeof d === 'string') { return Date.parse(d.replace(/-/g,'/')); }
        if(!(d instanceof Array)) { throw new Error("parseDate: parameter must be arrays of strings"); }
        var ret = [],k;
        for(k=0;k<d.length;k++) { ret[k] = foo(d[k]); }
        return ret;
    }
    return foo(d);
}

numeric.parseFloat = function parseFloat_(d) {
    function foo(d) {
        if(typeof d === 'string') { return parseFloat(d); }
        if(!(d instanceof Array)) { throw new Error("parseFloat: parameter must be arrays of strings"); }
        var ret = [],k;
        for(k=0;k<d.length;k++) { ret[k] = foo(d[k]); }
        return ret;
    }
    return foo(d);
}

numeric.parseCSV = function parseCSV(t) {
    var foo = t.split('\n');
    var j,k;
    var ret = [];
    var pat = /(([^'",]*)|('[^']*')|("[^"]*")),/g;
    var patnum = /^\s*(([+-]?[0-9]+(\.[0-9]*)?(e[+-]?[0-9]+)?)|([+-]?[0-9]*(\.[0-9]+)?(e[+-]?[0-9]+)?))\s*$/;
    var stripper = function(n) { return n.substr(0,n.length-1); }
    var count = 0;
    for(k=0;k<foo.length;k++) {
      var bar = (foo[k]+",").match(pat),baz;
      if(bar.length>0) {
          ret[count] = [];
          for(j=0;j<bar.length;j++) {
              baz = stripper(bar[j]);
              if(patnum.test(baz)) { ret[count][j] = parseFloat(baz); }
              else ret[count][j] = baz;
          }
          count++;
      }
    }
    return ret;
}

numeric.toCSV = function toCSV(A) {
    var s = numeric.dim(A);
    var i,j,m,n,row,ret;
    m = s[0];
    n = s[1];
    ret = [];
    for(i=0;i<m;i++) {
        row = [];
        for(j=0;j<m;j++) { row[j] = A[i][j].toString(); }
        ret[i] = row.join(', ');
    }
    return ret.join('\n')+'\n';
}

numeric.getURL = function getURL(url) {
    var client = new XMLHttpRequest();
    client.open("GET",url,false);
    client.send();
    return client;
}

numeric.imageURL = function imageURL(img) {
    function base64(A) {
        var n = A.length, i,x,y,z,p,q,r,s;
        var key = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var ret = "";
        for(i=0;i<n;i+=3) {
            x = A[i];
            y = A[i+1];
            z = A[i+2];
            p = x >> 2;
            q = ((x & 3) << 4) + (y >> 4);
            r = ((y & 15) << 2) + (z >> 6);
            s = z & 63;
            if(i+1>=n) { r = s = 64; }
            else if(i+2>=n) { s = 64; }
            ret += key.charAt(p) + key.charAt(q) + key.charAt(r) + key.charAt(s);
            }
        return ret;
    }
    function crc32Array (a,from,to) {
        if(typeof from === "undefined") { from = 0; }
        if(typeof to === "undefined") { to = a.length; }
        var table = [0x00000000, 0x77073096, 0xEE0E612C, 0x990951BA, 0x076DC419, 0x706AF48F, 0xE963A535, 0x9E6495A3,
                     0x0EDB8832, 0x79DCB8A4, 0xE0D5E91E, 0x97D2D988, 0x09B64C2B, 0x7EB17CBD, 0xE7B82D07, 0x90BF1D91, 
                     0x1DB71064, 0x6AB020F2, 0xF3B97148, 0x84BE41DE, 0x1ADAD47D, 0x6DDDE4EB, 0xF4D4B551, 0x83D385C7,
                     0x136C9856, 0x646BA8C0, 0xFD62F97A, 0x8A65C9EC, 0x14015C4F, 0x63066CD9, 0xFA0F3D63, 0x8D080DF5, 
                     0x3B6E20C8, 0x4C69105E, 0xD56041E4, 0xA2677172, 0x3C03E4D1, 0x4B04D447, 0xD20D85FD, 0xA50AB56B, 
                     0x35B5A8FA, 0x42B2986C, 0xDBBBC9D6, 0xACBCF940, 0x32D86CE3, 0x45DF5C75, 0xDCD60DCF, 0xABD13D59, 
                     0x26D930AC, 0x51DE003A, 0xC8D75180, 0xBFD06116, 0x21B4F4B5, 0x56B3C423, 0xCFBA9599, 0xB8BDA50F,
                     0x2802B89E, 0x5F058808, 0xC60CD9B2, 0xB10BE924, 0x2F6F7C87, 0x58684C11, 0xC1611DAB, 0xB6662D3D,
                     0x76DC4190, 0x01DB7106, 0x98D220BC, 0xEFD5102A, 0x71B18589, 0x06B6B51F, 0x9FBFE4A5, 0xE8B8D433,
                     0x7807C9A2, 0x0F00F934, 0x9609A88E, 0xE10E9818, 0x7F6A0DBB, 0x086D3D2D, 0x91646C97, 0xE6635C01, 
                     0x6B6B51F4, 0x1C6C6162, 0x856530D8, 0xF262004E, 0x6C0695ED, 0x1B01A57B, 0x8208F4C1, 0xF50FC457, 
                     0x65B0D9C6, 0x12B7E950, 0x8BBEB8EA, 0xFCB9887C, 0x62DD1DDF, 0x15DA2D49, 0x8CD37CF3, 0xFBD44C65, 
                     0x4DB26158, 0x3AB551CE, 0xA3BC0074, 0xD4BB30E2, 0x4ADFA541, 0x3DD895D7, 0xA4D1C46D, 0xD3D6F4FB, 
                     0x4369E96A, 0x346ED9FC, 0xAD678846, 0xDA60B8D0, 0x44042D73, 0x33031DE5, 0xAA0A4C5F, 0xDD0D7CC9, 
                     0x5005713C, 0x270241AA, 0xBE0B1010, 0xC90C2086, 0x5768B525, 0x206F85B3, 0xB966D409, 0xCE61E49F, 
                     0x5EDEF90E, 0x29D9C998, 0xB0D09822, 0xC7D7A8B4, 0x59B33D17, 0x2EB40D81, 0xB7BD5C3B, 0xC0BA6CAD, 
                     0xEDB88320, 0x9ABFB3B6, 0x03B6E20C, 0x74B1D29A, 0xEAD54739, 0x9DD277AF, 0x04DB2615, 0x73DC1683, 
                     0xE3630B12, 0x94643B84, 0x0D6D6A3E, 0x7A6A5AA8, 0xE40ECF0B, 0x9309FF9D, 0x0A00AE27, 0x7D079EB1, 
                     0xF00F9344, 0x8708A3D2, 0x1E01F268, 0x6906C2FE, 0xF762575D, 0x806567CB, 0x196C3671, 0x6E6B06E7, 
                     0xFED41B76, 0x89D32BE0, 0x10DA7A5A, 0x67DD4ACC, 0xF9B9DF6F, 0x8EBEEFF9, 0x17B7BE43, 0x60B08ED5, 
                     0xD6D6A3E8, 0xA1D1937E, 0x38D8C2C4, 0x4FDFF252, 0xD1BB67F1, 0xA6BC5767, 0x3FB506DD, 0x48B2364B, 
                     0xD80D2BDA, 0xAF0A1B4C, 0x36034AF6, 0x41047A60, 0xDF60EFC3, 0xA867DF55, 0x316E8EEF, 0x4669BE79, 
                     0xCB61B38C, 0xBC66831A, 0x256FD2A0, 0x5268E236, 0xCC0C7795, 0xBB0B4703, 0x220216B9, 0x5505262F, 
                     0xC5BA3BBE, 0xB2BD0B28, 0x2BB45A92, 0x5CB36A04, 0xC2D7FFA7, 0xB5D0CF31, 0x2CD99E8B, 0x5BDEAE1D, 
                     0x9B64C2B0, 0xEC63F226, 0x756AA39C, 0x026D930A, 0x9C0906A9, 0xEB0E363F, 0x72076785, 0x05005713, 
                     0x95BF4A82, 0xE2B87A14, 0x7BB12BAE, 0x0CB61B38, 0x92D28E9B, 0xE5D5BE0D, 0x7CDCEFB7, 0x0BDBDF21, 
                     0x86D3D2D4, 0xF1D4E242, 0x68DDB3F8, 0x1FDA836E, 0x81BE16CD, 0xF6B9265B, 0x6FB077E1, 0x18B74777, 
                     0x88085AE6, 0xFF0F6A70, 0x66063BCA, 0x11010B5C, 0x8F659EFF, 0xF862AE69, 0x616BFFD3, 0x166CCF45, 
                     0xA00AE278, 0xD70DD2EE, 0x4E048354, 0x3903B3C2, 0xA7672661, 0xD06016F7, 0x4969474D, 0x3E6E77DB, 
                     0xAED16A4A, 0xD9D65ADC, 0x40DF0B66, 0x37D83BF0, 0xA9BCAE53, 0xDEBB9EC5, 0x47B2CF7F, 0x30B5FFE9, 
                     0xBDBDF21C, 0xCABAC28A, 0x53B39330, 0x24B4A3A6, 0xBAD03605, 0xCDD70693, 0x54DE5729, 0x23D967BF, 
                     0xB3667A2E, 0xC4614AB8, 0x5D681B02, 0x2A6F2B94, 0xB40BBE37, 0xC30C8EA1, 0x5A05DF1B, 0x2D02EF8D];
     
        var crc = -1, y = 0, n = a.length,i;

        for (i = from; i < to; i++) {
            y = (crc ^ a[i]) & 0xFF;
            crc = (crc >>> 8) ^ table[y];
        }
     
        return crc ^ (-1);
    }

    var h = img[0].length, w = img[0][0].length, s1, s2, next,k,length,a,b,i,j,adler32,crc32;
    var stream = [
                  137, 80, 78, 71, 13, 10, 26, 10,                           //  0: PNG signature
                  0,0,0,13,                                                  //  8: IHDR Chunk length
                  73, 72, 68, 82,                                            // 12: "IHDR" 
                  (w >> 24) & 255, (w >> 16) & 255, (w >> 8) & 255, w&255,   // 16: Width
                  (h >> 24) & 255, (h >> 16) & 255, (h >> 8) & 255, h&255,   // 20: Height
                  8,                                                         // 24: bit depth
                  2,                                                         // 25: RGB
                  0,                                                         // 26: deflate
                  0,                                                         // 27: no filter
                  0,                                                         // 28: no interlace
                  -1,-2,-3,-4,                                               // 29: CRC
                  -5,-6,-7,-8,                                               // 33: IDAT Chunk length
                  73, 68, 65, 84,                                            // 37: "IDAT"
                  // RFC 1950 header starts here
                  8,                                                         // 41: RFC1950 CMF
                  29                                                         // 42: RFC1950 FLG
                  ];
    crc32 = crc32Array(stream,12,29);
    stream[29] = (crc32>>24)&255;
    stream[30] = (crc32>>16)&255;
    stream[31] = (crc32>>8)&255;
    stream[32] = (crc32)&255;
    s1 = 1;
    s2 = 0;
    for(i=0;i<h;i++) {
        if(i<h-1) { stream.push(0); }
        else { stream.push(1); }
        a = (3*w+1+(i===0))&255; b = ((3*w+1+(i===0))>>8)&255;
        stream.push(a); stream.push(b);
        stream.push((~a)&255); stream.push((~b)&255);
        if(i===0) stream.push(0);
        for(j=0;j<w;j++) {
            for(k=0;k<3;k++) {
                a = img[k][i][j];
                if(a>255) a = 255;
                else if(a<0) a=0;
                else a = Math.round(a);
                s1 = (s1 + a )%65521;
                s2 = (s2 + s1)%65521;
                stream.push(a);
            }
        }
        stream.push(0);
    }
    adler32 = (s2<<16)+s1;
    stream.push((adler32>>24)&255);
    stream.push((adler32>>16)&255);
    stream.push((adler32>>8)&255);
    stream.push((adler32)&255);
    length = stream.length - 41;
    stream[33] = (length>>24)&255;
    stream[34] = (length>>16)&255;
    stream[35] = (length>>8)&255;
    stream[36] = (length)&255;
    crc32 = crc32Array(stream,37);
    stream.push((crc32>>24)&255);
    stream.push((crc32>>16)&255);
    stream.push((crc32>>8)&255);
    stream.push((crc32)&255);
    stream.push(0);
    stream.push(0);
    stream.push(0);
    stream.push(0);
//    a = stream.length;
    stream.push(73);  // I
    stream.push(69);  // E
    stream.push(78);  // N
    stream.push(68);  // D
    stream.push(174); // CRC1
    stream.push(66);  // CRC2
    stream.push(96);  // CRC3
    stream.push(130); // CRC4
    return 'data:image/png;base64,'+base64(stream);
}

// 2. Linear algebra with Arrays.
numeric._dim = function _dim(x) {
    var ret = [];
    while(typeof x === "object") { ret.push(x.length); x = x[0]; }
    return ret;
}

numeric.dim = function dim(x) {
    var y,z;
    if(typeof x === "object") {
        y = x[0];
        if(typeof y === "object") {
            z = y[0];
            if(typeof z === "object") {
                return numeric._dim(x);
            }
            return [x.length,y.length];
        }
        return [x.length];
    }
    return [];
}

numeric.mapreduce = function mapreduce(body,init) {
    return Function('x','accum','_s','_k',
            'if(typeof accum === "undefined") accum = '+init+';\n'+
            'if(typeof x === "number") { var xi = x; '+body+'; return accum; }\n'+
            'if(typeof _s === "undefined") _s = numeric.dim(x);\n'+
            'if(typeof _k === "undefined") _k = 0;\n'+
            'var _n = _s[_k];\n'+
            'var i,xi;\n'+
            'if(_k < _s.length-1) {\n'+
            '    for(i=_n-1;i>=0;i--) {\n'+
            '        accum = arguments.callee(x[i],accum,_s,_k+1);\n'+
            '    }'+
            '    return accum;\n'+
            '}\n'+
            'for(i=_n-1;i>=1;i-=2) { \n'+
            '    xi = x[i];\n'+
            '    '+body+';\n'+
            '    xi = x[i-1];\n'+
            '    '+body+';\n'+
            '}\n'+
            'if(i === 0) {\n'+
            '    xi = x[i];\n'+
            '    '+body+'\n'+
            '}\n'+
            'return accum;'
            );
}
numeric.mapreduce2 = function mapreduce2(body,setup) {
    return Function('x',
            'var n = x.length;\n'+
            'var i,xi;\n'+setup+';\n'+
            'for(i=n-1;i!==-1;--i) { \n'+
            '    xi = x[i];\n'+
            '    '+body+';\n'+
            '}\n'+
            'return accum;'
            );
}


numeric.same = function same(x,y) {
    var i,n;
    if(!(x instanceof Array) || !(y instanceof Array)) { return false; }
    n = x.length;
    if(n !== y.length) { return false; }
    for(i=0;i<n;i++) {
        if(x[i] === y[i]) { continue; }
        if(typeof x[i] === "object") { if(!same(x[i],y[i])) return false; }
        else { return false; }
    }
    return true;
}

numeric.rep = function rep(s,v,k) {
    if(typeof k === "undefined") { k=0; }
    var n = s[k], ret = Array(n), i;
    if(k === s.length-1) {
        for(i=n-2;i>=0;i-=2) { ret[i+1] = v; ret[i] = v; }
        if(i===-1) { ret[0] = v; }
        return ret;
    }
    for(i=n-1;i>=0;i--) { ret[i] = numeric.rep(s,v,k+1); }
    return ret;
}


numeric.dotMMsmall = function dotMMsmall(x,y) {
    var i,j,k,p,q,r,ret,foo,bar,woo,i0,k0,p0,r0;
    p = x.length; q = y.length; r = y[0].length;
    ret = Array(p);
    for(i=p-1;i>=0;i--) {
        foo = Array(r);
        bar = x[i];
        for(k=r-1;k>=0;k--) {
            woo = bar[q-1]*y[q-1][k];
            for(j=q-2;j>=1;j-=2) {
                i0 = j-1;
                woo += bar[j]*y[j][k] + bar[i0]*y[i0][k];
            }
            if(j===0) { woo += bar[0]*y[0][k]; }
            foo[k] = woo;
        }
        ret[i] = foo;
    }
    return ret;
}
numeric._getCol = function _getCol(A,j,x) {
    var n = A.length, i;
    for(i=n-1;i>0;--i) {
        x[i] = A[i][j];
        --i;
        x[i] = A[i][j];
    }
    if(i===0) x[0] = A[0][j];
}
numeric.dotMMbig = function dotMMbig(x,y){
    var gc = numeric._getCol, p = y.length, v = Array(p);
    var m = x.length, n = y[0].length, A = new Array(m), xj;
    var VV = numeric.dotVV;
    var i,j,k,z;
    --p;
    --m;
    for(i=m;i!==-1;--i) A[i] = Array(n);
    --n;
    for(i=n;i!==-1;--i) {
        gc(y,i,v);
        for(j=m;j!==-1;--j) {
            z=0;
            xj = x[j];
            A[j][i] = VV(xj,v);
        }
    }
    return A;
}

numeric.dotMV = function dotMV(x,y) {
    var p = x.length, q = y.length,i;
    var ret = Array(p), dotVV = numeric.dotVV;
    for(i=p-1;i>=0;i--) { ret[i] = dotVV(x[i],y); }
    return ret;
}

numeric.dotVM = function dotVM(x,y) {
    var i,j,k,p,q,r,ret,foo,bar,woo,i0,k0,p0,r0,s1,s2,s3,baz,accum;
    p = x.length; q = y[0].length;
    ret = Array(q);
    for(k=q-1;k>=0;k--) {
        woo = x[p-1]*y[p-1][k];
        for(j=p-2;j>=1;j-=2) {
            i0 = j-1;
            woo += x[j]*y[j][k] + x[i0]*y[i0][k];
        }
        if(j===0) { woo += x[0]*y[0][k]; }
        ret[k] = woo;
    }
    return ret;
}

numeric.dotVV = function dotVV(x,y) {
    var i,n=x.length,i1,ret = x[n-1]*y[n-1];
    for(i=n-2;i>=1;i-=2) {
        i1 = i-1;
        ret += x[i]*y[i] + x[i1]*y[i1];
    }
    if(i===0) { ret += x[0]*y[0]; }
    return ret;
}

numeric.dot = function dot(x,y) {
    var d = numeric.dim;
    switch(d(x).length*1000+d(y).length) {
    case 2002:
        if(y.length < 10) return numeric.dotMMsmall(x,y);
        else return numeric.dotMMbig(x,y);
    case 2001: return numeric.dotMV(x,y);
    case 1002: return numeric.dotVM(x,y);
    case 1001: return numeric.dotVV(x,y);
    case 1000: return numeric.mulVS(x,y);
    case 1: return numeric.mulSV(x,y);
    case 0: return x*y;
    default: throw new Error('numeric.dot only works on vectors and matrices');
    }
}

numeric.diag = function diag(d) {
    var i,i1,j,n = d.length, A = Array(n), Ai;
    for(i=n-1;i>=0;i--) {
        Ai = Array(n);
        i1 = i+2;
        for(j=n-1;j>=i1;j-=2) {
            Ai[j] = 0;
            Ai[j-1] = 0;
        }
        if(j>i) { Ai[j] = 0; }
        Ai[i] = d[i];
        for(j=i-1;j>=1;j-=2) {
            Ai[j] = 0;
            Ai[j-1] = 0;
        }
        if(j===0) { Ai[0] = 0; }
        A[i] = Ai;
    }
    return A;
}
numeric.getDiag = function(A) {
    var n = Math.min(A.length,A[0].length),i,ret = Array(n);
    for(i=n-1;i>=1;--i) {
        ret[i] = A[i][i];
        --i;
        ret[i] = A[i][i];
    }
    if(i===0) {
        ret[0] = A[0][0];
    }
    return ret;
}

numeric.identity = function identity(n) { return numeric.diag(numeric.rep([n],1)); }
numeric.pointwise = function pointwise(params,body,setup) {
    if(typeof setup === "undefined") { setup = ""; }
    var fun = [];
    var k;
    var avec = /\[i\]$/,p,thevec = '';
    var haveret = false;
    for(k=0;k<params.length;k++) {
        if(avec.test(params[k])) {
            p = params[k].substring(0,params[k].length-3);
            thevec = p;
        } else { p = params[k]; }
        if(p==='ret') haveret = true;
        fun.push(p);
    }
    fun[params.length] = '_s';
    fun[params.length+1] = '_k';
    fun[params.length+2] = (
            'if(typeof _s === "undefined") _s = numeric.dim('+thevec+');\n'+
            'if(typeof _k === "undefined") _k = 0;\n'+
            'var _n = _s[_k];\n'+
            'var i'+(haveret?'':', ret = Array(_n)')+';\n'+
            'if(_k < _s.length-1) {\n'+
            '    for(i=_n-1;i>=0;i--) ret[i] = arguments.callee('+params.join(',')+',_s,_k+1);\n'+
            '    return ret;\n'+
            '}\n'+
            setup+'\n'+
            'for(i=_n-1;i!==-1;--i) {\n'+
            '    '+body+'\n'+
            '}\n'+
            'return ret;'
            );
    return Function.apply(null,fun);
}
numeric.pointwise2 = function pointwise2(params,body,setup) {
    if(typeof setup === "undefined") { setup = ""; }
    var fun = [];
    var k;
    var avec = /\[i\]$/,p,thevec = '';
    var haveret = false;
    for(k=0;k<params.length;k++) {
        if(avec.test(params[k])) {
            p = params[k].substring(0,params[k].length-3);
            thevec = p;
        } else { p = params[k]; }
        if(p==='ret') haveret = true;
        fun.push(p);
    }
    fun[params.length] = (
            'var _n = '+thevec+'.length;\n'+
            'var i'+(haveret?'':', ret = Array(_n)')+';\n'+
            setup+'\n'+
            'for(i=_n-1;i!==-1;--i) {\n'+
            body+'\n'+
            '}\n'+
            'return ret;'
            );
    return Function.apply(null,fun);
}
numeric._biforeach = (function _biforeach(x,y,s,k,f) {
    if(k === s.length-1) { f(x,y); return; }
    var i,n=s[k];
    for(i=n-1;i>=0;i--) { _biforeach(typeof x==="object"?x[i]:x,typeof y==="object"?y[i]:y,s,k+1,f); }
});
numeric._biforeach2 = (function _biforeach2(x,y,s,k,f) {
    if(k === s.length-1) { return f(x,y); }
    var i,n=s[k],ret = Array(n);
    for(i=n-1;i>=0;--i) { ret[i] = _biforeach2(typeof x==="object"?x[i]:x,typeof y==="object"?y[i]:y,s,k+1,f); }
    return ret;
});
numeric._foreach = (function _foreach(x,s,k,f) {
    if(k === s.length-1) { f(x); return; }
    var i,n=s[k];
    for(i=n-1;i>=0;i--) { _foreach(x[i],s,k+1,f); }
});
numeric._foreach2 = (function _foreach2(x,s,k,f) {
    if(k === s.length-1) { return f(x); }
    var i,n=s[k], ret = Array(n);
    for(i=n-1;i>=0;i--) { ret[i] = _foreach2(x[i],s,k+1,f); }
    return ret;
});

/*numeric.anyV = numeric.mapreduce('if(xi) return true;','false');
numeric.allV = numeric.mapreduce('if(!xi) return false;','true');
numeric.any = function(x) { if(typeof x.length === "undefined") return x; return numeric.anyV(x); }
numeric.all = function(x) { if(typeof x.length === "undefined") return x; return numeric.allV(x); }*/

numeric.ops2 = {
        add: '+',
        sub: '-',
        mul: '*',
        div: '/',
        mod: '%',
        and: '&&',
        or:  '||',
        eq:  '===',
        neq: '!==',
        lt:  '<',
        gt:  '>',
        leq: '<=',
        geq: '>=',
        band: '&',
        bor: '|',
        bxor: '^',
        lshift: '<<',
        rshift: '>>',
        rrshift: '>>>'
};
numeric.opseq = {
        addeq: '+=',
        subeq: '-=',
        muleq: '*=',
        diveq: '/=',
        modeq: '%=',
        lshifteq: '<<=',
        rshifteq: '>>=',
        rrshifteq: '>>>=',
        bandeq: '&=',
        boreq: '|=',
        bxoreq: '^='
};
numeric.mathfuns = ['abs','acos','asin','atan','ceil','cos',
                    'exp','floor','log','round','sin','sqrt','tan',
                    'isNaN','isFinite'];
numeric.mathfuns2 = ['atan2','pow','max','min'];
numeric.ops1 = {
        neg: '-',
        not: '!',
        bnot: '~',
        clone: ''
};
numeric.mapreducers = {
        any: ['if(xi) return true;','var accum = false;'],
        all: ['if(!xi) return false;','var accum = true;'],
        sum: ['accum += xi;','var accum = 0;'],
        prod: ['accum *= xi;','var accum = 1;'],
        norm2Squared: ['accum += xi*xi;','var accum = 0;'],
        norminf: ['accum = max(accum,abs(xi));','var accum = 0, max = Math.max, abs = Math.abs;'],
        norm1: ['accum += abs(xi)','var accum = 0, abs = Math.abs;'],
        sup: ['accum = max(accum,xi);','var accum = -Infinity, max = Math.max;'],
        inf: ['accum = min(accum,xi);','var accum = Infinity, min = Math.min;']
};

(function () {
    var i,o;
    for(i=0;i<numeric.mathfuns2.length;++i) {
        o = numeric.mathfuns2[i];
        numeric.ops2[o] = o;
    }
    for(i in numeric.ops2) {
        if(numeric.ops2.hasOwnProperty(i)) {
            o = numeric.ops2[i];
            var code, codeeq, setup = '';
            if(numeric.myIndexOf.call(numeric.mathfuns2,i)!==-1) {
                setup = 'var '+o+' = Math.'+o+';\n';
                code = function(r,x,y) { return r+' = '+o+'('+x+','+y+')'; };
                codeeq = function(x,y) { return x+' = '+o+'('+x+','+y+')'; };
            } else {
                code = function(r,x,y) { return r+' = '+x+' '+o+' '+y; };
                if(numeric.opseq.hasOwnProperty(i+'eq')) {
                    codeeq = function(x,y) { return x+' '+o+'= '+y; };
                } else {
                    codeeq = function(x,y) { return x+' = '+x+' '+o+' '+y; };                    
                }
            }
            numeric[i+'VV'] = numeric.pointwise2(['x[i]','y[i]'],code('ret[i]','x[i]','y[i]'),setup);
            numeric[i+'SV'] = numeric.pointwise2(['x','y[i]'],code('ret[i]','x','y[i]'),setup);
            numeric[i+'VS'] = numeric.pointwise2(['x[i]','y'],code('ret[i]','x[i]','y'),setup);
            numeric[i] = Function(
                    'var n = arguments.length, i, x = arguments[0], y;\n'+
                    'var VV = numeric.'+i+'VV, VS = numeric.'+i+'VS, SV = numeric.'+i+'SV;\n'+
                    'var dim = numeric.dim;\n'+
                    'for(i=1;i!==n;++i) { \n'+
                    '  y = arguments[i];\n'+
                    '  if(typeof x === "object") {\n'+
                    '      if(typeof y === "object") x = numeric._biforeach2(x,y,dim(x),0,VV);\n'+
                    '      else x = numeric._biforeach2(x,y,dim(x),0,VS);\n'+
                    '  } else if(typeof y === "object") x = numeric._biforeach2(x,y,dim(y),0,SV);\n'+
                    '  else '+codeeq('x','y')+'\n'+
                    '}\nreturn x;\n');
            numeric[o] = numeric[i];
            numeric[i+'eqV'] = numeric.pointwise2(['ret[i]','x[i]'], codeeq('ret[i]','x[i]'),setup);
            numeric[i+'eqS'] = numeric.pointwise2(['ret[i]','x'], codeeq('ret[i]','x'),setup);
            numeric[i+'eq'] = Function(
                    'var n = arguments.length, i, x = arguments[0], y;\n'+
                    'var V = numeric.'+i+'eqV, S = numeric.'+i+'eqS\n'+
                    'var s = numeric.dim(x);\n'+
                    'for(i=1;i!==n;++i) { \n'+
                    '  y = arguments[i];\n'+
                    '  if(typeof y === "object") numeric._biforeach(x,y,s,0,V);\n'+
                    '  else numeric._biforeach(x,y,s,0,S);\n'+
                    '}\nreturn x;\n');
        }
    }
    for(i=0;i<numeric.mathfuns2.length;++i) {
        o = numeric.mathfuns2[i];
        delete numeric.ops2[o];
    }
    for(i=0;i<numeric.mathfuns.length;++i) {
        o = numeric.mathfuns[i];
        numeric.ops1[o] = o;
    }
    for(i in numeric.ops1) {
        if(numeric.ops1.hasOwnProperty(i)) {
            setup = '';
            o = numeric.ops1[i];
            if(numeric.myIndexOf.call(numeric.mathfuns,i)!==-1) {
                if(Math.hasOwnProperty(o)) setup = 'var '+o+' = Math.'+o+';\n';
            }
            numeric[i+'eqV'] = numeric.pointwise2(['ret[i]'],'ret[i] = '+o+'(ret[i]);',setup);
            numeric[i+'eq'] = Function('x',
                    'if(typeof x !== "object") return '+o+'x\n'+
                    'var i;\n'+
                    'var V = numeric.'+i+'eqV;\n'+
                    'var s = numeric.dim(x);\n'+
                    'numeric._foreach(x,s,0,V);\n'+
                    'return x;\n');
            numeric[i+'V'] = numeric.pointwise2(['x[i]'],'ret[i] = '+o+'(x[i]);',setup);
            numeric[i] = Function('x',
                    'if(typeof x !== "object") return '+o+'(x)\n'+
                    'var i;\n'+
                    'var V = numeric.'+i+'V;\n'+
                    'var s = numeric.dim(x);\n'+
                    'return numeric._foreach2(x,s,0,V);\n');
        }
    }
    for(i=0;i<numeric.mathfuns.length;++i) {
        o = numeric.mathfuns[i];
        delete numeric.ops1[o];
    }
    for(i in numeric.mapreducers) {
        if(numeric.mapreducers.hasOwnProperty(i)) {
            o = numeric.mapreducers[i];
            numeric[i+'V'] = numeric.mapreduce2(o[0],o[1]);
            numeric[i] = Function('x','s','k',
                    o[1]+
                    'if(typeof x !== "object") {'+
                    '    xi = x;\n'+
                    o[0]+';\n'+
                    '    return accum;\n'+
                    '}'+
                    'if(typeof s === "undefined") s = numeric.dim(x);\n'+
                    'if(typeof k === "undefined") k = 0;\n'+
                    'if(k === s.length-1) return numeric.'+i+'V(x);\n'+
                    'var xi;\n'+
                    'var n = x.length, i;\n'+
                    'for(i=n-1;i!==-1;--i) {\n'+
                    '   xi = arguments.callee(x[i]);\n'+
                    o[0]+';\n'+
                    '}\n'+
                    'return accum;\n');
        }
    }
}());

numeric.truncVV = numeric.pointwise(['x[i]','y[i]'],'ret[i] = round(x[i]/y[i])*y[i];','var round = Math.round;');
numeric.truncVS = numeric.pointwise(['x[i]','y'],'ret[i] = round(x[i]/y)*y;','var round = Math.round;');
numeric.truncSV = numeric.pointwise(['x','y[i]'],'ret[i] = round(x/y[i])*y[i];','var round = Math.round;');
numeric.trunc = function trunc(x,y) {
    if(typeof x === "object") {
        if(typeof y === "object") return numeric.truncVV(x,y);
        return numeric.truncVS(x,y);
    }
    if (typeof y === "object") return numeric.truncSV(x,y);
    return Math.round(x/y)*y;
}

numeric.inv = function inv(x) {
    var s = numeric.dim(x), abs = Math.abs, m = s[0], n = s[1];
    var A = numeric.clone(x), Ai, Aj;
    var I = numeric.identity(m), Ii, Ij;
    var i,j,k,x;
    for(j=0;j<n;++j) {
        var i0 = -1;
        var v0 = -1;
        for(i=j;i!==m;++i) { k = abs(A[i][j]); if(k>v0) { i0 = i; v0 = k; } }
        Aj = A[i0]; A[i0] = A[j]; A[j] = Aj;
        Ij = I[i0]; I[i0] = I[j]; I[j] = Ij;
        x = Aj[j];
        for(k=j;k!==n;++k)    Aj[k] /= x; 
        for(k=n-1;k!==-1;--k) Ij[k] /= x;
        for(i=m-1;i!==-1;--i) {
            if(i!==j) {
                Ai = A[i];
                Ii = I[i];
                x = Ai[j];
                for(k=j+1;k!==n;++k)  Ai[k] -= Aj[k]*x;
                for(k=n-1;k>0;--k) { Ii[k] -= Ij[k]*x; --k; Ii[k] -= Ij[k]*x; }
                if(k===0) Ii[0] -= Ij[0]*x;
            }
        }
    }
    return I;
}

numeric.det = function det(x) {
    var s = numeric.dim(x);
    if(s.length !== 2 || s[0] !== s[1]) { throw new Error('numeric: det() only works on square matrices'); }
    var n = s[0], ret = 1,i,j,k,A = numeric.clone(x),Aj,Ai,alpha,temp,k1,k2,k3;
    for(j=0;j<n-1;j++) {
        k=j;
        for(i=j+1;i<n;i++) { if(Math.abs(A[i][j]) > Math.abs(A[k][j])) { k = i; } }
        if(k !== j) {
            temp = A[k]; A[k] = A[j]; A[j] = temp;
            ret *= -1;
        }
        Aj = A[j];
        for(i=j+1;i<n;i++) {
            Ai = A[i];
            alpha = Ai[j]/Aj[j];
            for(k=j+1;k<n-1;k+=2) {
                k1 = k+1;
                Ai[k] -= Aj[k]*alpha;
                Ai[k1] -= Aj[k1]*alpha;
            }
            if(k!==n) { Ai[k] -= Aj[k]*alpha; }
        }
        if(Aj[j] === 0) { return 0; }
        ret *= Aj[j];
    }
    return ret*A[j][j];
}

numeric.transpose = function transpose(x) {
    var i,j,m = x.length,n = x[0].length, ret=Array(n),A0,A1,Bj;
    for(j=0;j<n;j++) ret[j] = Array(m);
    for(i=m-1;i>=1;i-=2) {
        A1 = x[i];
        A0 = x[i-1];
        for(j=n-1;j>=1;--j) {
            Bj = ret[j]; Bj[i] = A1[j]; Bj[i-1] = A0[j];
            --j;
            Bj = ret[j]; Bj[i] = A1[j]; Bj[i-1] = A0[j];
        }
        if(j===0) {
            Bj = ret[0]; Bj[i] = A1[0]; Bj[i-1] = A0[0];
        }
    }
    if(i===0) {
        A0 = x[0];
        for(j=n-1;j>=1;--j) {
            ret[j][0] = A0[j];
            --j;
            ret[j][0] = A0[j];
        }
        if(j===0) { ret[0][0] = A0[0]; }
    }
    return ret;
}
numeric.negtranspose = function negtranspose(x) {
    var i,j,m = x.length,n = x[0].length, ret=Array(n),A0,A1,Bj;
    for(j=0;j<n;j++) ret[j] = Array(m);
    for(i=m-1;i>=1;i-=2) {
        A1 = x[i];
        A0 = x[i-1];
        for(j=n-1;j>=1;--j) {
            Bj = ret[j]; Bj[i] = -A1[j]; Bj[i-1] = -A0[j];
            --j;
            Bj = ret[j]; Bj[i] = -A1[j]; Bj[i-1] = -A0[j];
        }
        if(j===0) {
            Bj = ret[0]; Bj[i] = -A1[0]; Bj[i-1] = -A0[0];
        }
    }
    if(i===0) {
        A0 = x[0];
        for(j=n-1;j>=1;--j) {
            ret[j][0] = -A0[j];
            --j;
            ret[j][0] = -A0[j];
        }
        if(j===0) { ret[0][0] = -A0[0]; }
    }
    return ret;
}

numeric._random = function _random(s,k) {
    var i,n=s[k],ret=Array(n), rnd;
    if(k === s.length-1) {
        rnd = Math.random;
        for(i=n-1;i>=1;i-=2) {
            ret[i] = rnd();
            ret[i-1] = rnd();
        }
        if(i===0) { ret[0] = rnd(); }
        return ret;
    }
    for(i=n-1;i>=0;i--) ret[i] = _random(s,k+1);
    return ret;
}
numeric.random = function random(s) { return numeric._random(s,0); }

numeric.norm2 = function norm2(x) { return Math.sqrt(numeric.norm2Squared(x)); }

numeric.linspace = function linspace(a,b,n) {
    if(typeof n === "undefined") n = Math.max(Math.round(b-a)+1,1);
    if(n<2) { return n===1?[a]:[]; }
    var i,ret = Array(n);
    n--;
    for(i=n;i>=0;i--) { ret[i] = (i*b+(n-i)*a)/n; }
    return ret;
}

numeric.getBlock = function getBlock(x,from,to) {
    var s = numeric.dim(x);
    function foo(x,k) {
        var i,a = from[k], n = to[k]-a, ret = Array(n);
        if(k === s.length-1) {
            for(i=n;i>=0;i--) { ret[i] = x[i+a]; }
            return ret;
        }
        for(i=n;i>=0;i--) { ret[i] = foo(x[i+a],k+1); }
        return ret;
    }
    return foo(x,0);
}

numeric.setBlock = function setBlock(x,from,to,B) {
    var s = numeric.dim(x);
    function foo(x,y,k) {
        var i,a = from[k], n = to[k]-a;
        if(k === s.length-1) { for(i=n;i>=0;i--) { x[i+a] = y[i]; } }
        for(i=n;i>=0;i--) { foo(x[i+a],y[i],k+1); }
    }
    foo(x,B,0);
    return x;
}

numeric.getRange = function getRange(A,I,J) {
    var m = I.length, n = J.length;
    var i,j;
    var B = Array(m), Bi, AI;
    for(i=m-1;i!==-1;--i) {
        B[i] = Array(n);
        Bi = B[i];
        AI = A[I[i]];
        for(j=n-1;j!==-1;--j) Bi[j] = AI[J[j]];
    }
    return B;
}

numeric.blockMatrix = function blockMatrix(X) {
    var s = numeric.dim(X);
    if(s.length<4) return numeric.blockMatrix([X]);
    var m=s[0],n=s[1],M,N,i,j,Xij;
    M = 0; N = 0;
    for(i=0;i<m;++i) M+=X[i][0].length;
    for(j=0;j<n;++j) N+=X[0][j][0].length;
    var Z = Array(M);
    for(i=0;i<M;++i) Z[i] = Array(N);
    var I=0,J,ZI,k,l,Xijk;
    for(i=0;i<m;++i) {
        J=N;
        for(j=n-1;j!==-1;--j) {
            Xij = X[i][j];
            J -= Xij[0].length;
            for(k=Xij.length-1;k!==-1;--k) {
                Xijk = Xij[k];
                ZI = Z[I+k];
                for(l = Xijk.length-1;l!==-1;--l) ZI[J+l] = Xijk[l];
            }
        }
        I += X[i][0].length;
    }
    return Z;
}

numeric.tensor = function tensor(x,y) {
    if(typeof x === "number" || typeof y === "number") return numeric.mul(x,y);
    var s1 = numeric.dim(x), s2 = numeric.dim(y);
    if(s1.length !== 1 || s2.length !== 1) {
        throw new Error('numeric: tensor product is only defined for vectors');
    }
    var m = s1[0], n = s2[0], A = Array(m), Ai, i,j,xi;
    for(i=m-1;i>=0;i--) {
        Ai = Array(n);
        xi = x[i];
        for(j=n-1;j>=3;--j) {
            Ai[j] = xi * y[j];
            --j;
            Ai[j] = xi * y[j];
            --j;
            Ai[j] = xi * y[j];
            --j;
            Ai[j] = xi * y[j];
        }
        while(j>=0) { Ai[j] = xi * y[j]; --j; }
        A[i] = Ai;
    }
    return A;
}

// 3. The Tensor type T
numeric.T = function T(x,y) { this.x = x; this.y = y; }
numeric.t = function t(x,y) { return new numeric.T(x,y); }

numeric.Tbinop = function Tbinop(rr,rc,cr,cc,setup) {
    var io = numeric.indexOf;
    if(typeof setup !== "string") {
        var k;
        setup = '';
        for(k in numeric) {
            if(numeric.hasOwnProperty(k) && (rr.indexOf(k)>=0 || rc.indexOf(k)>=0 || cr.indexOf(k)>=0 || cc.indexOf(k)>=0) && k.length>1) {
                setup += 'var '+k+' = numeric.'+k+';\n';
            }
        }
    }
    return Function(['y'],
            'var x = this;\n'+
            'if(!(y instanceof numeric.T)) { y = new numeric.T(y); }\n'+
            setup+'\n'+
            'if(x.y) {'+
            '  if(y.y) {'+
            '    return new numeric.T('+cc+');\n'+
            '  }\n'+
            '  return new numeric.T('+cr+');\n'+
            '}\n'+
            'if(y.y) {\n'+
            '  return new numeric.T('+rc+');\n'+
            '}\n'+
            'return new numeric.T('+rr+');\n'
    );
}

numeric.T.prototype.add = numeric.Tbinop(
        'add(x.x,y.x)',
        'add(x.x,y.x),y.y',
        'add(x.x,y.x),x.y',
        'add(x.x,y.x),add(x.y,y.y)');
numeric.T.prototype.sub = numeric.Tbinop(
        'sub(x.x,y.x)',
        'sub(x.x,y.x),neg(y.y)',
        'sub(x.x,y.x),x.y',
        'sub(x.x,y.x),sub(x.y,y.y)');
numeric.T.prototype.mul = numeric.Tbinop(
        'mul(x.x,y.x)',
        'mul(x.x,y.x),mul(x.x,y.y)',
        'mul(x.x,y.x),mul(x.y,y.x)',
        'sub(mul(x.x,y.x),mul(x.y,y.y)),add(mul(x.x,y.y),mul(x.y,y.x))');

numeric.T.prototype.reciprocal = function reciprocal() {
    var mul = numeric.mul, div = numeric.div;
    if(this.y) {
        var d = numeric.add(mul(this.x,this.x),mul(this.y,this.y));
        return new numeric.T(div(this.x,d),div(numeric.neg(this.y),d));
    }
    return new T(div(1,this.x));
}
numeric.T.prototype.div = function div(y) {
    if(!(y instanceof numeric.T)) y = new numeric.T(y);
    if(y.y) { return this.mul(y.reciprocal()); }
    var div = numeric.div;
    if(this.y) { return new numeric.T(div(this.x,y.x),div(this.y,y.x)); }
    return new numeric.T(div(this.x,y.x));
}
numeric.T.prototype.dot = numeric.Tbinop(
        'dot(x.x,y.x)',
        'dot(x.x,y.x),dot(x.x,y.y)',
        'dot(x.x,y.x),dot(x.y,y.x)',
        'sub(dot(x.x,y.x),dot(x.y,y.y)),add(dot(x.x,y.y),dot(x.y,y.x))'
        );
numeric.T.prototype.transpose = function transpose() {
    var t = numeric.transpose, x = this.x, y = this.y;
    if(y) { return new numeric.T(t(x),t(y)); }
    return new numeric.T(t(x));
}
numeric.T.prototype.transjugate = function transjugate() {
    var t = numeric.transpose, x = this.x, y = this.y;
    if(y) { return new numeric.T(t(x),numeric.negtranspose(y)); }
    return new numeric.T(t(x));
}
numeric.Tunop = function Tunop(r,c,s) {
    if(typeof s !== "string") { s = ''; }
    return Function(
            'var x = this;\n'+
            s+'\n'+
            'if(x.y) {'+
            '  '+c+';\n'+
            '}\n'+
            r+';\n'
    );
}

numeric.T.prototype.exp = numeric.Tunop(
        'return new numeric.T(ex)',
        'return new numeric.T(mul(cos(x.y),ex),mul(sin(x.y),ex))',
        'var ex = numeric.exp(x.x), cos = numeric.cos, sin = numeric.sin, mul = numeric.mul;');
numeric.T.prototype.conj = numeric.Tunop(
        'return new numeric.T(x.x);',
        'return new numeric.T(x.x,numeric.neg(x.y));');
numeric.T.prototype.neg = numeric.Tunop(
        'return new numeric.T(neg(x.x));',
        'return new numeric.T(neg(x.x),neg(x.y));',
        'var neg = numeric.neg;');
numeric.T.prototype.sin = numeric.Tunop(
        'return new numeric.T(numeric.sin(x.x))',
        'return x.exp().sub(x.neg().exp()).div(new numeric.T(0,2));');
numeric.T.prototype.cos = numeric.Tunop(
        'return new numeric.T(numeric.cos(x.x))',
        'return x.exp().add(x.neg().exp()).div(2);');
numeric.T.prototype.abs = numeric.Tunop(
        'return new numeric.T(numeric.abs(x.x));',
        'return new numeric.T(numeric.sqrt(numeric.add(mul(x.x,x.x),mul(x.y,x.y))));',
        'var mul = numeric.mul;');
numeric.T.prototype.log = numeric.Tunop(
        'return new numeric.T(numeric.log(x.x));',
        'var theta = new numeric.T(numeric.atan2(x.y,x.x)), r = x.abs();\n'+
        'return new numeric.T(numeric.log(r.x),theta.x);');
numeric.T.prototype.norm2 = numeric.Tunop(
        'return numeric.norm2(x.x);',
        'var f = numeric.norm2Squared;\n'+
        'return Math.sqrt(f(x.x)+f(x.y));');
numeric.T.prototype.inv = function inv() {
    var A = this;
    if(typeof A.y === "undefined") { return new numeric.T(numeric.inv(A.x)); }
    var n = A.x.length, i, j, k;
    var Rx = numeric.identity(n),Ry = numeric.rep([n,n],0);
    var Ax = numeric.clone(A.x), Ay = numeric.clone(A.y);
    var Aix, Aiy, Ajx, Ajy, Rix, Riy, Rjx, Rjy;
    var i,j,k,d,d1,ax,ay,bx,by,temp;
    for(i=0;i<n;i++) {
        ax = Ax[i][i]; ay = Ay[i][i];
        d = ax*ax+ay*ay;
        k = i;
        for(j=i+1;j<n;j++) {
            ax = Ax[j][i]; ay = Ay[j][i];
            d1 = ax*ax+ay*ay;
            if(d1 > d) { k=j; d = d1; }
        }
        if(k!==i) {
            temp = Ax[i]; Ax[i] = Ax[k]; Ax[k] = temp;
            temp = Ay[i]; Ay[i] = Ay[k]; Ay[k] = temp;
            temp = Rx[i]; Rx[i] = Rx[k]; Rx[k] = temp;
            temp = Ry[i]; Ry[i] = Ry[k]; Ry[k] = temp;
        }
        Aix = Ax[i]; Aiy = Ay[i];
        Rix = Rx[i]; Riy = Ry[i];
        ax = Aix[i]; ay = Aiy[i];
        for(j=i+1;j<n;j++) {
            bx = Aix[j]; by = Aiy[j];
            Aix[j] = (bx*ax+by*ay)/d;
            Aiy[j] = (by*ax-bx*ay)/d;
        }
        for(j=0;j<n;j++) {
            bx = Rix[j]; by = Riy[j];
            Rix[j] = (bx*ax+by*ay)/d;
            Riy[j] = (by*ax-bx*ay)/d;
        }
        for(j=i+1;j<n;j++) {
            Ajx = Ax[j]; Ajy = Ay[j];
            Rjx = Rx[j]; Rjy = Ry[j];
            ax = Ajx[i]; ay = Ajy[i];
            for(k=i+1;k<n;k++) {
                bx = Aix[k]; by = Aiy[k];
                Ajx[k] -= bx*ax-by*ay;
                Ajy[k] -= by*ax+bx*ay;
            }
            for(k=0;k<n;k++) {
                bx = Rix[k]; by = Riy[k];
                Rjx[k] -= bx*ax-by*ay;
                Rjy[k] -= by*ax+bx*ay;
            }
        }
    }
    for(i=n-1;i>0;i--) {
        Rix = Rx[i]; Riy = Ry[i];
        for(j=i-1;j>=0;j--) {
            Rjx = Rx[j]; Rjy = Ry[j];
            ax = Ax[j][i]; ay = Ay[j][i];
            for(k=n-1;k>=0;k--) {
                bx = Rix[k]; by = Riy[k];
                Rjx[k] -= ax*bx - ay*by;
                Rjy[k] -= ax*by + ay*bx;
            }
        }
    }
    return new numeric.T(Rx,Ry);
}
numeric.T.prototype.get = function get(i) {
    var x = this.x, y = this.y, k = 0, ik, n = i.length;
    if(y) {
        while(k<n) {
            ik = i[k];
            x = x[ik];
            y = y[ik];
            k++;
        }
        return new numeric.T(x,y);
    }
    while(k<n) {
        ik = i[k];
        x = x[ik];
        k++;
    }
    return new numeric.T(x);
}
numeric.T.prototype.set = function set(i,v) {
    var x = this.x, y = this.y, k = 0, ik, n = i.length, vx = v.x, vy = v.y;
    if(n===0) {
        if(vy) { this.y = vy; }
        else if(y) { this.y = undefined; }
        this.x = x;
        return this;
    }
    if(vy) {
        if(y) { /* ok */ }
        else {
            y = numeric.rep(numeric.dim(x),0);
            this.y = y;
        }
        while(k<n-1) {
            ik = i[k];
            x = x[ik];
            y = y[ik];
            k++;
        }
        ik = i[k];
        x[ik] = vx;
        y[ik] = vy;
        return this;
    }
    if(y) {
        while(k<n-1) {
            ik = i[k];
            x = x[ik];
            y = y[ik];
            k++;
        }
        ik = i[k];
        x[ik] = vx;
        if(vx instanceof Array) y[ik] = numeric.rep(numeric.dim(vx),0);
        else y[ik] = 0;
        return this;
    }
    while(k<n-1) {
        ik = i[k];
        x = x[ik];
        k++;
    }
    ik = i[k];
    x[ik] = vx;
    return this;
}
numeric.T.prototype.getRows = function getRows(i0,i1) {
    var n = i1-i0+1, j;
    var rx = Array(n), ry, x = this.x, y = this.y;
    for(j=i0;j<=i1;j++) { rx[j-i0] = x[j]; }
    if(y) {
        ry = Array(n);
        for(j=i0;j<=i1;j++) { ry[j-i0] = y[j]; }
        return new numeric.T(rx,ry);
    }
    return new numeric.T(rx);
}
numeric.T.prototype.setRows = function setRows(i0,i1,A) {
    var j;
    var rx = this.x, ry = this.y, x = A.x, y = A.y;
    for(j=i0;j<=i1;j++) { rx[j] = x[j-i0]; }
    if(y) {
        if(!ry) { ry = numeric.rep(numeric.dim(rx),0); this.y = ry; }
        for(j=i0;j<=i1;j++) { ry[j] = y[j-i0]; }
    } else if(ry) {
        for(j=i0;j<=i1;j++) { ry[j] = numeric.rep([x[j-i0].length],0); }
    }
    return this;
}
numeric.T.prototype.getRow = function getRow(k) {
    var x = this.x, y = this.y;
    if(y) { return new numeric.T(x[k],y[k]); }
    return new numeric.T(x[k]);
}
numeric.T.prototype.setRow = function setRow(i,v) {
    var rx = this.x, ry = this.y, x = v.x, y = v.y;
    rx[i] = x;
    if(y) {
        if(!ry) { ry = numeric.rep(numeric.dim(rx),0); this.y = ry; }
        ry[i] = y;
    } else if(ry) {
        ry = numeric.rep([x.length],0);
    }
    return this;
}

numeric.T.prototype.getBlock = function getBlock(from,to) {
    var x = this.x, y = this.y, b = numeric.getBlock;
    if(y) { return new numeric.T(b(x,from,to),b(y,from,to)); }
    return new numeric.T(b(x,from,to));
}
numeric.T.prototype.setBlock = function setBlock(from,to,A) {
    if(!(A instanceof numeric.T)) A = new numeric.T(A);
    var x = this.x, y = this.y, b = numeric.setBlock, Ax = A.x, Ay = A.y;
    if(Ay) {
        if(!y) { this.y = numeric.rep(numeric.dim(this),0); y = this.y; }
        b(x,from,to,Ax);
        b(y,from,to,Ay);
        return this;
    }
    b(x,from,to,Ax);
    if(y) b(y,from,to,numeric.rep(numeric.dim(Ax),0));
}
numeric.T.rep = function rep(s,v) {
    var T = numeric.T;
    if(!(v instanceof T)) v = new T(v);
    var x = v.x, y = v.y, r = numeric.rep;
    if(y) return new T(r(s,x),r(s,y));
    return new T(r(s,x));
}
numeric.T.diag = function diag(d) {
    if(!(d instanceof numeric.T)) d = new numeric.T(d);
    var x = d.x, y = d.y, diag = numeric.diag;
    if(y) return new numeric.T(diag(x),diag(y));
    return new numeric.T(diag(x));
}
numeric.T.eig = function eig() {
    if(this.y) { throw new Error('eig: not implemented for complex matrices.'); }
    return numeric.eig(this.x);
}
numeric.T.identity = function identity(n) { return new numeric.T(numeric.identity(n)); }
numeric.T.prototype.getDiag = function getDiag() {
    var n = numeric;
    var x = this.x, y = this.y;
    if(y) { return new n.T(n.getDiag(x),n.getDiag(y)); }
    return new n.T(n.getDiag(x));
}

// 4. Eigenvalues of real matrices

numeric.house = function house(x) {
    var v = numeric.clone(x);
    var s = x[0] >= 0 ? 1 : -1;
    var alpha = s*numeric.norm2(x);
    v[0] += alpha;
    var foo = numeric.norm2(v);
    if(foo === 0) { /* this should not happen */ throw new Error('eig: internal error'); }
    return numeric.div(v,foo);
}

numeric.toUpperHessenberg = function toUpperHessenberg(me) {
    var s = numeric.dim(me);
    if(s.length !== 2 || s[0] !== s[1]) { throw new Error('numeric: toUpperHessenberg() only works on square matrices'); }
    var m = s[0], i,j,k,x,v,A = numeric.clone(me),B,C,Ai,Ci,Q = numeric.identity(m),Qi;
    for(j=0;j<m-2;j++) {
        x = Array(m-j-1);
        for(i=j+1;i<m;i++) { x[i-j-1] = A[i][j]; }
        if(numeric.norm2(x)>0) {
            v = numeric.house(x);
            B = numeric.getBlock(A,[j+1,j],[m-1,m-1]);
            C = numeric.tensor(v,numeric.dot(v,B));
            for(i=j+1;i<m;i++) { Ai = A[i]; Ci = C[i-j-1]; for(k=j;k<m;k++) Ai[k] -= 2*Ci[k-j]; }
            B = numeric.getBlock(A,[0,j+1],[m-1,m-1]);
            C = numeric.tensor(numeric.dot(B,v),v);
            for(i=0;i<m;i++) { Ai = A[i]; Ci = C[i]; for(k=j+1;k<m;k++) Ai[k] -= 2*Ci[k-j-1]; }
            B = Array(m-j-1);
            for(i=j+1;i<m;i++) B[i-j-1] = Q[i];
            C = numeric.tensor(v,numeric.dot(v,B));
            for(i=j+1;i<m;i++) { Qi = Q[i]; Ci = C[i-j-1]; for(k=0;k<m;k++) Qi[k] -= 2*Ci[k]; }
        }
    }
    return {H:A, Q:Q};
}

numeric.epsilon = 2.220446049250313e-16;

numeric.QRFrancis = function(H,maxiter) {
    if(typeof maxiter === "undefined") { maxiter = 10000; }
    H = numeric.clone(H);
    var H0 = numeric.clone(H);
    var s = numeric.dim(H),m=s[0],x,v,a,b,c,d,det,tr, Hloc, Q = numeric.identity(m), Qi, Hi, B, C, Ci,i,j,k,iter;
    if(m<3) { return {Q:Q, B:[ [0,m-1] ]}; }
    var epsilon = numeric.epsilon;
    for(iter=0;iter<maxiter;iter++) {
        for(j=0;j<m-1;j++) {
            if(Math.abs(H[j+1][j]) < epsilon*(Math.abs(H[j][j])+Math.abs(H[j+1][j+1]))) {
                var QH1 = numeric.QRFrancis(numeric.getBlock(H,[0,0],[j,j]),maxiter);
                var QH2 = numeric.QRFrancis(numeric.getBlock(H,[j+1,j+1],[m-1,m-1]),maxiter);
                B = Array(j+1);
                for(i=0;i<=j;i++) { B[i] = Q[i]; }
                C = numeric.dot(QH1.Q,B);
                for(i=0;i<=j;i++) { Q[i] = C[i]; }
                B = Array(m-j-1);
                for(i=j+1;i<m;i++) { B[i-j-1] = Q[i]; }
                C = numeric.dot(QH2.Q,B);
                for(i=j+1;i<m;i++) { Q[i] = C[i-j-1]; }
                return {Q:Q,B:QH1.B.concat(numeric.add(QH2.B,j+1))};
            }
        }
        a = H[m-2][m-2]; b = H[m-2][m-1];
        c = H[m-1][m-2]; d = H[m-1][m-1];
        tr = a+d;
        det = (a*d-b*c);
        Hloc = numeric.getBlock(H, [0,0], [2,2]);
        if(tr*tr>=4*det) {
            var s1,s2;
            s1 = 0.5*(tr+Math.sqrt(tr*tr-4*det));
            s2 = 0.5*(tr-Math.sqrt(tr*tr-4*det));
            Hloc = numeric.add(numeric.sub(numeric.dot(Hloc,Hloc),
                                           numeric.mul(Hloc,s1+s2)),
                               numeric.diag(numeric.rep([3],s1*s2)));
        } else {
            Hloc = numeric.add(numeric.sub(numeric.dot(Hloc,Hloc),
                                           numeric.mul(Hloc,tr)),
                               numeric.diag(numeric.rep([3],det)));
        }
        x = [Hloc[0][0],Hloc[1][0],Hloc[2][0]];
        v = numeric.house(x);
        B = [H[0],H[1],H[2]];
        C = numeric.tensor(v,numeric.dot(v,B));
        for(i=0;i<3;i++) { Hi = H[i]; Ci = C[i]; for(k=0;k<m;k++) Hi[k] -= 2*Ci[k]; }
        B = numeric.getBlock(H, [0,0],[m-1,2]);
        C = numeric.tensor(numeric.dot(B,v),v);
        for(i=0;i<m;i++) { Hi = H[i]; Ci = C[i]; for(k=0;k<3;k++) Hi[k] -= 2*Ci[k]; }
        B = [Q[0],Q[1],Q[2]];
        C = numeric.tensor(v,numeric.dot(v,B));
        for(i=0;i<3;i++) { Qi = Q[i]; Ci = C[i]; for(k=0;k<m;k++) Qi[k] -= 2*Ci[k]; }
        var J;
        for(j=0;j<m-2;j++) {
            for(k=j;k<=j+1;k++) {
                if(Math.abs(H[k+1][k]) < epsilon*(Math.abs(H[k][k])+Math.abs(H[k+1][k+1]))) {
                    var QH1 = numeric.QRFrancis(numeric.getBlock(H,[0,0],[k,k]),maxiter);
                    var QH2 = numeric.QRFrancis(numeric.getBlock(H,[k+1,k+1],[m-1,m-1]),maxiter);
                    B = Array(k+1);
                    for(i=0;i<=k;i++) { B[i] = Q[i]; }
                    C = numeric.dot(QH1.Q,B);
                    for(i=0;i<=k;i++) { Q[i] = C[i]; }
                    B = Array(m-k-1);
                    for(i=k+1;i<m;i++) { B[i-k-1] = Q[i]; }
                    C = numeric.dot(QH2.Q,B);
                    for(i=k+1;i<m;i++) { Q[i] = C[i-k-1]; }
                    return {Q:Q,B:QH1.B.concat(numeric.add(QH2.B,k+1))};
                }
            }
            J = Math.min(m-1,j+3);
            x = Array(J-j);
            for(i=j+1;i<=J;i++) { x[i-j-1] = H[i][j]; }
            v = numeric.house(x);
            B = numeric.getBlock(H, [j+1,j],[J,m-1]);
            C = numeric.tensor(v,numeric.dot(v,B));
            for(i=j+1;i<=J;i++) { Hi = H[i]; Ci = C[i-j-1]; for(k=j;k<m;k++) Hi[k] -= 2*Ci[k-j]; }
            B = numeric.getBlock(H, [0,j+1],[m-1,J]);
            C = numeric.tensor(numeric.dot(B,v),v);
            for(i=0;i<m;i++) { Hi = H[i]; Ci = C[i]; for(k=j+1;k<=J;k++) Hi[k] -= 2*Ci[k-j-1]; }
            B = Array(J-j);
            for(i=j+1;i<=J;i++) B[i-j-1] = Q[i];
            C = numeric.tensor(v,numeric.dot(v,B));
            for(i=j+1;i<=J;i++) { Qi = Q[i]; Ci = C[i-j-1]; for(k=0;k<m;k++) Qi[k] -= 2*Ci[k]; }
        }
    }
    throw new Error('numeric: eigenvalue iteration does not converge -- increase maxiter?');
}

numeric.eig = function eig(A,maxiter) {
    var QH = numeric.toUpperHessenberg(A);
    var QB = numeric.QRFrancis(QH.H,maxiter);
    var T = numeric.T;
    var n = A.length,i,k,flag = false,B = QB.B,H = numeric.dot(QB.Q,numeric.dot(QH.H,numeric.transpose(QB.Q)));
    var Q = new T(numeric.dot(QB.Q,QH.Q)),Q0;
    var m = B.length,j;
    var a,b,c,d,p1,p2,disc,x,y,p,q,n1,n2;
    var sqrt = Math.sqrt;
    for(k=0;k<m;k++) {
        i = B[k][0];
        if(i === B[k][1]) {
            // nothing
        } else {
            j = i+1;
            a = H[i][i];
            b = H[i][j];
            c = H[j][i];
            d = H[j][j];
            if(b === 0 && c === 0) continue;
            p1 = -a-d;
            p2 = a*d-b*c;
            disc = p1*p1-4*p2;
            if(disc>=0) {
                if(p1<0) x = -0.5*(p1-sqrt(disc));
                else     x = -0.5*(p1+sqrt(disc));
                n1 = (a-x)*(a-x)+b*b;
                n2 = c*c+(d-x)*(d-x);
                if(n1>n2) {
                    n1 = sqrt(n1);
                    p = (a-x)/n1;
                    q = b/n1;
                } else {
                    n2 = sqrt(n2);
                    p = c/n2;
                    q = (d-x)/n2;
                }
                Q0 = new T([[q,-p],[p,q]]);
                Q.setRows(i,j,Q0.dot(Q.getRows(i,j)));
            } else {
                x = -0.5*p1;
                y = 0.5*sqrt(-disc);
                n1 = (a-x)*(a-x)+b*b;
                n2 = c*c+(d-x)*(d-x);
                if(n1>n2) {
                    n1 = sqrt(n1+y*y);
                    p = (a-x)/n1;
                    q = b/n1;
                    x = 0;
                    y /= n1;
                } else {
                    n2 = sqrt(n2+y*y);
                    p = c/n2;
                    q = (d-x)/n2;
                    x = y/n2;
                    y = 0;
                }
                Q0 = new T([[q,-p],[p,q]],[[x,y],[y,-x]]);
                Q.setRows(i,j,Q0.dot(Q.getRows(i,j)));
            }
        }
    }
    var R = Q.dot(A).dot(Q.transjugate()), n = A.length, E = numeric.T.identity(n);
    for(j=0;j<n;j++) {
        if(j>0) {
            for(k=j-1;k>=0;k--) {
                var Rk = R.get([k,k]), Rj = R.get([j,j]);
                if(numeric.neq(Rk.x,Rj.x) || numeric.neq(Rk.y,Rj.y)) {
                    x = R.getRow(k).getBlock([k],[j-1]);
                    y = E.getRow(j).getBlock([k],[j-1]);
                    E.set([j,k],(R.get([k,j]).neg().sub(x.dot(y))).div(Rk.sub(Rj)));
                } else {
                    E.setRow(j,E.getRow(k));
                    continue;
                }
            }
        }
    }
    for(j=0;j<n;j++) {
        x = E.getRow(j);
        E.setRow(j,x.div(x.norm2()));
    }
    E = E.transpose();
    E = Q.transjugate().dot(E);
    return { lambda:R.getDiag(), E:E };
};

// 5. Compressed Column Storage matrices
numeric.ccsSparse = function ccsSparse(A) {
    var m = A.length,n,foo, i,j, counts = [];
    for(i=m-1;i!==-1;--i) {
        foo = A[i];
        for(j in foo) {
            j = parseInt(j);
            while(j>=counts.length) counts[counts.length] = 0;
            if(foo[j]!==0) counts[j]++;
        }
    }
    var n = counts.length;
    var Ai = Array(n+1);
    Ai[0] = 0;
    for(i=0;i<n;++i) Ai[i+1] = Ai[i] + counts[i];
    var Aj = Array(Ai[n]), Av = Array(Ai[n]);
    for(i=m-1;i!==-1;--i) {
        foo = A[i];
        for(j in foo) {
            if(foo[j]!==0) {
                counts[j]--;
                Aj[Ai[j]+counts[j]] = i;
                Av[Ai[j]+counts[j]] = foo[j];
            }
        }
    }
    return [Ai,Aj,Av];
}
numeric.ccsFull = function ccsFull(A) {
    var Ai = A[0], Aj = A[1], Av = A[2], s = numeric.ccsDim(A), m = s[0], n = s[1], i,j,j0,j1,k;
    var B = numeric.rep([m,n],0);
    for(i=0;i<n;i++) {
        j0 = Ai[i];
        j1 = Ai[i+1];
        for(j=j0;j<j1;++j) { B[Aj[j]][i] = Av[j]; }
    }
    return B;
}
numeric.ccsTSolve = function ccsTSolve(A,b,x,bj,xj) {
    var Ai = A[0], Aj = A[1], Av = A[2],m = Ai.length-1, max = Math.max,n=0;
    if(typeof bj === "undefined") x = numeric.rep([m],0);
    if(typeof bj === "undefined") bj = numeric.linspace(0,x.length-1);
    if(typeof xj === "undefined") xj = [];
    function dfs(j) {
        var k;
        if(x[j] !== 0) return;
        x[j] = 1;
        for(k=Ai[j];k<Ai[j+1];++k) dfs(Aj[k]);
        xj[n] = j;
        ++n;
    }
    var i,j,j0,j1,k,l,l0,l1,a;
    for(i=bj.length-1;i!==-1;--i) { dfs(bj[i]); }
    xj.length = n;
    for(i=xj.length-1;i!==-1;--i) { x[xj[i]] = 0; }
    for(i=bj.length-1;i!==-1;--i) { j = bj[i]; x[j] = b[j]; }
    for(i=xj.length-1;i!==-1;--i) {
        j = xj[i];
        j0 = Ai[j];
        j1 = max(Ai[j+1],j0);
        for(k=j0;k!==j1;++k) { if(Aj[k] === j) { x[j] /= Av[k]; break; } }
        a = x[j];
        for(k=j0;k!==j1;++k) {
            l = Aj[k];
            if(l !== j) x[l] -= a*Av[k];
        }
    }
    return x;
}
numeric.ccsDFS = function ccsDFS(n) {
    this.k = Array(n);
    this.k1 = Array(n);
    this.j = Array(n);
}
numeric.ccsDFS.prototype.dfs = function dfs(J,Ai,Aj,x,xj,Pinv) {
    var m = 0,foo,n=xj.length;
    var k = this.k, k1 = this.k1, j = this.j,km,k11;
    if(x[J]!==0) return;
    x[J] = 1;
    j[0] = J;
    k[0] = km = Ai[J];
    k1[0] = k11 = Ai[J+1];
    while(1) {
        if(km >= k11) {
            xj[n] = j[m];
            if(m===0) return;
            ++n;
            --m;
            km = k[m];
            k11 = k1[m];
        } else {
            foo = Pinv[Aj[km]];
            if(x[foo] === 0) {
                x[foo] = 1;
                k[m] = km;
                ++m;
                j[m] = foo;
                km = Ai[foo];
                k1[m] = k11 = Ai[foo+1];
            } else ++km;
        }
    }
}
numeric.ccsLPSolve = function ccsLPSolve(A,B,x,xj,I,Pinv,dfs) {
    var Ai = A[0], Aj = A[1], Av = A[2],m = Ai.length-1, n=0;
    var Bi = B[0], Bj = B[1], Bv = B[2];
    
    var i,i0,i1,j,J,j0,j1,k,l,l0,l1,a;
    i0 = Bi[I];
    i1 = Bi[I+1];
    xj.length = 0;
    for(i=i0;i<i1;++i) { dfs.dfs(Pinv[Bj[i]],Ai,Aj,x,xj,Pinv); }
    for(i=xj.length-1;i!==-1;--i) { x[xj[i]] = 0; }
    for(i=i0;i!==i1;++i) { j = Pinv[Bj[i]]; x[j] = Bv[i]; }
    for(i=xj.length-1;i!==-1;--i) {
        j = xj[i];
        j0 = Ai[j];
        j1 = Ai[j+1];
        for(k=j0;k<j1;++k) { if(Pinv[Aj[k]] === j) { x[j] /= Av[k]; break; } }
        a = x[j];
        for(k=j0;k<j1;++k) {
            l = Pinv[Aj[k]];
            if(l !== j) x[l] -= a*Av[k];
        }
    }
    return x;
}
numeric.ccsLUP1 = function ccsLUP1(A,threshold) {
    var m = A[0].length-1;
    var L = [numeric.rep([m+1],0),[],[]], U = [numeric.rep([m+1], 0),[],[]];
    var Li = L[0], Lj = L[1], Lv = L[2], Ui = U[0], Uj = U[1], Uv = U[2];
    var x = numeric.rep([m],0), xj = numeric.rep([m],0);
    var i,j,k,j0,j1,a,e,c,d,K;
    var sol = numeric.ccsLPSolve, max = Math.max, abs = Math.abs;
    var P = numeric.linspace(0,m-1),Pinv = numeric.linspace(0,m-1);
    var dfs = new numeric.ccsDFS(m);
    if(typeof threshold === "undefined") { threshold = 1; }
    for(i=0;i<m;++i) {
        sol(L,A,x,xj,i,Pinv,dfs);
        a = -1;
        e = -1;
        for(j=xj.length-1;j!==-1;--j) {
            k = xj[j];
            if(k <= i) continue;
            c = abs(x[k]);
            if(c > a) { e = k; a = c; }
        }
        if(abs(x[i])<threshold*a) {
            j = P[i];
            a = P[e];
            P[i] = a; Pinv[a] = i;
            P[e] = j; Pinv[j] = e;
            a = x[i]; x[i] = x[e]; x[e] = a;
        }
        a = Li[i];
        e = Ui[i];
        d = x[i];
        Lj[a] = P[i];
        Lv[a] = 1;
        ++a;
        for(j=xj.length-1;j!==-1;--j) {
            k = xj[j];
            c = x[k];
            xj[j] = 0;
            x[k] = 0;
            if(k<=i) { Uj[e] = k; Uv[e] = c;   ++e; }
            else     { Lj[a] = P[k]; Lv[a] = c/d; ++a; }
        }
        Li[i+1] = a;
        Ui[i+1] = e;
    }
    for(j=Lj.length-1;j!==-1;--j) { Lj[j] = Pinv[Lj[j]]; }
    return {L:L, U:U, P:P, Pinv:Pinv};
}
numeric.ccsDFS0 = function ccsDFS0(n) {
    this.k = Array(n);
    this.k1 = Array(n);
    this.j = Array(n);
}
numeric.ccsDFS0.prototype.dfs = function dfs(J,Ai,Aj,x,xj,Pinv,P) {
    var m = 0,foo,n=xj.length;
    var k = this.k, k1 = this.k1, j = this.j,km,k11;
    if(x[J]!==0) return;
    x[J] = 1;
    j[0] = J;
    k[0] = km = Ai[Pinv[J]];
    k1[0] = k11 = Ai[Pinv[J]+1];
    while(1) {
        if(isNaN(km)) throw new Error("Ow!");
        if(km >= k11) {
            xj[n] = Pinv[j[m]];
            if(m===0) return;
            ++n;
            --m;
            km = k[m];
            k11 = k1[m];
        } else {
            foo = Aj[km];
            if(x[foo] === 0) {
                x[foo] = 1;
                k[m] = km;
                ++m;
                j[m] = foo;
                foo = Pinv[foo];
                km = Ai[foo];
                k1[m] = k11 = Ai[foo+1];
            } else ++km;
        }
    }
}
numeric.ccsLPSolve0 = function ccsLPSolve0(A,B,y,xj,I,Pinv,P,dfs) {
    var Ai = A[0], Aj = A[1], Av = A[2],m = Ai.length-1, n=0;
    var Bi = B[0], Bj = B[1], Bv = B[2];
    
    var i,i0,i1,j,J,j0,j1,k,l,l0,l1,a;
    i0 = Bi[I];
    i1 = Bi[I+1];
    xj.length = 0;
    for(i=i0;i<i1;++i) { dfs.dfs(Bj[i],Ai,Aj,y,xj,Pinv,P); }
    for(i=xj.length-1;i!==-1;--i) { j = xj[i]; y[P[j]] = 0; }
    for(i=i0;i!==i1;++i) { j = Bj[i]; y[j] = Bv[i]; }
    for(i=xj.length-1;i!==-1;--i) {
        j = xj[i];
        l = P[j];
        j0 = Ai[j];
        j1 = Ai[j+1];
        for(k=j0;k<j1;++k) { if(Aj[k] === l) { y[l] /= Av[k]; break; } }
        a = y[l];
        for(k=j0;k<j1;++k) y[Aj[k]] -= a*Av[k];
        y[l] = a;
    }
}
numeric.ccsLUP0 = function ccsLUP0(A,threshold) {
    var m = A[0].length-1;
    var L = [numeric.rep([m+1],0),[],[]], U = [numeric.rep([m+1], 0),[],[]];
    var Li = L[0], Lj = L[1], Lv = L[2], Ui = U[0], Uj = U[1], Uv = U[2];
    var y = numeric.rep([m],0), xj = numeric.rep([m],0);
    var i,j,k,j0,j1,a,e,c,d,K;
    var sol = numeric.ccsLPSolve0, max = Math.max, abs = Math.abs;
    var P = numeric.linspace(0,m-1),Pinv = numeric.linspace(0,m-1);
    var dfs = new numeric.ccsDFS0(m);
    if(typeof threshold === "undefined") { threshold = 1; }
    for(i=0;i<m;++i) {
        sol(L,A,y,xj,i,Pinv,P,dfs);
        a = -1;
        e = -1;
        for(j=xj.length-1;j!==-1;--j) {
            k = xj[j];
            if(k <= i) continue;
            c = abs(y[P[k]]);
            if(c > a) { e = k; a = c; }
        }
        if(abs(y[P[i]])<threshold*a) {
            j = P[i];
            a = P[e];
            P[i] = a; Pinv[a] = i;
            P[e] = j; Pinv[j] = e;
        }
        a = Li[i];
        e = Ui[i];
        d = y[P[i]];
        Lj[a] = P[i];
        Lv[a] = 1;
        ++a;
        for(j=xj.length-1;j!==-1;--j) {
            k = xj[j];
            c = y[P[k]];
            xj[j] = 0;
            y[P[k]] = 0;
            if(k<=i) { Uj[e] = k; Uv[e] = c;   ++e; }
            else     { Lj[a] = P[k]; Lv[a] = c/d; ++a; }
        }
        Li[i+1] = a;
        Ui[i+1] = e;
    }
    for(j=Lj.length-1;j!==-1;--j) { Lj[j] = Pinv[Lj[j]]; }
    return {L:L, U:U, P:P, Pinv:Pinv};
}
numeric.ccsLUP = numeric.ccsLUP0;

numeric.ccsDim = function ccsDim(A) { return [numeric.sup(A[1])+1,A[0].length-1]; }
numeric.ccsGetBlock = function ccsGetBlock(A,i,j) {
    var s = numeric.ccsDim(A),m=s[0],n=s[1];
    if(typeof i === "undefined") { i = numeric.linspace(0,m-1); }
    else if(typeof i === "number") { i = [i]; }
    if(typeof j === "undefined") { j = numeric.linspace(0,n-1); }
    else if(typeof j === "number") { j = [j]; }
    var p,p0,p1,P = i.length,q,Q = j.length,r,jq,ip;
    var Bi = numeric.rep([n],0), Bj=[], Bv=[], B = [Bi,Bj,Bv];
    var Ai = A[0], Aj = A[1], Av = A[2];
    var x = numeric.rep([m],0),count=0,flags = numeric.rep([m],0);
    for(q=0;q<Q;++q) {
        jq = j[q];
        var q0 = Ai[jq];
        var q1 = Ai[jq+1];
        for(p=q0;p<q1;++p) {
            r = Aj[p];
            flags[r] = 1;
            x[r] = Av[p];
        }
        for(p=0;p<P;++p) {
            ip = i[p];
            if(flags[ip]) {
                Bj[count] = p;
                Bv[count] = x[i[p]];
                ++count;
            }
        }
        for(p=q0;p<q1;++p) {
            r = Aj[p];
            flags[r] = 0;
        }
        Bi[q+1] = count;
    }
    return B;
}

numeric.ccsDot = function ccsDot(A,B) {
    var Ai = A[0], Aj = A[1], Av = A[2];
    var Bi = B[0], Bj = B[1], Bv = B[2];
    var sA = numeric.ccsDim(A), sB = numeric.ccsDim(B);
    var m = sA[0], n = sA[1], o = sB[1];
    var x = numeric.rep([m],0), flags = numeric.rep([m],0), xj = Array(m);
    var Ci = numeric.rep([o],0), Cj = [], Cv = [], C = [Ci,Cj,Cv];
    var i,j,k,j0,j1,i0,i1,l,p,a,b;
    for(k=0;k!==o;++k) {
        j0 = Bi[k];
        j1 = Bi[k+1];
        p = 0;
        for(j=j0;j<j1;++j) {
            a = Bj[j];
            b = Bv[j];
            i0 = Ai[a];
            i1 = Ai[a+1];
            for(i=i0;i<i1;++i) {
                l = Aj[i];
                if(flags[l]===0) {
                    xj[p] = l;
                    flags[l] = 1;
                    p = p+1;
                }
                x[l] = x[l] + Av[i]*b;
            }
        }
        j0 = Ci[k];
        j1 = j0+p;
        Ci[k+1] = j1;
        for(j=p-1;j!==-1;--j) {
            b = j0+j;
            i = xj[j];
            Cj[b] = i;
            Cv[b] = x[i];
            flags[i] = 0;
            x[i] = 0;
        }
        Ci[k+1] = Ci[k]+p;
    }
    return C;
}

numeric.ccsLUPSolve = function ccsLUPSolve(LUP,B) {
    var L = LUP.L, U = LUP.U, P = LUP.P;
    var Bi = B[0];
    var flag = false;
    if(typeof Bi !== "object") { B = [[0,B.length],numeric.linspace(0,B.length-1),B]; Bi = B[0]; flag = true; }
    var Bj = B[1], Bv = B[2];
    var n = L[0].length-1, m = Bi.length-1;
    var x = numeric.rep([n],0), xj = Array(n);
    var b = numeric.rep([n],0), bj = Array(n);
    var Xi = numeric.rep([m+1],0), Xj = [], Xv = [];
    var sol = numeric.ccsTSolve;
    var i,j,j0,j1,k,J,N=0;
    for(i=0;i<m;++i) {
        k = 0;
        j0 = Bi[i];
        j1 = Bi[i+1];
        for(j=j0;j<j1;++j) { 
            J = LUP.Pinv[Bj[j]];
            bj[k] = J;
            b[J] = Bv[j];
            ++k;
        }
        bj.length = k;
        sol(L,b,x,bj,xj);
        for(j=bj.length-1;j!==-1;--j) b[bj[j]] = 0;
        sol(U,x,b,xj,bj);
        if(flag) return b;
        for(j=xj.length-1;j!==-1;--j) x[xj[j]] = 0;
        for(j=bj.length-1;j!==-1;--j) {
            J = bj[j];
            Xj[N] = J;
            Xv[N] = b[J];
            b[J] = 0;
            ++N;
        }
        Xi[i+1] = N;
    }
    return [Xi,Xj,Xv];
}

numeric.ccsbinop = function ccsbinop(body,setup) {
    if(typeof setup === "undefined") setup='';
    return Function('X','Y',
            'var Xi = X[0], Xj = X[1], Xv = X[2];\n'+
            'var Yi = Y[0], Yj = Y[1], Yv = Y[2];\n'+
            'var n = Xi.length-1,m = Math.max(numeric.sup(Xj),numeric.sup(Yj))+1;\n'+
            'var Zi = numeric.rep([n+1],0), Zj = [], Zv = [];\n'+
            'var x = numeric.rep([m],0),y = numeric.rep([m],0);\n'+
            'var xk,yk,zk;\n'+
            'var i,j,j0,j1,k,p=0;\n'+
            setup+
            'for(i=0;i<n;++i) {\n'+
            '  j0 = Xi[i]; j1 = Xi[i+1];\n'+
            '  for(j=j0;j!==j1;++j) {\n'+
            '    k = Xj[j];\n'+
            '    x[k] = 1;\n'+
            '    Zj[p] = k;\n'+
            '    ++p;\n'+
            '  }\n'+
            '  j0 = Yi[i]; j1 = Yi[i+1];\n'+
            '  for(j=j0;j!==j1;++j) {\n'+
            '    k = Yj[j];\n'+
            '    y[k] = Yv[j];\n'+
            '    if(x[k] === 0) {\n'+
            '      Zj[p] = k;\n'+
            '      ++p;\n'+
            '    }\n'+
            '  }\n'+
            '  Zi[i+1] = p;\n'+
            '  j0 = Xi[i]; j1 = Xi[i+1];\n'+
            '  for(j=j0;j!==j1;++j) x[Xj[j]] = Xv[j];\n'+
            '  j0 = Zi[i]; j1 = Zi[i+1];\n'+
            '  for(j=j0;j!==j1;++j) {\n'+
            '    k = Zj[j];\n'+
            '    xk = x[k];\n'+
            '    yk = y[k];\n'+
            body+'\n'+
            '    Zv[j] = zk;\n'+
            '  }\n'+
            '  j0 = Xi[i]; j1 = Xi[i+1];\n'+
            '  for(j=j0;j!==j1;++j) x[Xj[j]] = 0;\n'+
            '  j0 = Yi[i]; j1 = Yi[i+1];\n'+
            '  for(j=j0;j!==j1;++j) y[Yj[j]] = 0;\n'+
            '}\n'+
            'return [Zi,Zj,Zv];'
            );
};

(function() {
    var k,A,B,C;
    for(k in numeric.ops2) {
        if(isFinite(eval('1'+numeric.ops2[k]+'0'))) A = '[Y[0],Y[1],numeric.'+k+'(X,Y[2])]';
        else A = 'NaN';
        if(isFinite(eval('0'+numeric.ops2[k]+'1'))) B = '[X[0],X[1],numeric.'+k+'(X[2],Y)]';
        else B = 'NaN';
        if(isFinite(eval('1'+numeric.ops2[k]+'0')) && isFinite(eval('0'+numeric.ops2[k]+'1'))) C = 'numeric.ccs'+k+'MM(X,Y)';
        else C = 'NaN';
        numeric['ccs'+k+'MM'] = numeric.ccsbinop('zk = xk '+numeric.ops2[k]+'yk;');
        numeric['ccs'+k] = Function('X','Y',
                'if(typeof X === "number") return '+A+';\n'+
                'if(typeof Y === "number") return '+B+';\n'+
                'return '+C+';\n'
                );
    }
}());

numeric.ccsScatter = function ccsScatter(A) {
    var Ai = A[0], Aj = A[1], Av = A[2];
    var n = numeric.sup(Aj)+1,m=Ai.length;
    var Ri = numeric.rep([n],0),Rj=Array(m), Rv = Array(m);
    var counts = numeric.rep([n],0),i;
    for(i=0;i<m;++i) counts[Aj[i]]++;
    for(i=0;i<n;++i) Ri[i+1] = Ri[i] + counts[i];
    var ptr = Ri.slice(0),k,Aii;
    for(i=0;i<m;++i) {
        Aii = Aj[i];
        k = ptr[Aii];
        Rj[k] = Ai[i];
        Rv[k] = Av[i];
        ptr[Aii]=ptr[Aii]+1;
    }
    return [Ri,Rj,Rv];
}

numeric.ccsGather = function ccsGather(A) {
    var Ai = A[0], Aj = A[1], Av = A[2];
    var n = Ai.length-1,m = Aj.length;
    var Ri = Array(m), Rj = Array(m), Rv = Array(m);
    var i,j,j0,j1,p;
    p=0;
    for(i=0;i<n;++i) {
        j0 = Ai[i];
        j1 = Ai[i+1];
        for(j=j0;j!==j1;++j) {
            Rj[p] = i;
            Ri[p] = Aj[j];
            Rv[p] = Av[j];
            ++p;
        }
    }
    return [Ri,Rj,Rv];
}

// The following sparse linear algebra routines are deprecated.

numeric.sdim = function dim(A,ret,k) {
    if(typeof ret === "undefined") { ret = []; }
    if(typeof A !== "object") return ret;
    if(typeof k === "undefined") { k=0; }
    if(!(k in ret)) { ret[k] = 0; }
    if(A.length > ret[k]) ret[k] = A.length;
    var i;
    for(i in A) {
        if(A.hasOwnProperty(i)) dim(A[i],ret,k+1);
    }
    return ret;
};

numeric.sclone = function clone(A,k,n) {
    if(typeof k === "undefined") { k=0; }
    if(typeof n === "undefined") { n = numeric.sdim(A).length; }
    var i,ret = Array(A.length);
    if(k === n-1) {
        for(i in A) { if(A.hasOwnProperty(i)) ret[i] = A[i]; }
        return ret;
    }
    for(i in A) {
        if(A.hasOwnProperty(i)) ret[i] = clone(A[i],k+1,n);
    }
    return ret;
}

numeric.sdiag = function diag(d) {
    var n = d.length,i,ret = Array(n),i1,i2,i3;
    for(i=n-1;i>=1;i-=2) {
        i1 = i-1;
        ret[i] = []; ret[i][i] = d[i];
        ret[i1] = []; ret[i1][i1] = d[i1];
    }
    if(i===0) { ret[0] = []; ret[0][0] = d[i]; }
    return ret;
}

numeric.sidentity = function identity(n) { return numeric.sdiag(numeric.rep([n],1)); }

numeric.stranspose = function transpose(A) {
    var ret = [], n = A.length, i,j,Ai;
    for(i in A) {
        if(!(A.hasOwnProperty(i))) continue;
        Ai = A[i];
        for(j in Ai) {
            if(!(Ai.hasOwnProperty(j))) continue;
            if(typeof ret[j] !== "object") { ret[j] = []; }
            ret[j][i] = Ai[j];
        }
    }
    return ret;
}

numeric.sLUP = function LUP(A,tol) {
    throw new Error("The function numeric.sLUP had a bug in it and has been removed. Please use the new numeric.ccsLUP function instead.");
};

numeric.sdotMM = function dotMM(A,B) {
    var p = A.length, q = B.length, BT = numeric.stranspose(B), r = BT.length, Ai, BTk;
    var i,j,k,accum;
    var ret = Array(p),reti;
    for(i=p-1;i>=0;i--) {
        reti = [];
        Ai = A[i];
        for(k=r-1;k>=0;k--) {
            accum = 0;
            BTk = BT[k];
            for(j in Ai) {
                if(!(Ai.hasOwnProperty(j))) continue;
                if(j in BTk) { accum += Ai[j]*BTk[j]; }
            }
            if(accum) reti[k] = accum;
        }
        ret[i] = reti;
    }
    return ret;
}

numeric.sdotMV = function dotMV(A,x) {
    var p = A.length, Ai, i,j;
    var ret = Array(p), accum;
    for(i=p-1;i>=0;i--) {
        Ai = A[i];
        accum = 0;
        for(j in Ai) {
            if(!(Ai.hasOwnProperty(j))) continue;
            if(x[j]) accum += Ai[j]*x[j];
        }
        if(accum) ret[i] = accum;
    }
    return ret;
}

numeric.sdotVM = function dotMV(x,A) {
    var i,j,Ai,alpha;
    var ret = [], accum;
    for(i in x) {
        if(!x.hasOwnProperty(i)) continue;
        Ai = A[i];
        alpha = x[i];
        for(j in Ai) {
            if(!Ai.hasOwnProperty(j)) continue;
            if(!ret[j]) { ret[j] = 0; }
            ret[j] += alpha*Ai[j];
        }
    }
    return ret;
}

numeric.sdotVV = function dotVV(x,y) {
    var i,ret=0;
    for(i in x) { if(x[i] && y[i]) ret+= x[i]*y[i]; }
    return ret;
}

numeric.sdot = function dot(A,B) {
    var m = numeric.sdim(A).length, n = numeric.sdim(B).length;
    var k = m*1000+n;
    switch(k) {
    case 0: return A*B;
    case 1001: return numeric.sdotVV(A,B);
    case 2001: return numeric.sdotMV(A,B);
    case 1002: return numeric.sdotVM(A,B);
    case 2002: return numeric.sdotMM(A,B);
    default: throw new Error('numeric.sdot not implemented for tensors of order '+m+' and '+n);
    }
}

numeric.sscatter = function scatter(V) {
    var n = V[0].length, Vij, i, j, m = V.length, A = [], Aj;
    for(i=n-1;i>=0;--i) {
        if(!V[m-1][i]) continue;
        Aj = A;
        for(j=0;j<m-2;j++) {
            Vij = V[j][i];
            if(!Aj[Vij]) Aj[Vij] = [];
            Aj = Aj[Vij];
        }
        Aj[V[j][i]] = V[j+1][i];
    }
    return A;
}

numeric.sgather = function gather(A,ret,k) {
    if(typeof ret === "undefined") ret = [];
    if(typeof k === "undefined") k = [];
    var n,i,Ai;
    n = k.length;
    for(i in A) {
        if(A.hasOwnProperty(i)) {
            k[n] = parseInt(i);
            Ai = A[i];
            if(typeof Ai === "number") {
                if(Ai) {
                    if(ret.length === 0) {
                        for(i=n+1;i>=0;--i) ret[i] = [];
                    }
                    for(i=n;i>=0;--i) ret[i].push(k[i]);
                    ret[n+1].push(Ai);
                }
            } else gather(Ai,ret,k);
        }
    }
    if(k.length>n) k.pop();
    return ret;
}

// 6. Coordinate matrices
numeric.cLU = function LU(A) {
    var I = A[0], J = A[1], V = A[2];
    var p = I.length, m=0, i,j,k,a,b,c;
    for(i=0;i<p;i++) if(I[i]>m) m=I[i];
    m++;
    var L = Array(m), U = Array(m), left = numeric.rep([m],Infinity), right = numeric.rep([m],-Infinity);
    var Ui, Uj,alpha;
    for(k=0;k<p;k++) {
        i = I[k];
        j = J[k];
        if(j<left[i]) left[i] = j;
        if(j>right[i]) right[i] = j;
    }
    for(i=0;i<m-1;i++) { if(right[i] > right[i+1]) right[i+1] = right[i]; }
    for(i=m-1;i>=1;i--) { if(left[i]<left[i-1]) left[i-1] = left[i]; }
    var countL = 0, countU = 0;
    for(i=0;i<m;i++) {
        U[i] = numeric.rep([right[i]-left[i]+1],0);
        L[i] = numeric.rep([i-left[i]],0);
        countL += i-left[i]+1;
        countU += right[i]-i+1;
    }
    for(k=0;k<p;k++) { i = I[k]; U[i][J[k]-left[i]] = V[k]; }
    for(i=0;i<m-1;i++) {
        a = i-left[i];
        Ui = U[i];
        for(j=i+1;left[j]<=i && j<m;j++) {
            b = i-left[j];
            c = right[i]-i;
            Uj = U[j];
            alpha = Uj[b]/Ui[a];
            if(alpha) {
                for(k=1;k<=c;k++) { Uj[k+b] -= alpha*Ui[k+a]; }
                L[j][i-left[j]] = alpha;
            }
        }
    }
    var Ui = [], Uj = [], Uv = [], Li = [], Lj = [], Lv = [];
    var p,q,foo;
    p=0; q=0;
    for(i=0;i<m;i++) {
        a = left[i];
        b = right[i];
        foo = U[i];
        for(j=i;j<=b;j++) {
            if(foo[j-a]) {
                Ui[p] = i;
                Uj[p] = j;
                Uv[p] = foo[j-a];
                p++;
            }
        }
        foo = L[i];
        for(j=a;j<i;j++) {
            if(foo[j-a]) {
                Li[q] = i;
                Lj[q] = j;
                Lv[q] = foo[j-a];
                q++;
            }
        }
        Li[q] = i;
        Lj[q] = i;
        Lv[q] = 1;
        q++;
    }
    return {U:[Ui,Uj,Uv], L:[Li,Lj,Lv]};
};

numeric.cLUsolve = function LUsolve(lu,b) {
    var L = lu.L, U = lu.U, ret = numeric.clone(b);
    var Li = L[0], Lj = L[1], Lv = L[2];
    var Ui = U[0], Uj = U[1], Uv = U[2];
    var p = Ui.length, q = Li.length;
    var m = ret.length,i,j,k;
    k = 0;
    for(i=0;i<m;i++) {
        while(Lj[k] < i) {
            ret[i] -= Lv[k]*ret[Lj[k]];
            k++;
        }
        k++;
    }
    k = p-1;
    for(i=m-1;i>=0;i--) {
        while(Uj[k] > i) {
            ret[i] -= Uv[k]*ret[Uj[k]];
            k--;
        }
        ret[i] /= Uv[k];
        k--;
    }
    return ret;
};

numeric.cgrid = function grid(n,shape) {
    if(typeof n === "number") n = [n,n];
    var ret = numeric.rep(n,-1);
    var i,j,count;
    if(typeof shape !== "function") {
        switch(shape) {
        case 'L':
            shape = function(i,j) { return (i>=n[0]/2 || j<n[1]/2); }
            break;
        default:
            shape = function(i,j) { return true; };
            break;
        }
    }
    count=0;
    for(i=1;i<n[0]-1;i++) for(j=1;j<n[1]-1;j++) 
        if(shape(i,j)) {
            ret[i][j] = count;
            count++;
        }
    return ret;
}

numeric.cdelsq = function delsq(g) {
    var dir = [[-1,0],[0,-1],[0,1],[1,0]];
    var s = numeric.dim(g), m = s[0], n = s[1], i,j,k,p,q;
    var Li = [], Lj = [], Lv = [];
    for(i=1;i<m-1;i++) for(j=1;j<n-1;j++) {
        if(g[i][j]<0) continue;
        for(k=0;k<4;k++) {
            p = i+dir[k][0];
            q = j+dir[k][1];
            if(g[p][q]<0) continue;
            Li.push(g[i][j]);
            Lj.push(g[p][q]);
            Lv.push(-1);
        }
        Li.push(g[i][j]);
        Lj.push(g[i][j]);
        Lv.push(4);
    }
    return [Li,Lj,Lv];
}

numeric.cdotMV = function dotMV(A,x) {
    var ret, Ai = A[0], Aj = A[1], Av = A[2],k,p=Ai.length,N;
    N=0;
    for(k=0;k<p;k++) { if(Ai[k]>N) N = Ai[k]; }
    N++;
    ret = numeric.rep([N],0);
    for(k=0;k<p;k++) { ret[Ai[k]]+=Av[k]*x[Aj[k]]; }
    return ret;
}

// 7. Splines

numeric.Spline = function Spline(x,yl,yr,kl,kr) { this.x = x; this.yl = yl; this.yr = yr; this.kl = kl; this.kr = kr; }
numeric.Spline.prototype._at = function _at(x1,p) {
    var x = this.x;
    var yl = this.yl;
    var yr = this.yr;
    var kl = this.kl;
    var kr = this.kr;
    var x1,a,b,t;
    var add = numeric.add, sub = numeric.sub, mul = numeric.mul;
    a = sub(mul(kl[p],x[p+1]-x[p]),sub(yr[p+1],yl[p]));
    b = add(mul(kr[p+1],x[p]-x[p+1]),sub(yr[p+1],yl[p]));
    t = (x1-x[p])/(x[p+1]-x[p]);
    var s = t*(1-t);
    return add(add(add(mul(1-t,yl[p]),mul(t,yr[p+1])),mul(a,s*(1-t))),mul(b,s*t));
}
numeric.Spline.prototype.at = function at(x0) {
    if(typeof x0 === "number") {
        var x = this.x;
        var n = x.length;
        var p,q,mid,floor = Math.floor,a,b,t;
        p = 0;
        q = n-1;
        while(q-p>1) {
            mid = floor((p+q)/2);
            if(x[mid] <= x0) p = mid;
            else q = mid;
        }
        return this._at(x0,p);
    }
    var n = x0.length, i, ret = Array(n);
    for(i=n-1;i!==-1;--i) ret[i] = this.at(x0[i]);
    return ret;
}
numeric.Spline.prototype.diff = function diff() {
    var x = this.x;
    var yl = this.yl;
    var yr = this.yr;
    var kl = this.kl;
    var kr = this.kr;
    var n = yl.length;
    var i,dx,dy;
    var zl = kl, zr = kr, pl = Array(n), pr = Array(n);
    var add = numeric.add, mul = numeric.mul, div = numeric.div, sub = numeric.sub;
    for(i=n-1;i!==-1;--i) {
        dx = x[i+1]-x[i];
        dy = sub(yr[i+1],yl[i]);
        pl[i] = div(add(mul(dy, 6),mul(kl[i],-4*dx),mul(kr[i+1],-2*dx)),dx*dx);
        pr[i+1] = div(add(mul(dy,-6),mul(kl[i], 2*dx),mul(kr[i+1], 4*dx)),dx*dx);
    }
    return new numeric.Spline(x,zl,zr,pl,pr);
}
numeric.Spline.prototype.roots = function roots() {
    function sqr(x) { return x*x; }
    function heval(y0,y1,k0,k1,x) {
        var A = k0*2-(y1-y0);
        var B = -k1*2+(y1-y0);
        var t = (x+1)*0.5;
        var s = t*(1-t);
        return (1-t)*y0+t*y1+A*s*(1-t)+B*s*t;
    }
    var ret = [];
    var x = this.x, yl = this.yl, yr = this.yr, kl = this.kl, kr = this.kr;
    if(typeof yl[0] === "number") {
        yl = [yl];
        yr = [yr];
        kl = [kl];
        kr = [kr];
    }
    var m = yl.length,n=x.length-1,i,j,k,y,s,t;
    var ai,bi,ci,di, ret = Array(m),ri,k0,k1,y0,y1,A,B,D,dx,cx,stops,z0,z1,zm,t0,t1,tm;
    var sqrt = Math.sqrt;
    for(i=0;i!==m;++i) {
        ai = yl[i];
        bi = yr[i];
        ci = kl[i];
        di = kr[i];
        ri = [];
        for(j=0;j!==n;j++) {
            if(j>0 && bi[j]*ai[j]<0) ri.push(x[j]);
            dx = (x[j+1]-x[j]);
            cx = x[j];
            y0 = ai[j];
            y1 = bi[j+1];
            k0 = ci[j]/dx;
            k1 = di[j+1]/dx;
            D = sqr(k0-k1+3*(y0-y1)) + 12*k1*y0;
            A = k1+3*y0+2*k0-3*y1;
            B = 3*(k1+k0+2*(y0-y1));
            if(D<=0) {
                z0 = A/B;
                if(z0>x[j] && z0<x[j+1]) stops = [x[j],z0,x[j+1]];
                else stops = [x[j],x[j+1]];
            } else {
                z0 = (A-sqrt(D))/B;
                z1 = (A+sqrt(D))/B;
                stops = [x[j]];
                if(z0>x[j] && z0<x[j+1]) stops.push(z0);
                if(z1>x[j] && z1<x[j+1]) stops.push(z1);
                stops.push(x[j+1]);
            }
            t0 = stops[0];
            z0 = this._at(t0,j);
            for(k=0;k<stops.length-1;k++) {
                t1 = stops[k+1];
                z1 = this._at(t1,j);
                if(z0 === 0) {
                    ri.push(t0); 
                    t0 = t1;
                    z0 = z1;
                    continue;
                }
                if(z1 === 0 || z0*z1>0) {
                    t0 = t1;
                    z0 = z1;
                    continue;
                }
                var side = 0;
                while(1) {
                    tm = (z0*t1-z1*t0)/(z0-z1);
                    if(tm <= t0 || tm >= t1) { break; }
                    zm = this._at(tm,j);
                    if(zm*z1>0) {
                        t1 = tm;
                        z1 = zm;
                        if(side === -1) z0*=0.5;
                        side = -1;
                    } else if(zm*z0>0) {
                        t0 = tm;
                        z0 = zm;
                        if(side === 1) z1*=0.5;
                        side = 1;
                    } else break;
                }
                ri.push(tm);
                t0 = stops[k+1];
                z0 = this._at(t0, j);
            }
            if(z1 === 0) ri.push(t1);
        }
        ret[i] = ri;
    }
    if(typeof this.yl[0] === "number") return ret[0];
    return ret;
}
numeric.spline = function spline(x,y,k1,kn) {
    var n = x.length, b = [], dx = [], dy = [];
    var i;
    var sub = numeric.sub,mul = numeric.mul,add = numeric.add;
    for(i=n-2;i>=0;i--) { dx[i] = x[i+1]-x[i]; dy[i] = sub(y[i+1],y[i]); }
    if(typeof k1 === "string" || typeof kn === "string") { 
        k1 = kn = "periodic";
    }
    // Build sparse tridiagonal system
    var T = [[],[],[]];
    switch(typeof k1) {
    case "undefined":
        b[0] = mul(3/(dx[0]*dx[0]),dy[0]);
        T[0].push(0,0);
        T[1].push(0,1);
        T[2].push(2/dx[0],1/dx[0]);
        break;
    case "string":
        b[0] = add(mul(3/(dx[n-2]*dx[n-2]),dy[n-2]),mul(3/(dx[0]*dx[0]),dy[0]));
        T[0].push(0,0,0);
        T[1].push(n-2,0,1);
        T[2].push(1/dx[n-2],2/dx[n-2]+2/dx[0],1/dx[0]);
        break;
    default:
        b[0] = k1;
        T[0].push(0);
        T[1].push(0);
        T[2].push(1);
        break;
    }
    for(i=1;i<n-1;i++) {
        b[i] = add(mul(3/(dx[i-1]*dx[i-1]),dy[i-1]),mul(3/(dx[i]*dx[i]),dy[i]));
        T[0].push(i,i,i);
        T[1].push(i-1,i,i+1);
        T[2].push(1/dx[i-1],2/dx[i-1]+2/dx[i],1/dx[i]);
    }
    switch(typeof kn) {
    case "undefined":
        b[n-1] = mul(3/(dx[n-2]*dx[n-2]),dy[n-2]);
        T[0].push(n-1,n-1);
        T[1].push(n-2,n-1);
        T[2].push(1/dx[n-2],2/dx[n-2]);
        break;
    case "string":
        T[1][T[1].length-1] = 0;
        break;
    default:
        b[n-1] = kn;
        T[0].push(n-1);
        T[1].push(n-1);
        T[2].push(1);
        break;
    }
    if(typeof b[0] !== "number") b = numeric.transpose(b);
    else b = [b];
    var k = Array(b.length);
    if(typeof k1 === "string") {
        for(i=k.length-1;i!==-1;--i) {
            k[i] = numeric.ccsLUPSolve(numeric.ccsLUP(numeric.ccsScatter(T)),b[i]);
            k[i][n-1] = k[i][0];
        }
    } else {
        for(i=k.length-1;i!==-1;--i) {
            k[i] = numeric.cLUsolve(numeric.cLU(T),b[i]);
        }
    }
    if(typeof y[0] === "number") k = k[0];
    else k = numeric.transpose(k);
    return new numeric.Spline(x,y,y,k,k);
}

// 8. FFT
numeric.fftpow2 = function fftpow2(x,y) {
    var n = x.length;
    if(n === 1) return;
    var cos = Math.cos, sin = Math.sin, i,j;
    var xe = Array(n/2), ye = Array(n/2), xo = Array(n/2), yo = Array(n/2);
    j = n/2;
    for(i=n-1;i!==-1;--i) {
        --j;
        xo[j] = x[i];
        yo[j] = y[i];
        --i;
        xe[j] = x[i];
        ye[j] = y[i];
    }
    fftpow2(xe,ye);
    fftpow2(xo,yo);
    j = n/2;
    var t,k = (-6.2831853071795864769252867665590057683943387987502116419/n),ci,si;
    for(i=n-1;i!==-1;--i) {
        --j;
        if(j === -1) j = n/2-1;
        t = k*i;
        ci = cos(t);
        si = sin(t);
        x[i] = xe[j] + ci*xo[j] - si*yo[j];
        y[i] = ye[j] + ci*yo[j] + si*xo[j];
    }
}
numeric._ifftpow2 = function _ifftpow2(x,y) {
    var n = x.length;
    if(n === 1) return;
    var cos = Math.cos, sin = Math.sin, i,j;
    var xe = Array(n/2), ye = Array(n/2), xo = Array(n/2), yo = Array(n/2);
    j = n/2;
    for(i=n-1;i!==-1;--i) {
        --j;
        xo[j] = x[i];
        yo[j] = y[i];
        --i;
        xe[j] = x[i];
        ye[j] = y[i];
    }
    _ifftpow2(xe,ye);
    _ifftpow2(xo,yo);
    j = n/2;
    var t,k = (6.2831853071795864769252867665590057683943387987502116419/n),ci,si;
    for(i=n-1;i!==-1;--i) {
        --j;
        if(j === -1) j = n/2-1;
        t = k*i;
        ci = cos(t);
        si = sin(t);
        x[i] = xe[j] + ci*xo[j] - si*yo[j];
        y[i] = ye[j] + ci*yo[j] + si*xo[j];
    }
}
numeric.ifftpow2 = function ifftpow2(x,y) {
    numeric._ifftpow2(x,y);
    numeric.diveq(x,x.length);
    numeric.diveq(y,y.length);
}
numeric.convpow2 = function convpow2(ax,ay,bx,by) {
    numeric.fftpow2(ax,ay);
    numeric.fftpow2(bx,by);
    var i,n = ax.length,axi,bxi,ayi,byi;
    for(i=n-1;i!==-1;--i) {
        axi = ax[i]; ayi = ay[i]; bxi = bx[i]; byi = by[i];
        ax[i] = axi*bxi-ayi*byi;
        ay[i] = axi*byi+ayi*bxi;
    }
    numeric.ifftpow2(ax,ay);
}
numeric.T.prototype.fft = function fft() {
    var x = this.x, y = this.y;
    var n = x.length, log = Math.log, log2 = log(2),
        p = Math.ceil(log(2*n-1)/log2), m = Math.pow(2,p);
    var cx = numeric.rep([m],0), cy = numeric.rep([m],0), cos = Math.cos, sin = Math.sin;
    var k, c = (-3.141592653589793238462643383279502884197169399375105820/n),t;
    var a = numeric.rep([m],0), b = numeric.rep([m],0),nhalf = Math.floor(n/2);
    for(k=0;k<n;k++) a[k] = x[k];
    if(typeof y !== "undefined") for(k=0;k<n;k++) b[k] = y[k];
    cx[0] = 1;
    for(k=1;k<=m/2;k++) {
        t = c*k*k;
        cx[k] = cos(t);
        cy[k] = sin(t);
        cx[m-k] = cos(t);
        cy[m-k] = sin(t)
    }
    var X = new numeric.T(a,b), Y = new numeric.T(cx,cy);
    X = X.mul(Y);
    numeric.convpow2(X.x,X.y,numeric.clone(Y.x),numeric.neg(Y.y));
    X = X.mul(Y);
    X.x.length = n;
    X.y.length = n;
    return X;
}
numeric.T.prototype.ifft = function ifft() {
    var x = this.x, y = this.y;
    var n = x.length, log = Math.log, log2 = log(2),
        p = Math.ceil(log(2*n-1)/log2), m = Math.pow(2,p);
    var cx = numeric.rep([m],0), cy = numeric.rep([m],0), cos = Math.cos, sin = Math.sin;
    var k, c = (3.141592653589793238462643383279502884197169399375105820/n),t;
    var a = numeric.rep([m],0), b = numeric.rep([m],0),nhalf = Math.floor(n/2);
    for(k=0;k<n;k++) a[k] = x[k];
    if(typeof y !== "undefined") for(k=0;k<n;k++) b[k] = y[k];
    cx[0] = 1;
    for(k=1;k<=m/2;k++) {
        t = c*k*k;
        cx[k] = cos(t);
        cy[k] = sin(t);
        cx[m-k] = cos(t);
        cy[m-k] = sin(t)
    }
    var X = new numeric.T(a,b), Y = new numeric.T(cx,cy);
    X = X.mul(Y);
    numeric.convpow2(X.x,X.y,numeric.clone(Y.x),numeric.neg(Y.y));
    X = X.mul(Y);
    X.x.length = n;
    X.y.length = n;
    return X.div(n);
}

//9. Unconstrained optimization
numeric.gradient = function gradient(f,x) {
    var n = x.length;
    var f0 = f(x);
    if(isNaN(f0)) throw new Error('gradient: f(x) is a NaN!');
    var max = Math.max;
    var i,x0 = numeric.clone(x),f1,f2, J = Array(n);
    var div = numeric.div, sub = numeric.sub,errest,roundoff,max = Math.max,eps = 1e-3,abs = Math.abs, min = Math.min;
    var t0,t1,t2,it=0,d1,d2,N;
    for(i=0;i<n;i++) {
        var h = max(1e-6*f0,1e-8);
        while(1) {
            ++it;
            if(it>20) { throw new Error("Numerical gradient fails"); }
            x0[i] = x[i]+h;
            f1 = f(x0);
            x0[i] = x[i]-h;
            f2 = f(x0);
            x0[i] = x[i];
            if(isNaN(f1) || isNaN(f2)) { h/=16; continue; }
            J[i] = (f1-f2)/(2*h);
            t0 = x[i]-h;
            t1 = x[i];
            t2 = x[i]+h;
            d1 = (f1-f0)/h;
            d2 = (f0-f2)/h;
            N = max(abs(J[i]),abs(f0),abs(f1),abs(f2),abs(t0),abs(t1),abs(t2),1e-8);
            errest = min(max(abs(d1-J[i]),abs(d2-J[i]),abs(d1-d2))/N,h/N);
            if(errest>eps) { h/=16; }
            else break;
            }
    }
    return J;
}

numeric.uncmin = function uncmin(f,x0,tol,gradient,maxit,callback,options) {
    var grad = numeric.gradient;
    if(typeof options === "undefined") { options = {}; }
    if(typeof tol === "undefined") { tol = 1e-8; }
    if(typeof gradient === "undefined") { gradient = function(x) { return grad(f,x); }; }
    if(typeof maxit === "undefined") maxit = 1000;
    x0 = numeric.clone(x0);
    var n = x0.length;
    var f0 = f(x0),f1,df0;
    if(isNaN(f0)) throw new Error('uncmin: f(x0) is a NaN!');
    var max = Math.max, norm2 = numeric.norm2;
    tol = max(tol,numeric.epsilon);
    var step,g0,g1,H1 = options.Hinv || numeric.identity(n);
    var dot = numeric.dot, inv = numeric.inv, sub = numeric.sub, add = numeric.add, ten = numeric.tensor, div = numeric.div, mul = numeric.mul;
    var all = numeric.all, isfinite = numeric.isFinite, neg = numeric.neg;
    var it=0,i,s,x1,y,Hy,Hs,ys,i0,t,nstep,t1,t2;
    var msg = "";
    g0 = gradient(x0);
    while(it<maxit) {
        if(typeof callback === "function") { if(callback(it,x0,f0,g0,H1)) { msg = "Callback returned true"; break; } }
        if(!all(isfinite(g0))) { msg = "Gradient has Infinity or NaN"; break; }
        step = neg(dot(H1,g0));
        if(!all(isfinite(step))) { msg = "Search direction has Infinity or NaN"; break; }
        nstep = norm2(step);
        if(nstep < tol) { msg="Newton step smaller than tol"; break; }
        t = 1;
        df0 = dot(g0,step);
        // line search
        x1 = x0;
        while(it < maxit) {
            if(t*nstep < tol) { break; }
            s = mul(step,t);
            x1 = add(x0,s);
            f1 = f(x1);
            if(f1-f0 >= 0.1*t*df0 || isNaN(f1)) {
                t *= 0.5;
                ++it;
                continue;
            }
            break;
        }
        if(t*nstep < tol) { msg = "Line search step size smaller than tol"; break; }
        if(it === maxit) { msg = "maxit reached during line search"; break; }
        g1 = gradient(x1);
        y = sub(g1,g0);
        ys = dot(y,s);
        Hy = dot(H1,y);
        H1 = sub(add(H1,
                mul(
                        (ys+dot(y,Hy))/(ys*ys),
                        ten(s,s)    )),
                div(add(ten(Hy,s),ten(s,Hy)),ys));
        x0 = x1;
        f0 = f1;
        g0 = g1;
        ++it;
    }
    return {solution: x0, f: f0, gradient: g0, invHessian: H1, iterations:it, message: msg};
}

// 10. Ode solver (Dormand-Prince)
numeric.Dopri = function Dopri(x,y,f,ymid,iterations,msg,events) {
    this.x = x;
    this.y = y;
    this.f = f;
    this.ymid = ymid;
    this.iterations = iterations;
    this.events = events;
    this.message = msg;
}
numeric.Dopri.prototype._at = function _at(xi,j) {
    function sqr(x) { return x*x; }
    var sol = this;
    var xs = sol.x;
    var ys = sol.y;
    var k1 = sol.f;
    var ymid = sol.ymid;
    var n = xs.length;
    var x0,x1,xh,y0,y1,yh,xi;
    var floor = Math.floor,h;
    var c = 0.5;
    var add = numeric.add, mul = numeric.mul,sub = numeric.sub, p,q,w;
    x0 = xs[j];
    x1 = xs[j+1];
    y0 = ys[j];
    y1 = ys[j+1];
    h  = x1-x0;
    xh = x0+c*h;
    yh = ymid[j];
    p = sub(k1[j  ],mul(y0,1/(x0-xh)+2/(x0-x1)));
    q = sub(k1[j+1],mul(y1,1/(x1-xh)+2/(x1-x0)));
    w = [sqr(xi - x1) * (xi - xh) / sqr(x0 - x1) / (x0 - xh),
         sqr(xi - x0) * sqr(xi - x1) / sqr(x0 - xh) / sqr(x1 - xh),
         sqr(xi - x0) * (xi - xh) / sqr(x1 - x0) / (x1 - xh),
         (xi - x0) * sqr(xi - x1) * (xi - xh) / sqr(x0-x1) / (x0 - xh),
         (xi - x1) * sqr(xi - x0) * (xi - xh) / sqr(x0-x1) / (x1 - xh)];
    return add(add(add(add(mul(y0,w[0]),
                           mul(yh,w[1])),
                           mul(y1,w[2])),
                           mul( p,w[3])),
                           mul( q,w[4]));
}
numeric.Dopri.prototype.at = function at(x) {
    var i,j,k,floor = Math.floor;
    if(typeof x !== "number") {
        var n = x.length, ret = Array(n);
        for(i=n-1;i!==-1;--i) {
            ret[i] = this.at(x[i]);
        }
        return ret;
    }
    var x0 = this.x;
    i = 0; j = x0.length-1;
    while(j-i>1) {
        k = floor(0.5*(i+j));
        if(x0[k] <= x) i = k;
        else j = k;
    }
    return this._at(x,i);
}

numeric.dopri = function dopri(x0,x1,y0,f,tol,maxit,event) {
    if(typeof tol === "undefined") { tol = 1e-6; }
    if(typeof maxit === "undefined") { maxit = 1000; }
    var xs = [x0], ys = [y0], k1 = [f(x0,y0)], k2,k3,k4,k5,k6,k7, ymid = [];
    var A2 = 1/5;
    var A3 = [3/40,9/40];
    var A4 = [44/45,-56/15,32/9];
    var A5 = [19372/6561,-25360/2187,64448/6561,-212/729];
    var A6 = [9017/3168,-355/33,46732/5247,49/176,-5103/18656];
    var b = [35/384,0,500/1113,125/192,-2187/6784,11/84];
    var bm = [0.5*6025192743/30085553152,
              0,
              0.5*51252292925/65400821598,
              0.5*-2691868925/45128329728,
              0.5*187940372067/1594534317056,
              0.5*-1776094331/19743644256,
              0.5*11237099/235043384];
    var c = [1/5,3/10,4/5,8/9,1,1];
    var e = [-71/57600,0,71/16695,-71/1920,17253/339200,-22/525,1/40];
    var i = 0,er,j;
    var h = (x1-x0)/10;
    var it = 0;
    var add = numeric.add, mul = numeric.mul, y1,erinf;
    var max = Math.max, min = Math.min, abs = Math.abs, norminf = numeric.norminf,pow = Math.pow;
    var any = numeric.any, lt = numeric.lt, and = numeric.and, sub = numeric.sub;
    var e0, e1, ev;
    var ret = new numeric.Dopri(xs,ys,k1,ymid,-1,"");
    if(typeof event === "function") e0 = event(x0,y0);
    while(x0<x1 && it<maxit) {
        ++it;
        if(x0+h>x1) h = x1-x0;
        k2 = f(x0+c[0]*h,                add(y0,mul(   A2*h,k1[i])));
        k3 = f(x0+c[1]*h,            add(add(y0,mul(A3[0]*h,k1[i])),mul(A3[1]*h,k2)));
        k4 = f(x0+c[2]*h,        add(add(add(y0,mul(A4[0]*h,k1[i])),mul(A4[1]*h,k2)),mul(A4[2]*h,k3)));
        k5 = f(x0+c[3]*h,    add(add(add(add(y0,mul(A5[0]*h,k1[i])),mul(A5[1]*h,k2)),mul(A5[2]*h,k3)),mul(A5[3]*h,k4)));
        k6 = f(x0+c[4]*h,add(add(add(add(add(y0,mul(A6[0]*h,k1[i])),mul(A6[1]*h,k2)),mul(A6[2]*h,k3)),mul(A6[3]*h,k4)),mul(A6[4]*h,k5)));
        y1 = add(add(add(add(add(y0,mul(k1[i],h*b[0])),mul(k3,h*b[2])),mul(k4,h*b[3])),mul(k5,h*b[4])),mul(k6,h*b[5]));
        k7 = f(x0+h,y1);
        er = add(add(add(add(add(mul(k1[i],h*e[0]),mul(k3,h*e[2])),mul(k4,h*e[3])),mul(k5,h*e[4])),mul(k6,h*e[5])),mul(k7,h*e[6]));
        if(typeof er === "number") erinf = abs(er);
        else erinf = norminf(er);
        if(erinf > tol) { // reject
            h = 0.2*h*pow(tol/erinf,0.25);
            if(x0+h === x0) {
                ret.msg = "Step size became too small";
                break;
            }
            continue;
        }
        ymid[i] = add(add(add(add(add(add(y0,
                mul(k1[i],h*bm[0])),
                mul(k3   ,h*bm[2])),
                mul(k4   ,h*bm[3])),
                mul(k5   ,h*bm[4])),
                mul(k6   ,h*bm[5])),
                mul(k7   ,h*bm[6]));
        ++i;
        xs[i] = x0+h;
        ys[i] = y1;
        k1[i] = k7;
        if(typeof event === "function") {
            var yi,xl = x0,xr = x0+0.5*h,xi;
            e1 = event(xr,ymid[i-1]);
            ev = and(lt(e0,0),lt(0,e1));
            if(!any(ev)) { xl = xr; xr = x0+h; e0 = e1; e1 = event(xr,y1); ev = and(lt(e0,0),lt(0,e1)); }
            if(any(ev)) {
                var xc, yc, en,ei;
                var side=0, sl = 1.0, sr = 1.0;
                while(1) {
                    if(typeof e0 === "number") xi = (sr*e1*xl-sl*e0*xr)/(sr*e1-sl*e0);
                    else {
                        xi = xr;
                        for(j=e0.length-1;j!==-1;--j) {
                            if(e0[j]<0 && e1[j]>0) xi = min(xi,(sr*e1[j]*xl-sl*e0[j]*xr)/(sr*e1[j]-sl*e0[j]));
                        }
                    }
                    if(xi <= xl || xi >= xr) break;
                    yi = ret._at(xi, i-1);
                    ei = event(xi,yi);
                    en = and(lt(e0,0),lt(0,ei));
                    if(any(en)) {
                        xr = xi;
                        e1 = ei;
                        ev = en;
                        sr = 1.0;
                        if(side === -1) sl *= 0.5;
                        else sl = 1.0;
                        side = -1;
                    } else {
                        xl = xi;
                        e0 = ei;
                        sl = 1.0;
                        if(side === 1) sr *= 0.5;
                        else sr = 1.0;
                        side = 1;
                    }
                }
                y1 = ret._at(0.5*(x0+xi),i-1);
                ret.f[i] = f(xi,yi);
                ret.x[i] = xi;
                ret.y[i] = yi;
                ret.ymid[i-1] = y1;
                ret.events = ev;
                ret.iterations = it;
                return ret;
            }
        }
        x0 += h;
        y0 = y1;
        e0 = e1;
        h = min(0.8*h*pow(tol/erinf,0.25),4*h);
    }
    ret.iterations = it;
    return ret;
}

// 11. Ax = b
numeric.LU = function(A, fast) {
  fast = fast || false;

  var abs = Math.abs;
  var i, j, k, absAjk, Akk, Ak, Pk, Ai;
  var max;
  var n = A.length, n1 = n-1;
  var P = new Array(n);
  if(!fast) A = numeric.clone(A);

  for (k = 0; k < n; ++k) {
    Pk = k;
    Ak = A[k];
    max = abs(Ak[k]);
    for (j = k + 1; j < n; ++j) {
      absAjk = abs(A[j][k]);
      if (max < absAjk) {
        max = absAjk;
        Pk = j;
      }
    }
    P[k] = Pk;

    if (Pk != k) {
      A[k] = A[Pk];
      A[Pk] = Ak;
      Ak = A[k];
    }

    Akk = Ak[k];

    for (i = k + 1; i < n; ++i) {
      A[i][k] /= Akk;
    }

    for (i = k + 1; i < n; ++i) {
      Ai = A[i];
      for (j = k + 1; j < n1; ++j) {
        Ai[j] -= Ai[k] * Ak[j];
        ++j;
        Ai[j] -= Ai[k] * Ak[j];
      }
      if(j===n1) Ai[j] -= Ai[k] * Ak[j];
    }
  }

  return {
    LU: A,
    P:  P
  };
}

numeric.LUsolve = function LUsolve(LUP, b) {
  var i, j;
  var LU = LUP.LU;
  var n   = LU.length;
  var x = numeric.clone(b);
  var P   = LUP.P;
  var Pi, LUi, LUii, tmp;

  for (i=n-1;i!==-1;--i) x[i] = b[i];
  for (i = 0; i < n; ++i) {
    Pi = P[i];
    if (P[i] !== i) {
      tmp = x[i];
      x[i] = x[Pi];
      x[Pi] = tmp;
    }

    LUi = LU[i];
    for (j = 0; j < i; ++j) {
      x[i] -= x[j] * LUi[j];
    }
  }

  for (i = n - 1; i >= 0; --i) {
    LUi = LU[i];
    for (j = i + 1; j < n; ++j) {
      x[i] -= x[j] * LUi[j];
    }

    x[i] /= LUi[i];
  }

  return x;
}

numeric.solve = function solve(A,b,fast) { return numeric.LUsolve(numeric.LU(A,fast), b); }

// 12. Linear programming
numeric.echelonize = function echelonize(A) {
    var s = numeric.dim(A), m = s[0], n = s[1];
    var I = numeric.identity(m);
    var P = Array(m);
    var i,j,k,l,Ai,Ii,Z,a;
    var abs = Math.abs;
    var diveq = numeric.diveq;
    A = numeric.clone(A);
    for(i=0;i<m;++i) {
        k = 0;
        Ai = A[i];
        Ii = I[i];
        for(j=1;j<n;++j) if(abs(Ai[k])<abs(Ai[j])) k=j;
        P[i] = k;
        diveq(Ii,Ai[k]);
        diveq(Ai,Ai[k]);
        for(j=0;j<m;++j) if(j!==i) {
            Z = A[j]; a = Z[k];
            for(l=n-1;l!==-1;--l) Z[l] -= Ai[l]*a;
            Z = I[j];
            for(l=m-1;l!==-1;--l) Z[l] -= Ii[l]*a;
        }
    }
    return {I:I, A:A, P:P};
}

numeric.__solveLP = function __solveLP(c,A,b,tol,maxit,x,flag) {
    var sum = numeric.sum, log = numeric.log, mul = numeric.mul, sub = numeric.sub, dot = numeric.dot, div = numeric.div, add = numeric.add;
    var m = c.length, n = b.length,y;
    var unbounded = false, cb,i0=0;
    var alpha = 1.0;
    var f0,df0,AT = numeric.transpose(A), svd = numeric.svd,transpose = numeric.transpose,leq = numeric.leq, sqrt = Math.sqrt, abs = Math.abs;
    var muleq = numeric.muleq;
    var norm = numeric.norminf, any = numeric.any,min = Math.min;
    var all = numeric.all, gt = numeric.gt;
    var p = Array(m), A0 = Array(n),e=numeric.rep([n],1), H;
    var solve = numeric.solve, z = sub(b,dot(A,x)),count;
    var dotcc = dot(c,c);
    var g;
    for(count=i0;count<maxit;++count) {
        var i,j,d;
        for(i=n-1;i!==-1;--i) A0[i] = div(A[i],z[i]);
        var A1 = transpose(A0);
        for(i=m-1;i!==-1;--i) p[i] = (/*x[i]+*/sum(A1[i]));
        alpha = 0.25*abs(dotcc/dot(c,p));
        var a1 = 100*sqrt(dotcc/dot(p,p));
        if(!isFinite(alpha) || alpha>a1) alpha = a1;
        g = add(c,mul(alpha,p));
        H = dot(A1,A0);
        for(i=m-1;i!==-1;--i) H[i][i] += 1;
        d = solve(H,div(g,alpha),true);
        var t0 = div(z,dot(A,d));
        var t = 1.0;
        for(i=n-1;i!==-1;--i) if(t0[i]<0) t = min(t,-0.999*t0[i]);
        y = sub(x,mul(d,t));
        z = sub(b,dot(A,y));
        if(!all(gt(z,0))) return { solution: x, message: "", iterations: count };
        x = y;
        if(alpha<tol) return { solution: y, message: "", iterations: count };
        if(flag) {
            var s = dot(c,g), Ag = dot(A,g);
            unbounded = true;
            for(i=n-1;i!==-1;--i) if(s*Ag[i]<0) { unbounded = false; break; }
        } else {
            if(x[m-1]>=0) unbounded = false;
            else unbounded = true;
        }
        if(unbounded) return { solution: y, message: "Unbounded", iterations: count };
    }
    return { solution: x, message: "maximum iteration count exceeded", iterations:count };
}

numeric._solveLP = function _solveLP(c,A,b,tol,maxit) {
    var m = c.length, n = b.length,y;
    var sum = numeric.sum, log = numeric.log, mul = numeric.mul, sub = numeric.sub, dot = numeric.dot, div = numeric.div, add = numeric.add;
    var c0 = numeric.rep([m],0).concat([1]);
    var J = numeric.rep([n,1],-1);
    var A0 = numeric.blockMatrix([[A                   ,   J  ]]);
    var b0 = b;
    var y = numeric.rep([m],0).concat(Math.max(0,numeric.sup(numeric.neg(b)))+1);
    var x0 = numeric.__solveLP(c0,A0,b0,tol,maxit,y,false);
    var x = numeric.clone(x0.solution);
    x.length = m;
    var foo = numeric.inf(sub(b,dot(A,x)));
    if(foo<0) { return { solution: NaN, message: "Infeasible", iterations: x0.iterations }; }
    var ret = numeric.__solveLP(c, A, b, tol, maxit-x0.iterations, x, true);
    ret.iterations += x0.iterations;
    return ret;
};

numeric.solveLP = function solveLP(c,A,b,Aeq,beq,tol,maxit) {
    if(typeof maxit === "undefined") maxit = 1000;
    if(typeof tol === "undefined") tol = numeric.epsilon;
    if(typeof Aeq === "undefined") return numeric._solveLP(c,A,b,tol,maxit);
    var m = Aeq.length, n = Aeq[0].length, o = A.length;
    var B = numeric.echelonize(Aeq);
    var flags = numeric.rep([n],0);
    var P = B.P;
    var Q = [];
    var i;
    for(i=P.length-1;i!==-1;--i) flags[P[i]] = 1;
    for(i=n-1;i!==-1;--i) if(flags[i]===0) Q.push(i);
    var g = numeric.getRange;
    var I = numeric.linspace(0,m-1), J = numeric.linspace(0,o-1);
    var Aeq2 = g(Aeq,I,Q), A1 = g(A,J,P), A2 = g(A,J,Q), dot = numeric.dot, sub = numeric.sub;
    var A3 = dot(A1,B.I);
    var A4 = sub(A2,dot(A3,Aeq2)), b4 = sub(b,dot(A3,beq));
    var c1 = Array(P.length), c2 = Array(Q.length);
    for(i=P.length-1;i!==-1;--i) c1[i] = c[P[i]];
    for(i=Q.length-1;i!==-1;--i) c2[i] = c[Q[i]];
    var c4 = sub(c2,dot(c1,dot(B.I,Aeq2)));
    var S = numeric._solveLP(c4,A4,b4,tol,maxit);
    var x2 = S.solution;
    if(x2!==x2) return S;
    var x1 = dot(B.I,sub(beq,dot(Aeq2,x2)));
    var x = Array(c.length);
    for(i=P.length-1;i!==-1;--i) x[P[i]] = x1[i];
    for(i=Q.length-1;i!==-1;--i) x[Q[i]] = x2[i];
    return { solution: x, message:S.message, iterations: S.iterations };
}

numeric.MPStoLP = function MPStoLP(MPS) {
    if(MPS instanceof String) { MPS.split('\n'); }
    var state = 0;
    var states = ['Initial state','NAME','ROWS','COLUMNS','RHS','BOUNDS','ENDATA'];
    var n = MPS.length;
    var i,j,z,N=0,rows = {}, sign = [], rl = 0, vars = {}, nv = 0;
    var name;
    var c = [], A = [], b = [];
    function err(e) { throw new Error('MPStoLP: '+e+'\nLine '+i+': '+MPS[i]+'\nCurrent state: '+states[state]+'\n'); }
    for(i=0;i<n;++i) {
        z = MPS[i];
        var w0 = z.match(/\S*/g);
        var w = [];
        for(j=0;j<w0.length;++j) if(w0[j]!=="") w.push(w0[j]);
        if(w.length === 0) continue;
        for(j=0;j<states.length;++j) if(z.substr(0,states[j].length) === states[j]) break;
        if(j<states.length) {
            state = j;
            if(j===1) { name = w[1]; }
            if(j===6) return { name:name, c:c, A:numeric.transpose(A), b:b, rows:rows, vars:vars };
            continue;
        }
        switch(state) {
        case 0: case 1: err('Unexpected line');
        case 2: 
            switch(w[0]) {
            case 'N': if(N===0) N = w[1]; else err('Two or more N rows'); break;
            case 'L': rows[w[1]] = rl; sign[rl] = 1; b[rl] = 0; ++rl; break;
            case 'G': rows[w[1]] = rl; sign[rl] = -1;b[rl] = 0; ++rl; break;
            case 'E': rows[w[1]] = rl; sign[rl] = 0;b[rl] = 0; ++rl; break;
            default: err('Parse error '+numeric.prettyPrint(w));
            }
            break;
        case 3:
            if(!vars.hasOwnProperty(w[0])) { vars[w[0]] = nv; c[nv] = 0; A[nv] = numeric.rep([rl],0); ++nv; }
            var p = vars[w[0]];
            for(j=1;j<w.length;j+=2) {
                if(w[j] === N) { c[p] = parseFloat(w[j+1]); continue; }
                var q = rows[w[j]];
                A[p][q] = (sign[q]<0?-1:1)*parseFloat(w[j+1]);
            }
            break;
        case 4:
            for(j=1;j<w.length;j+=2) b[rows[w[j]]] = (sign[rows[w[j]]]<0?-1:1)*parseFloat(w[j+1]);
            break;
        case 5: /*FIXME*/ break;
        case 6: err('Internal error');
        }
    }
    err('Reached end of file without ENDATA');
}
// seedrandom.js version 2.0.
// Author: David Bau 4/2/2011
//
// Defines a method Math.seedrandom() that, when called, substitutes
// an explicitly seeded RC4-based algorithm for Math.random().  Also
// supports automatic seeding from local or network sources of entropy.
//
// Usage:
//
//   <script src=http://davidbau.com/encode/seedrandom-min.js></script>
//
//   Math.seedrandom('yipee'); Sets Math.random to a function that is
//                             initialized using the given explicit seed.
//
//   Math.seedrandom();        Sets Math.random to a function that is
//                             seeded using the current time, dom state,
//                             and other accumulated local entropy.
//                             The generated seed string is returned.
//
//   Math.seedrandom('yowza', true);
//                             Seeds using the given explicit seed mixed
//                             together with accumulated entropy.
//
//   <script src="http://bit.ly/srandom-512"></script>
//                             Seeds using physical random bits downloaded
//                             from random.org.
//
//   <script src="https://jsonlib.appspot.com/urandom?callback=Math.seedrandom">
//   </script>                 Seeds using urandom bits from call.jsonlib.com,
//                             which is faster than random.org.
//
// Examples:
//
//   Math.seedrandom("hello");            // Use "hello" as the seed.
//   document.write(Math.random());       // Always 0.5463663768140734
//   document.write(Math.random());       // Always 0.43973793770592234
//   var rng1 = Math.random;              // Remember the current prng.
//
//   var autoseed = Math.seedrandom();    // New prng with an automatic seed.
//   document.write(Math.random());       // Pretty much unpredictable.
//
//   Math.random = rng1;                  // Continue "hello" prng sequence.
//   document.write(Math.random());       // Always 0.554769432473455
//
//   Math.seedrandom(autoseed);           // Restart at the previous seed.
//   document.write(Math.random());       // Repeat the 'unpredictable' value.
//
// Notes:
//
// Each time seedrandom('arg') is called, entropy from the passed seed
// is accumulated in a pool to help generate future seeds for the
// zero-argument form of Math.seedrandom, so entropy can be injected over
// time by calling seedrandom with explicit data repeatedly.
//
// On speed - This javascript implementation of Math.random() is about
// 3-10x slower than the built-in Math.random() because it is not native
// code, but this is typically fast enough anyway.  Seeding is more expensive,
// especially if you use auto-seeding.  Some details (timings on Chrome 4):
//
// Our Math.random()            - avg less than 0.002 milliseconds per call
// seedrandom('explicit')       - avg less than 0.5 milliseconds per call
// seedrandom('explicit', true) - avg less than 2 milliseconds per call
// seedrandom()                 - avg about 38 milliseconds per call
//
// LICENSE (BSD):
//
// Copyright 2010 David Bau, all rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
// 
//   1. Redistributions of source code must retain the above copyright
//      notice, this list of conditions and the following disclaimer.
//
//   2. Redistributions in binary form must reproduce the above copyright
//      notice, this list of conditions and the following disclaimer in the
//      documentation and/or other materials provided with the distribution.
// 
//   3. Neither the name of this module nor the names of its contributors may
//      be used to endorse or promote products derived from this software
//      without specific prior written permission.
// 
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
/**
 * All code is in an anonymous closure to keep the global namespace clean.
 *
 * @param {number=} overflow 
 * @param {number=} startdenom
 */

// Patched by Seb so that seedrandom.js does not pollute the Math object.
// My tests suggest that doing Math.trouble = 1 makes Math lookups about 5%
// slower.
numeric.seedrandom = { pow:Math.pow, random:Math.random };

(function (pool, math, width, chunks, significance, overflow, startdenom) {


//
// seedrandom()
// This is the seedrandom function described above.
//
math['seedrandom'] = function seedrandom(seed, use_entropy) {
  var key = [];
  var arc4;

  // Flatten the seed string or build one from local entropy if needed.
  seed = mixkey(flatten(
    use_entropy ? [seed, pool] :
    arguments.length ? seed :
    [new Date().getTime(), pool, window], 3), key);

  // Use the seed to initialize an ARC4 generator.
  arc4 = new ARC4(key);

  // Mix the randomness into accumulated entropy.
  mixkey(arc4.S, pool);

  // Override Math.random

  // This function returns a random double in [0, 1) that contains
  // randomness in every bit of the mantissa of the IEEE 754 value.

  math['random'] = function random() {  // Closure to return a random double:
    var n = arc4.g(chunks);             // Start with a numerator n < 2 ^ 48
    var d = startdenom;                 //   and denominator d = 2 ^ 48.
    var x = 0;                          //   and no 'extra last byte'.
    while (n < significance) {          // Fill up all significant digits by
      n = (n + x) * width;              //   shifting numerator and
      d *= width;                       //   denominator and generating a
      x = arc4.g(1);                    //   new least-significant-byte.
    }
    while (n >= overflow) {             // To avoid rounding up, before adding
      n /= 2;                           //   last byte, shift everything
      d /= 2;                           //   right using integer math until
      x >>>= 1;                         //   we have exactly the desired bits.
    }
    return (n + x) / d;                 // Form the number within [0, 1).
  };

  // Return the seed that was used
  return seed;
};

//
// ARC4
//
// An ARC4 implementation.  The constructor takes a key in the form of
// an array of at most (width) integers that should be 0 <= x < (width).
//
// The g(count) method returns a pseudorandom integer that concatenates
// the next (count) outputs from ARC4.  Its return value is a number x
// that is in the range 0 <= x < (width ^ count).
//
/** @constructor */
function ARC4(key) {
  var t, u, me = this, keylen = key.length;
  var i = 0, j = me.i = me.j = me.m = 0;
  me.S = [];
  me.c = [];

  // The empty key [] is treated as [0].
  if (!keylen) { key = [keylen++]; }

  // Set up S using the standard key scheduling algorithm.
  while (i < width) { me.S[i] = i++; }
  for (i = 0; i < width; i++) {
    t = me.S[i];
    j = lowbits(j + t + key[i % keylen]);
    u = me.S[j];
    me.S[i] = u;
    me.S[j] = t;
  }

  // The "g" method returns the next (count) outputs as one number.
  me.g = function getnext(count) {
    var s = me.S;
    var i = lowbits(me.i + 1); var t = s[i];
    var j = lowbits(me.j + t); var u = s[j];
    s[i] = u;
    s[j] = t;
    var r = s[lowbits(t + u)];
    while (--count) {
      i = lowbits(i + 1); t = s[i];
      j = lowbits(j + t); u = s[j];
      s[i] = u;
      s[j] = t;
      r = r * width + s[lowbits(t + u)];
    }
    me.i = i;
    me.j = j;
    return r;
  };
  // For robust unpredictability discard an initial batch of values.
  // See http://www.rsa.com/rsalabs/node.asp?id=2009
  me.g(width);
}

//
// flatten()
// Converts an object tree to nested arrays of strings.
//
/** @param {Object=} result 
  * @param {string=} prop
  * @param {string=} typ */
function flatten(obj, depth, result, prop, typ) {
  result = [];
  typ = typeof(obj);
  if (depth && typ == 'object') {
    for (prop in obj) {
      if (prop.indexOf('S') < 5) {    // Avoid FF3 bug (local/sessionStorage)
        try { result.push(flatten(obj[prop], depth - 1)); } catch (e) {}
      }
    }
  }
  return (result.length ? result : obj + (typ != 'string' ? '\0' : ''));
}

//
// mixkey()
// Mixes a string seed into a key that is an array of integers, and
// returns a shortened string seed that is equivalent to the result key.
//
/** @param {number=} smear 
  * @param {number=} j */
function mixkey(seed, key, smear, j) {
  seed += '';                         // Ensure the seed is a string
  smear = 0;
  for (j = 0; j < seed.length; j++) {
    key[lowbits(j)] =
      lowbits((smear ^= key[lowbits(j)] * 19) + seed.charCodeAt(j));
  }
  seed = '';
  for (j in key) { seed += String.fromCharCode(key[j]); }
  return seed;
}

//
// lowbits()
// A quick "n mod width" for width a power of 2.
//
function lowbits(n) { return n & (width - 1); }

//
// The following constants are related to IEEE 754 limits.
//
startdenom = math.pow(width, chunks);
significance = math.pow(2, significance);
overflow = significance * 2;

//
// When seedrandom.js is loaded, we immediately mix a few bits
// from the built-in RNG into the entropy pool.  Because we do
// not want to intefere with determinstic PRNG state later,
// seedrandom will not call math.random on its own again after
// initialization.
//
mixkey(math.random(), pool);

// End anonymous scope, and pass initial values.
}(
  [],   // pool: entropy pool starts empty
  numeric.seedrandom, // math: package containing random, pow, and seedrandom
  256,  // width: each RC4 output is 0 <= x < 256
  6,    // chunks: at least six RC4 outputs for each double
  52    // significance: there are 52 significant digits in a double
  ));
/* This file is a slightly modified version of quadprog.js from Alberto Santini.
 * It has been slightly modified by Sébastien Loisel to make sure that it handles
 * 0-based Arrays instead of 1-based Arrays.
 * License is in resources/LICENSE.quadprog */
(function(exports) {

function base0to1(A) {
    if(typeof A !== "object") { return A; }
    var ret = [], i,n=A.length;
    for(i=0;i<n;i++) ret[i+1] = base0to1(A[i]);
    return ret;
}
function base1to0(A) {
    if(typeof A !== "object") { return A; }
    var ret = [], i,n=A.length;
    for(i=1;i<n;i++) ret[i-1] = base1to0(A[i]);
    return ret;
}

function dpori(a, lda, n) {
    var i, j, k, kp1, t;

    for (k = 1; k <= n; k = k + 1) {
        a[k][k] = 1 / a[k][k];
        t = -a[k][k];
        //~ dscal(k - 1, t, a[1][k], 1);
        for (i = 1; i < k; i = i + 1) {
            a[i][k] = t * a[i][k];
        }

        kp1 = k + 1;
        if (n < kp1) {
            break;
        }
        for (j = kp1; j <= n; j = j + 1) {
            t = a[k][j];
            a[k][j] = 0;
            //~ daxpy(k, t, a[1][k], 1, a[1][j], 1);
            for (i = 1; i <= k; i = i + 1) {
                a[i][j] = a[i][j] + (t * a[i][k]);
            }
        }
    }

}

function dposl(a, lda, n, b) {
    var i, k, kb, t;

    for (k = 1; k <= n; k = k + 1) {
        //~ t = ddot(k - 1, a[1][k], 1, b[1], 1);
        t = 0;
        for (i = 1; i < k; i = i + 1) {
            t = t + (a[i][k] * b[i]);
        }

        b[k] = (b[k] - t) / a[k][k];
    }

    for (kb = 1; kb <= n; kb = kb + 1) {
        k = n + 1 - kb;
        b[k] = b[k] / a[k][k];
        t = -b[k];
        //~ daxpy(k - 1, t, a[1][k], 1, b[1], 1);
        for (i = 1; i < k; i = i + 1) {
            b[i] = b[i] + (t * a[i][k]);
        }
    }
}

function dpofa(a, lda, n, info) {
    var i, j, jm1, k, t, s;

    for (j = 1; j <= n; j = j + 1) {
        info[1] = j;
        s = 0;
        jm1 = j - 1;
        if (jm1 < 1) {
            s = a[j][j] - s;
            if (s <= 0) {
                break;
            }
            a[j][j] = Math.sqrt(s);
        } else {
            for (k = 1; k <= jm1; k = k + 1) {
                //~ t = a[k][j] - ddot(k - 1, a[1][k], 1, a[1][j], 1);
                t = a[k][j];
                for (i = 1; i < k; i = i + 1) {
                    t = t - (a[i][j] * a[i][k]);
                }
                t = t / a[k][k];
                a[k][j] = t;
                s = s + t * t;
            }
            s = a[j][j] - s;
            if (s <= 0) {
                break;
            }
            a[j][j] = Math.sqrt(s);
        }
        info[1] = 0;
    }
}

function qpgen2(dmat, dvec, fddmat, n, sol, crval, amat,
    bvec, fdamat, q, meq, iact, nact, iter, work, ierr) {

    var i, j, l, l1, info, it1, iwzv, iwrv, iwrm, iwsv, iwuv, nvl, r, iwnbv,
        temp, sum, t1, tt, gc, gs, nu,
        t1inf, t2min,
        vsmall, tmpa, tmpb,
        go;

    r = Math.min(n, q);
    l = 2 * n + (r * (r + 5)) / 2 + 2 * q + 1;

    vsmall = 1.0e-60;
    do {
        vsmall = vsmall + vsmall;
        tmpa = 1 + 0.1 * vsmall;
        tmpb = 1 + 0.2 * vsmall;
    } while (tmpa <= 1 || tmpb <= 1);

    for (i = 1; i <= n; i = i + 1) {
        work[i] = dvec[i];
    }
    for (i = n + 1; i <= l; i = i + 1) {
        work[i] = 0;
    }
    for (i = 1; i <= q; i = i + 1) {
        iact[i] = 0;
    }

    info = [];

    if (ierr[1] === 0) {
        dpofa(dmat, fddmat, n, info);
        if (info[1] !== 0) {
            ierr[1] = 2;
            return;
        }
        dposl(dmat, fddmat, n, dvec);
        dpori(dmat, fddmat, n);
    } else {
        for (j = 1; j <= n; j = j + 1) {
            sol[j] = 0;
            for (i = 1; i <= j; i = i + 1) {
                sol[j] = sol[j] + dmat[i][j] * dvec[i];
            }
        }
        for (j = 1; j <= n; j = j + 1) {
            dvec[j] = 0;
            for (i = j; i <= n; i = i + 1) {
                dvec[j] = dvec[j] + dmat[j][i] * sol[i];
            }
        }
    }

    crval[1] = 0;
    for (j = 1; j <= n; j = j + 1) {
        sol[j] = dvec[j];
        crval[1] = crval[1] + work[j] * sol[j];
        work[j] = 0;
        for (i = j + 1; i <= n; i = i + 1) {
            dmat[i][j] = 0;
        }
    }
    crval[1] = -crval[1] / 2;
    ierr[1] = 0;

    iwzv = n;
    iwrv = iwzv + n;
    iwuv = iwrv + r;
    iwrm = iwuv + r + 1;
    iwsv = iwrm + (r * (r + 1)) / 2;
    iwnbv = iwsv + q;

    for (i = 1; i <= q; i = i + 1) {
        sum = 0;
        for (j = 1; j <= n; j = j + 1) {
            sum = sum + amat[j][i] * amat[j][i];
        }
        work[iwnbv + i] = Math.sqrt(sum);
    }
    nact = 0;
    iter[1] = 0;
    iter[2] = 0;

    function fn_goto_50() {
        iter[1] = iter[1] + 1;

        l = iwsv;
        for (i = 1; i <= q; i = i + 1) {
            l = l + 1;
            sum = -bvec[i];
            for (j = 1; j <= n; j = j + 1) {
                sum = sum + amat[j][i] * sol[j];
            }
            if (Math.abs(sum) < vsmall) {
                sum = 0;
            }
            if (i > meq) {
                work[l] = sum;
            } else {
                work[l] = -Math.abs(sum);
                if (sum > 0) {
                    for (j = 1; j <= n; j = j + 1) {
                        amat[j][i] = -amat[j][i];
                    }
                    bvec[i] = -bvec[i];
                }
            }
        }

        for (i = 1; i <= nact; i = i + 1) {
            work[iwsv + iact[i]] = 0;
        }

        nvl = 0;
        temp = 0;
        for (i = 1; i <= q; i = i + 1) {
            if (work[iwsv + i] < temp * work[iwnbv + i]) {
                nvl = i;
                temp = work[iwsv + i] / work[iwnbv + i];
            }
        }
        if (nvl === 0) {
            return 999;
        }

        return 0;
    }

    function fn_goto_55() {
        for (i = 1; i <= n; i = i + 1) {
            sum = 0;
            for (j = 1; j <= n; j = j + 1) {
                sum = sum + dmat[j][i] * amat[j][nvl];
            }
            work[i] = sum;
        }

        l1 = iwzv;
        for (i = 1; i <= n; i = i + 1) {
            work[l1 + i] = 0;
        }
        for (j = nact + 1; j <= n; j = j + 1) {
            for (i = 1; i <= n; i = i + 1) {
                work[l1 + i] = work[l1 + i] + dmat[i][j] * work[j];
            }
        }

        t1inf = true;
        for (i = nact; i >= 1; i = i - 1) {
            sum = work[i];
            l = iwrm + (i * (i + 3)) / 2;
            l1 = l - i;
            for (j = i + 1; j <= nact; j = j + 1) {
                sum = sum - work[l] * work[iwrv + j];
                l = l + j;
            }
            sum = sum / work[l1];
            work[iwrv + i] = sum;
            if (iact[i] < meq) {
                // continue;
                break;
            }
            if (sum < 0) {
                // continue;
                break;
            }
            t1inf = false;
            it1 = i;
        }

        if (!t1inf) {
            t1 = work[iwuv + it1] / work[iwrv + it1];
            for (i = 1; i <= nact; i = i + 1) {
                if (iact[i] < meq) {
                    // continue;
                    break;
                }
                if (work[iwrv + i] < 0) {
                    // continue;
                    break;
                }
                temp = work[iwuv + i] / work[iwrv + i];
                if (temp < t1) {
                    t1 = temp;
                    it1 = i;
                }
            }
        }

        sum = 0;
        for (i = iwzv + 1; i <= iwzv + n; i = i + 1) {
            sum = sum + work[i] * work[i];
        }
        if (Math.abs(sum) <= vsmall) {
            if (t1inf) {
                ierr[1] = 1;
                // GOTO 999
                return 999;
            } else {
                for (i = 1; i <= nact; i = i + 1) {
                    work[iwuv + i] = work[iwuv + i] - t1 * work[iwrv + i];
                }
                work[iwuv + nact + 1] = work[iwuv + nact + 1] + t1;
                // GOTO 700
                return 700;
            }
        } else {
            sum = 0;
            for (i = 1; i <= n; i = i + 1) {
                sum = sum + work[iwzv + i] * amat[i][nvl];
            }
            tt = -work[iwsv + nvl] / sum;
            t2min = true;
            if (!t1inf) {
                if (t1 < tt) {
                    tt = t1;
                    t2min = false;
                }
            }

            for (i = 1; i <= n; i = i + 1) {
                sol[i] = sol[i] + tt * work[iwzv + i];
                if (Math.abs(sol[i]) < vsmall) {
                    sol[i] = 0;
                }
            }

            crval[1] = crval[1] + tt * sum * (tt / 2 + work[iwuv + nact + 1]);
            for (i = 1; i <= nact; i = i + 1) {
                work[iwuv + i] = work[iwuv + i] - tt * work[iwrv + i];
            }
            work[iwuv + nact + 1] = work[iwuv + nact + 1] + tt;

            if (t2min) {
                nact = nact + 1;
                iact[nact] = nvl;

                l = iwrm + ((nact - 1) * nact) / 2 + 1;
                for (i = 1; i <= nact - 1; i = i + 1) {
                    work[l] = work[i];
                    l = l + 1;
                }

                if (nact === n) {
                    work[l] = work[n];
                } else {
                    for (i = n; i >= nact + 1; i = i - 1) {
                        if (work[i] === 0) {
                            // continue;
                            break;
                        }
                        gc = Math.max(Math.abs(work[i - 1]), Math.abs(work[i]));
                        gs = Math.min(Math.abs(work[i - 1]), Math.abs(work[i]));
                        if (work[i - 1] >= 0) {
                            temp = Math.abs(gc * Math.sqrt(1 + gs * gs / (gc * gc)));
                        } else {
                            temp = -Math.abs(gc * Math.sqrt(1 + gs * gs / (gc * gc)));
                        }
                        gc = work[i - 1] / temp;
                        gs = work[i] / temp;

                        if (gc === 1) {
                            // continue;
                            break;
                        }
                        if (gc === 0) {
                            work[i - 1] = gs * temp;
                            for (j = 1; j <= n; j = j + 1) {
                                temp = dmat[j][i - 1];
                                dmat[j][i - 1] = dmat[j][i];
                                dmat[j][i] = temp;
                            }
                        } else {
                            work[i - 1] = temp;
                            nu = gs / (1 + gc);
                            for (j = 1; j <= n; j = j + 1) {
                                temp = gc * dmat[j][i - 1] + gs * dmat[j][i];
                                dmat[j][i] = nu * (dmat[j][i - 1] + temp) - dmat[j][i];
                                dmat[j][i - 1] = temp;

                            }
                        }
                    }
                    work[l] = work[nact];
                }
            } else {
                sum = -bvec[nvl];
                for (j = 1; j <= n; j = j + 1) {
                    sum = sum + sol[j] * amat[j][nvl];
                }
                if (nvl > meq) {
                    work[iwsv + nvl] = sum;
                } else {
                    work[iwsv + nvl] = -Math.abs(sum);
                    if (sum > 0) {
                        for (j = 1; j <= n; j = j + 1) {
                            amat[j][nvl] = -amat[j][nvl];
                        }
                        bvec[nvl] = -bvec[nvl];
                    }
                }
                // GOTO 700
                return 700;
            }
        }

        return 0;
    }

    function fn_goto_797() {
        l = iwrm + (it1 * (it1 + 1)) / 2 + 1;
        l1 = l + it1;
        if (work[l1] === 0) {
            // GOTO 798
            return 798;
        }
        gc = Math.max(Math.abs(work[l1 - 1]), Math.abs(work[l1]));
        gs = Math.min(Math.abs(work[l1 - 1]), Math.abs(work[l1]));
        if (work[l1 - 1] >= 0) {
            temp = Math.abs(gc * Math.sqrt(1 + gs * gs / (gc * gc)));
        } else {
            temp = -Math.abs(gc * Math.sqrt(1 + gs * gs / (gc * gc)));
        }
        gc = work[l1 - 1] / temp;
        gs = work[l1] / temp;

        if (gc === 1) {
            // GOTO 798
            return 798;
        }
        if (gc === 0) {
            for (i = it1 + 1; i <= nact; i = i + 1) {
                temp = work[l1 - 1];
                work[l1 - 1] = work[l1];
                work[l1] = temp;
                l1 = l1 + i;
            }
            for (i = 1; i <= n; i = i + 1) {
                temp = dmat[i][it1];
                dmat[i][it1] = dmat[i][it1 + 1];
                dmat[i][it1 + 1] = temp;
            }
        } else {
            nu = gs / (1 + gc);
            for (i = it1 + 1; i <= nact; i = i + 1) {
                temp = gc * work[l1 - 1] + gs * work[l1];
                work[l1] = nu * (work[l1 - 1] + temp) - work[l1];
                work[l1 - 1] = temp;
                l1 = l1 + i;
            }
            for (i = 1; i <= n; i = i + 1) {
                temp = gc * dmat[i][it1] + gs * dmat[i][it1 + 1];
                dmat[i][it1 + 1] = nu * (dmat[i][it1] + temp) - dmat[i][it1 + 1];
                dmat[i][it1] = temp;
            }
        }

        return 0;
    }

    function fn_goto_798() {
        l1 = l - it1;
        for (i = 1; i <= it1; i = i + 1) {
            work[l1] = work[l];
            l = l + 1;
            l1 = l1 + 1;
        }

        work[iwuv + it1] = work[iwuv + it1 + 1];
        iact[it1] = iact[it1 + 1];
        it1 = it1 + 1;
        if (it1 < nact) {
            // GOTO 797
            return 797;
        }

        return 0;
    }

    function fn_goto_799() {
        work[iwuv + nact] = work[iwuv + nact + 1];
        work[iwuv + nact + 1] = 0;
        iact[nact] = 0;
        nact = nact - 1;
        iter[2] = iter[2] + 1;

        return 0;
    }

    go = 0;
    while (true) {
        go = fn_goto_50();
        if (go === 999) {
            return;
        }
        while (true) {
            go = fn_goto_55();
            if (go === 0) {
                break;
            }
            if (go === 999) {
                return;
            }
            if (go === 700) {
                if (it1 === nact) {
                    fn_goto_799();
                } else {
                    while (true) {
                        fn_goto_797();
                        go = fn_goto_798();
                        if (go !== 797) {
                            break;
                        }
                    }
                    fn_goto_799();
                }
            }
        }
    }

}

function solveQP(Dmat, dvec, Amat, bvec, meq, factorized) {
    Dmat = base0to1(Dmat);
    dvec = base0to1(dvec);
    Amat = base0to1(Amat);
    var i, n, q,
        nact, r,
        crval = [], iact = [], sol = [], work = [], iter = [],
        message;

    meq = meq || 0;
    factorized = factorized ? base0to1(factorized) : [undefined, 0];
    bvec = bvec ? base0to1(bvec) : [];

    // In Fortran the array index starts from 1
    n = Dmat.length - 1;
    q = Amat[1].length - 1;

    if (!bvec) {
        for (i = 1; i <= q; i = i + 1) {
            bvec[i] = 0;
        }
    }
    for (i = 1; i <= q; i = i + 1) {
        iact[i] = 0;
    }
    nact = 0;
    r = Math.min(n, q);
    for (i = 1; i <= n; i = i + 1) {
        sol[i] = 0;
    }
    crval[1] = 0;
    for (i = 1; i <= (2 * n + (r * (r + 5)) / 2 + 2 * q + 1); i = i + 1) {
        work[i] = 0;
    }
    for (i = 1; i <= 2; i = i + 1) {
        iter[i] = 0;
    }

    qpgen2(Dmat, dvec, n, n, sol, crval, Amat,
        bvec, n, q, meq, iact, nact, iter, work, factorized);

    message = "";
    if (factorized[1] === 1) {
        message = "constraints are inconsistent, no solution!";
    }
    if (factorized[1] === 2) {
        message = "matrix D in quadratic function is not positive definite!";
    }

    return {
        solution: base1to0(sol),
        value: base1to0(crval),
        unconstrained_solution: base1to0(dvec),
        iterations: base1to0(iter),
        iact: base1to0(iact),
        message: message
    };
}
exports.solveQP = solveQP;
}(numeric));
/*
Shanti Rao sent me this routine by private email. I had to modify it
slightly to work on Arrays instead of using a Matrix object.
It is apparently translated from http://stitchpanorama.sourceforge.net/Python/svd.py
*/

numeric.svd= function svd(A) {
    var temp;
//Compute the thin SVD from G. H. Golub and C. Reinsch, Numer. Math. 14, 403-420 (1970)
	var prec= numeric.epsilon; //Math.pow(2,-52) // assumes double prec
	var tolerance= 1.e-64/prec;
	var itmax= 50;
	var c=0;
	var i=0;
	var j=0;
	var k=0;
	var l=0;
	
	var u= numeric.clone(A);
	var m= u.length;
	
	var n= u[0].length;
	
	if (m < n) throw "Need more rows than columns"
	
	var e = new Array(n);
	var q = new Array(n);
	for (i=0; i<n; i++) e[i] = q[i] = 0.0;
	var v = numeric.rep([n,n],0);
//	v.zero();
	
 	function pythag(a,b)
 	{
		a = Math.abs(a)
		b = Math.abs(b)
		if (a > b)
			return a*Math.sqrt(1.0+(b*b/a/a))
		else if (b == 0.0) 
			return a
		return b*Math.sqrt(1.0+(a*a/b/b))
	}

	//Householder's reduction to bidiagonal form

	var f= 0.0;
	var g= 0.0;
	var h= 0.0;
	var x= 0.0;
	var y= 0.0;
	var z= 0.0;
	var s= 0.0;
	
	for (i=0; i < n; i++)
	{	
		e[i]= g;
		s= 0.0;
		l= i+1;
		for (j=i; j < m; j++) 
			s += (u[j][i]*u[j][i]);
		if (s <= tolerance)
			g= 0.0;
		else
		{	
			f= u[i][i];
			g= Math.sqrt(s);
			if (f >= 0.0) g= -g;
			h= f*g-s
			u[i][i]=f-g;
			for (j=l; j < n; j++)
			{
				s= 0.0
				for (k=i; k < m; k++) 
					s += u[k][i]*u[k][j]
				f= s/h
				for (k=i; k < m; k++) 
					u[k][j]+=f*u[k][i]
			}
		}
		q[i]= g
		s= 0.0
		for (j=l; j < n; j++) 
			s= s + u[i][j]*u[i][j]
		if (s <= tolerance)
			g= 0.0
		else
		{	
			f= u[i][i+1]
			g= Math.sqrt(s)
			if (f >= 0.0) g= -g
			h= f*g - s
			u[i][i+1] = f-g;
			for (j=l; j < n; j++) e[j]= u[i][j]/h
			for (j=l; j < m; j++)
			{	
				s=0.0
				for (k=l; k < n; k++) 
					s += (u[j][k]*u[i][k])
				for (k=l; k < n; k++) 
					u[j][k]+=s*e[k]
			}	
		}
		y= Math.abs(q[i])+Math.abs(e[i])
		if (y>x) 
			x=y
	}
	
	// accumulation of right hand gtransformations
	for (i=n-1; i != -1; i+= -1)
	{	
		if (g != 0.0)
		{
		 	h= g*u[i][i+1]
			for (j=l; j < n; j++) 
				v[j][i]=u[i][j]/h
			for (j=l; j < n; j++)
			{	
				s=0.0
				for (k=l; k < n; k++) 
					s += u[i][k]*v[k][j]
				for (k=l; k < n; k++) 
					v[k][j]+=(s*v[k][i])
			}	
		}
		for (j=l; j < n; j++)
		{
			v[i][j] = 0;
			v[j][i] = 0;
		}
		v[i][i] = 1;
		g= e[i]
		l= i
	}
	
	// accumulation of left hand transformations
	for (i=n-1; i != -1; i+= -1)
	{	
		l= i+1
		g= q[i]
		for (j=l; j < n; j++) 
			u[i][j] = 0;
		if (g != 0.0)
		{
			h= u[i][i]*g
			for (j=l; j < n; j++)
			{
				s=0.0
				for (k=l; k < m; k++) s += u[k][i]*u[k][j];
				f= s/h
				for (k=i; k < m; k++) u[k][j]+=f*u[k][i];
			}
			for (j=i; j < m; j++) u[j][i] = u[j][i]/g;
		}
		else
			for (j=i; j < m; j++) u[j][i] = 0;
		u[i][i] += 1;
	}
	
	// diagonalization of the bidiagonal form
	prec= prec*x
	for (k=n-1; k != -1; k+= -1)
	{
		for (var iteration=0; iteration < itmax; iteration++)
		{	// test f splitting
			var test_convergence = false
			for (l=k; l != -1; l+= -1)
			{	
				if (Math.abs(e[l]) <= prec)
				{	test_convergence= true
					break 
				}
				if (Math.abs(q[l-1]) <= prec)
					break 
			}
			if (!test_convergence)
			{	// cancellation of e[l] if l>0
				c= 0.0
				s= 1.0
				var l1= l-1
				for (i =l; i<k+1; i++)
				{	
					f= s*e[i]
					e[i]= c*e[i]
					if (Math.abs(f) <= prec)
						break
					g= q[i]
					h= pythag(f,g)
					q[i]= h
					c= g/h
					s= -f/h
					for (j=0; j < m; j++)
					{	
						y= u[j][l1]
						z= u[j][i]
						u[j][l1] =  y*c+(z*s)
						u[j][i] = -y*s+(z*c)
					} 
				}	
			}
			// test f convergence
			z= q[k]
			if (l== k)
			{	//convergence
				if (z<0.0)
				{	//q[k] is made non-negative
					q[k]= -z
					for (j=0; j < n; j++)
						v[j][k] = -v[j][k]
				}
				break  //break out of iteration loop and move on to next k value
			}
			if (iteration >= itmax-1)
				throw 'Error: no convergence.'
			// shift from bottom 2x2 minor
			x= q[l]
			y= q[k-1]
			g= e[k-1]
			h= e[k]
			f= ((y-z)*(y+z)+(g-h)*(g+h))/(2.0*h*y)
			g= pythag(f,1.0)
			if (f < 0.0)
				f= ((x-z)*(x+z)+h*(y/(f-g)-h))/x
			else
				f= ((x-z)*(x+z)+h*(y/(f+g)-h))/x
			// next QR transformation
			c= 1.0
			s= 1.0
			for (i=l+1; i< k+1; i++)
			{	
				g= e[i]
				y= q[i]
				h= s*g
				g= c*g
				z= pythag(f,h)
				e[i-1]= z
				c= f/z
				s= h/z
				f= x*c+g*s
				g= -x*s+g*c
				h= y*s
				y= y*c
				for (j=0; j < n; j++)
				{	
					x= v[j][i-1]
					z= v[j][i]
					v[j][i-1] = x*c+z*s
					v[j][i] = -x*s+z*c
				}
				z= pythag(f,h)
				q[i-1]= z
				c= f/z
				s= h/z
				f= c*g+s*y
				x= -s*g+c*y
				for (j=0; j < m; j++)
				{
					y= u[j][i-1]
					z= u[j][i]
					u[j][i-1] = y*c+z*s
					u[j][i] = -y*s+z*c
				}
			}
			e[l]= 0.0
			e[k]= f
			q[k]= x
		} 
	}
		
	//vt= transpose(v)
	//return (u,q,vt)
	for (i=0;i<q.length; i++) 
	  if (q[i] < prec) q[i] = 0
	  
	//sort eigenvalues	
	for (i=0; i< n; i++)
	{	 
	//writeln(q)
	 for (j=i-1; j >= 0; j--)
	 {
	  if (q[j] < q[i])
	  {
	//  writeln(i,'-',j)
	   c = q[j]
	   q[j] = q[i]
	   q[i] = c
	   for(k=0;k<u.length;k++) { temp = u[k][i]; u[k][i] = u[k][j]; u[k][j] = temp; }
	   for(k=0;k<v.length;k++) { temp = v[k][i]; v[k][i] = v[k][j]; v[k][j] = temp; }
//	   u.swapCols(i,j)
//	   v.swapCols(i,j)
	   i = j	   
	  }
	 }	
	}
	
	return {U:u,S:q,V:v}
};


})(window)
},{}],13:[function(require,module,exports){
"use strict"

function Storage(max_points, dimension) {
  this.coordinates = new Array(dimension)
  this.points = new Array(dimension)
  for(var i=0; i<dimension; ++i) {
    this.coordinates[i] = new Int32Array(max_points<<dimension)
    this.points[i] = new Float64Array(max_points<<dimension)
  }
  this.indices = new Int32Array(max_points<<dimension)
}

Storage.prototype.resize = function(max_points) {
  var dimension = this.coordinates.length
  for(var i=0; i<dimension; ++i) {
    this.coordinates[i] = new Int32Array(max_points<<dimension)
    this.points[i] = new Float64Array(max_points<<dimension)
  }
  this.indices = new Int32Array(max_points<<dimension)
}

Storage.prototype.size = function() {
  return this.indices >> this.coordinates.length
}

Storage.prototype.move = function(p, q) {
  var coords = this.coordinates
    , points = this.points
    , indices = this.indices
    , dimension = coords.length
    , a, b, k
  for(k=0; k<dimension; ++k) {
    a = coords[k]
    a[p] = a[q]
    b = points[k]
    b[p] = b[q]
  }
  indices[p] = indices[q]
}

Storage.prototype.load = function(scratch, i) {
  var coords = this.coordinates
    , points = this.points
  for(var k=0, d=coords.length; k<d; ++k) {
    scratch[k] = coords[k][i]|0
    scratch[k+d+1] = +points[k][i]
  }
  scratch[d] = this.indices[i]|0
}

Storage.prototype.store = function(i, scratch) {
  var coords = this.coordinates
    , points = this.points
  for(var k=0, d=coords.length; k<d; ++k) {
    coords[k][i] = scratch[k]
    points[k][i] = scratch[k+d+1]
  }
  this.indices[i] = scratch[d]
}

Storage.prototype.swap = function(i, j) {
  var coords = this.coordinates
  var points = this.points
  var ind = this.indices
  var t, a, b
  for(var k=0, d=coords.length; k<d; ++k) {
    a = coords[k]
    t = a[i]
    a[i] = a[j]
    a[j] = t
    b = points[k]
    t = b[i]
    b[i] = b[j]
    b[j] = t
  }
  t = ind[i]
  ind[i] = ind[j]
  ind[j] = t
}

Storage.prototype.compare = function(i,j) {
  var coords = this.coordinates
  for(var k=0, d=coords.length; k<d; ++k) {
    var a = coords[k]
      , s = a[i] - a[j]
    if(s) { return s }
  }
  return this.indices[i] - this.indices[j]
}

Storage.prototype.compareNoId = function(i,j) {
  var coords = this.coordinates
  for(var k=0, d=coords.length-1; k<d; ++k) {
    var a = coords[k]
      , s = a[i] - a[j]
    if(s) { return s }
  }
  return coords[d][i] - coords[d][j]
}

Storage.prototype.compareS = function(i, scratch) {
  var coords = this.coordinates
  for(var k=0, d=coords.length; k<d; ++k) {
    var s = coords[k][i] - scratch[k]
    if(s) { return s }
  }
  return this.indices[i] - scratch[d]
}

/*
  Modified from this: http://stackoverflow.com/questions/8082425/fastest-way-to-sort-32bit-signed-integer-arrays-in-javascript
 */
Storage.prototype.sort = function(n) {
  var coords = this.coordinates
  var points = this.points
  var indices = this.indices
  var dimension = coords.length|0
  var stack = []
  var sp = -1
  var left = 0
  var right = n - 1
  var i, j, k, d, swap = new Array(2*dimension+1), a, b, p, q, t
  for(i=0; i<dimension; ++i) {
    swap[i] = 0|0
  }
  swap[dimension] = 0|0
  for(i=0; i<dimension; ++i) {
    swap[dimension+1+i] = +0.0
  }
  while(true) {
    if(right - left <= 25){
      for(j=left+1; j<=right; j++) {
        for(k=0; k<dimension; ++k) {
          swap[k] = coords[k][j]|0
          swap[k+dimension+1] = +points[k][j]
        }
        swap[dimension] = indices[j]|0
        i = j-1;        
lo_loop:
        while(i >= left) {
          for(k=0; k<dimension; ++k) {
            d = coords[k][i] - swap[k]
            if(d < 0) {
              break lo_loop
            } if(d > 0) {
              break
            }
          }
          p = i+1
          q = i--
          for(k=0; k<dimension; ++k) {
            a = coords[k]
            a[p] = a[q]
            b = points[k]
            b[p] = b[q]
          }
          indices[p] = indices[q]
        }
        this.store(i+1, swap)
      }
      if(sp == -1)    break;
      right = stack[sp--];
      left = stack[sp--];
    } else {
      var median = (left + right) >> 1;
      i = left + 1;
      j = right;
      
      this.swap(median, i)
      if(this.compare(left, right) > 0) {
        this.swap(left, right)
      } if(this.compare(i, right) > 0) {
        this.swap(i, right)
      } if(this.compare(left, i) > 0) {
        this.swap(left, i)
      }
      
      this.load(swap, i)
      while(true){
ii_loop:
        while(true) {
          ++i
          for(k=0; k<dimension; ++k) {
            d = coords[k][i] - swap[k]
            if(d > 0) {
              break ii_loop
            } if(d < 0) {
              continue ii_loop
            }
          }
          if(indices[i] >= swap[dimension]) {
            break
          }
        }
jj_loop:
        while(true) {
          --j
          for(k=0; k<dimension; ++k) {
            d = coords[k][j] - swap[k]
            if(d < 0) {
              break jj_loop
            } if(d > 0) {
              continue jj_loop
            }
          }
          if(indices[j] <= swap[dimension]) {
            break
          }
        }
        if(j < i)    break;
        for(k=0; k<dimension; ++k) {
          a = coords[k]
          t = a[i]
          a[i] = a[j]
          a[j] = t
          b = points[k]
          t = b[i]
          b[i] = b[j]
          b[j] = t
        }
        t = indices[i]
        indices[i] = indices[j]
        indices[j] = t
      }
      this.move(left+1, j)
      this.store(j, swap)
      if(right - i + 1 >= j - left){
        stack[++sp] = i;
        stack[++sp] = right;
        right = j - 1;
      }else{
        stack[++sp] = left;
        stack[++sp] = j - 1;
        left = i;
      }
    }
  }
}

Storage.prototype.hashPoints = function(points, bucketSize, radius) {
  var floor = Math.floor
    , coords = this.coordinates
    , spoints = this.points
    , indices = this.indices
    , count = points.length|0
    , dimension = coords.length|0
    , dbits = (1<<dimension)|0
    , ptr = 0
  for(var i=0; i<count; ++i) {
    var t = ptr
      , p = points[i]
      , cross = 0
    for(var j=0; j<dimension; ++j) {
      var ix = floor(p[j]/bucketSize)
      coords[j][ptr] = ix
      spoints[j][ptr] = p[j]
      if(bucketSize*(ix+1) <= p[j]+2*radius) {
        cross += (1<<j)
      }
    }
    indices[ptr++] = i
    cross = ~cross
    for(var j=1; j<dbits; ++j) {
      if(j & cross) {
        continue
      }
      for(var k=0; k<dimension; ++k) {
        var c = coords[k]
        c[ptr] = c[t]+((j>>>k)&1)
        spoints[k][ptr] = p[k]
      }
      indices[ptr++] = i
    }
  }
  return ptr
}

Storage.prototype.computePairs = function(cellCount, bucketSize, radius, cb) {
  var floor = Math.floor
    , coords = this.coordinates
    , points = this.points
    , indices = this.indices
    , dimension = coords.length|0
    , ptr = 0
    , r2 = 4 * radius * radius
    , i, j, k, l
    , a, b, pa, pb, d, d2, ac, bc
  for(i=0; i<cellCount;) {
    for(j=i+1; j<cellCount; ++j) {
      if(this.compareNoId(i, j) !== 0) {
        break
      }
      a = indices[j]
k_loop:
      for(k=i; k<j; ++k) {
        b = indices[k]
        d2 = 0.0
        for(l=0; l<dimension; ++l) {
          ac = points[l][j]
          bc = points[l][k]
          if(ac > bc) {
            if(coords[l][i] !== floor(ac/bucketSize)) {
              continue k_loop
            }
          } else if(coords[l][i] !== floor(bc/bucketSize)) {
            continue k_loop
          }
          d = ac - bc
          d2 += d * d
          if(d2 > r2) {
            continue k_loop
          }
        }
        if(cb(a, b, d2)) {
          return
        }
      }
    }
    i = j
  }
}

function createNBodyDataStructure(dimension, num_points) {
  dimension = (dimension|0) || 2
  var grid = new Storage(num_points||1024, dimension)
  
  function findPairs(points, radius, cb) {
    var count = points.length|0
    var cellCount = count<<dimension
    if(grid.size() < cellCount) {
      grid.resize(count)
    }
    var bucketSize = 4*radius
    var nc = grid.hashPoints(points, bucketSize, radius)
    grid.sort(nc)
    grid.computePairs(nc, bucketSize, radius, cb)
  }
  
  Object.defineProperty(findPairs, "capacity", {
    get: function() {
      return grid.size()
    },
    set: function(n_capacity) {
      grid.resize(n_points)
      return grid.size()
    }
  })
  
  return findPairs
}

module.exports = createNBodyDataStructure

},{}],15:[function(require,module,exports){
"use strict"

function unique_pred(list, compare) {
  var ptr = 1
    , len = list.length
    , a=list[0], b=list[0]
  for(var i=1; i<len; ++i) {
    b = a
    a = list[i]
    if(compare(a, b)) {
      if(i === ptr) {
        ptr++
        continue
      }
      list[ptr++] = a
    }
  }
  list.length = ptr
  return list
}

function unique_eq(list) {
  var ptr = 1
    , len = list.length
    , a=list[0], b = list[0]
  for(var i=1; i<len; ++i, b=a) {
    b = a
    a = list[i]
    if(a !== b) {
      if(i === ptr) {
        ptr++
        continue
      }
      list[ptr++] = a
    }
  }
  list.length = ptr
  return list
}

function unique(list, compare) {
  if(list.length === 0) {
    return []
  }
  if(compare) {
    return unique_pred(list, compare)
  }
  return unique_eq(list)
}

module.exports = unique
},{}],16:[function(require,module,exports){
'use strict';
GLOBAL.javascript = {};
GLOBAL.javascript.util = require('javascript.util');
var jsts = require('./lib/jsts');
module.exports = jsts

},{"./lib/jsts":17,"javascript.util":18}],17:[function(require,module,exports){
/* The JSTS Topology Suite is a collection of JavaScript classes that
implement the fundamental operations required to validate a given
geo-spatial data set to a known topological specification.

Copyright (C) 2011 The Authors

This library is free software; you can redistribute it and/or
modify it under the terms of the GNU Lesser General Public
License as published by the Free Software Foundation; either
version 2.1 of the License, or (at your option) any later version.

This library is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public
License along with this library; if not, write to the Free Software
Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA */
jsts={version:'0.13.2',algorithm:{distance:{},locate:{}},error:{},geom:{util:{}},geomgraph:{index:{}},index:{bintree:{},chain:{},kdtree:{},quadtree:{},strtree:{}},io:{},noding:{snapround:{}},operation:{buffer:{},distance:{},overlay:{snap:{}},polygonize:{},relate:{},union:{},valid:{}},planargraph:{},simplify:{},triangulate:{quadedge:{}},util:{}};if(typeof String.prototype.trim!=='function'){String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g,'');};}
jsts.abstractFunc=function(){throw new jsts.error.AbstractMethodInvocationError();};jsts.error={};jsts.error.IllegalArgumentError=function(message){this.name='IllegalArgumentError';this.message=message;};jsts.error.IllegalArgumentError.prototype=new Error();jsts.error.TopologyError=function(message,pt){this.name='TopologyError';this.message=pt?message+' [ '+pt+' ]':message;};jsts.error.TopologyError.prototype=new Error();jsts.error.AbstractMethodInvocationError=function(){this.name='AbstractMethodInvocationError';this.message='Abstract method called, should be implemented in subclass.';};jsts.error.AbstractMethodInvocationError.prototype=new Error();jsts.error.NotImplementedError=function(){this.name='NotImplementedError';this.message='This method has not yet been implemented.';};jsts.error.NotImplementedError.prototype=new Error();jsts.error.NotRepresentableError=function(message){this.name='NotRepresentableError';this.message=message;};jsts.error.NotRepresentableError.prototype=new Error();jsts.error.LocateFailureError=function(message){this.name='LocateFailureError';this.message=message;};jsts.error.LocateFailureError.prototype=new Error();if(typeof module!=="undefined")module.exports=jsts;jsts.geom.GeometryFilter=function(){};jsts.geom.GeometryFilter.prototype.filter=function(geom){throw new jsts.error.AbstractMethodInvocationError();};jsts.geom.util.PolygonExtracter=function(comps){this.comps=comps;};jsts.geom.util.PolygonExtracter.prototype=new jsts.geom.GeometryFilter();jsts.geom.util.PolygonExtracter.prototype.comps=null;jsts.geom.util.PolygonExtracter.getPolygons=function(geom,list){if(list===undefined){list=[];}
if(geom instanceof jsts.geom.Polygon){list.push(geom);}else if(geom instanceof jsts.geom.GeometryCollection){geom.apply(new jsts.geom.util.PolygonExtracter(list));}
return list;};jsts.geom.util.PolygonExtracter.prototype.filter=function(geom){if(geom instanceof jsts.geom.Polygon)
this.comps.push(geom);};jsts.io.WKTParser=function(geometryFactory){this.geometryFactory=geometryFactory||new jsts.geom.GeometryFactory();this.regExes={'typeStr':/^\s*(\w+)\s*\(\s*(.*)\s*\)\s*$/,'emptyTypeStr':/^\s*(\w+)\s*EMPTY\s*$/,'spaces':/\s+/,'parenComma':/\)\s*,\s*\(/,'doubleParenComma':/\)\s*\)\s*,\s*\(\s*\(/,'trimParens':/^\s*\(?(.*?)\)?\s*$/};};jsts.io.WKTParser.prototype.read=function(wkt){var geometry,type,str;wkt=wkt.replace(/[\n\r]/g,' ');var matches=this.regExes.typeStr.exec(wkt);if(wkt.search('EMPTY')!==-1){matches=this.regExes.emptyTypeStr.exec(wkt);matches[2]=undefined;}
if(matches){type=matches[1].toLowerCase();str=matches[2];if(this.parse[type]){geometry=this.parse[type].apply(this,[str]);}}
if(geometry===undefined)
throw new Error('Could not parse WKT '+wkt);return geometry;};jsts.io.WKTParser.prototype.write=function(geometry){return this.extractGeometry(geometry);};jsts.io.WKTParser.prototype.extractGeometry=function(geometry){var type=geometry.CLASS_NAME.split('.')[2].toLowerCase();if(!this.extract[type]){return null;}
var wktType=type.toUpperCase();var data;if(geometry.isEmpty()){data=wktType+' EMPTY';}else{data=wktType+'('+this.extract[type].apply(this,[geometry])+')';}
return data;};jsts.io.WKTParser.prototype.extract={'coordinate':function(coordinate){return coordinate.x+' '+coordinate.y;},'point':function(point){return point.coordinate.x+' '+point.coordinate.y;},'multipoint':function(multipoint){var array=[];for(var i=0,len=multipoint.geometries.length;i<len;++i){array.push('('+
this.extract.point.apply(this,[multipoint.geometries[i]])+')');}
return array.join(',');},'linestring':function(linestring){var array=[];for(var i=0,len=linestring.points.length;i<len;++i){array.push(this.extract.coordinate.apply(this,[linestring.points[i]]));}
return array.join(',');},'multilinestring':function(multilinestring){var array=[];for(var i=0,len=multilinestring.geometries.length;i<len;++i){array.push('('+
this.extract.linestring.apply(this,[multilinestring.geometries[i]])+')');}
return array.join(',');},'polygon':function(polygon){var array=[];array.push('('+this.extract.linestring.apply(this,[polygon.shell])+')');for(var i=0,len=polygon.holes.length;i<len;++i){array.push('('+this.extract.linestring.apply(this,[polygon.holes[i]])+')');}
return array.join(',');},'multipolygon':function(multipolygon){var array=[];for(var i=0,len=multipolygon.geometries.length;i<len;++i){array.push('('+this.extract.polygon.apply(this,[multipolygon.geometries[i]])+')');}
return array.join(',');},'geometrycollection':function(collection){var array=[];for(var i=0,len=collection.geometries.length;i<len;++i){array.push(this.extractGeometry.apply(this,[collection.geometries[i]]));}
return array.join(',');}};jsts.io.WKTParser.prototype.parse={'point':function(str){if(str===undefined){return this.geometryFactory.createPoint(null);}
var coords=str.trim().split(this.regExes.spaces);return this.geometryFactory.createPoint(new jsts.geom.Coordinate(coords[0],coords[1]));},'multipoint':function(str){if(str===undefined){return this.geometryFactory.createMultiPoint(null);}
var point;var points=str.trim().split(',');var components=[];for(var i=0,len=points.length;i<len;++i){point=points[i].replace(this.regExes.trimParens,'$1');components.push(this.parse.point.apply(this,[point]));}
return this.geometryFactory.createMultiPoint(components);},'linestring':function(str){if(str===undefined){return this.geometryFactory.createLineString(null);}
var points=str.trim().split(',');var components=[];var coords;for(var i=0,len=points.length;i<len;++i){coords=points[i].trim().split(this.regExes.spaces);components.push(new jsts.geom.Coordinate(coords[0],coords[1]));}
return this.geometryFactory.createLineString(components);},'linearring':function(str){if(str===undefined){return this.geometryFactory.createLinearRing(null);}
var points=str.trim().split(',');var components=[];var coords;for(var i=0,len=points.length;i<len;++i){coords=points[i].trim().split(this.regExes.spaces);components.push(new jsts.geom.Coordinate(coords[0],coords[1]));}
return this.geometryFactory.createLinearRing(components);},'multilinestring':function(str){if(str===undefined){return this.geometryFactory.createMultiLineString(null);}
var line;var lines=str.trim().split(this.regExes.parenComma);var components=[];for(var i=0,len=lines.length;i<len;++i){line=lines[i].replace(this.regExes.trimParens,'$1');components.push(this.parse.linestring.apply(this,[line]));}
return this.geometryFactory.createMultiLineString(components);},'polygon':function(str){if(str===undefined){return this.geometryFactory.createPolygon(null);}
var ring,linestring,linearring;var rings=str.trim().split(this.regExes.parenComma);var shell;var holes=[];for(var i=0,len=rings.length;i<len;++i){ring=rings[i].replace(this.regExes.trimParens,'$1');linestring=this.parse.linestring.apply(this,[ring]);linearring=this.geometryFactory.createLinearRing(linestring.points);if(i===0){shell=linearring;}else{holes.push(linearring);}}
return this.geometryFactory.createPolygon(shell,holes);},'multipolygon':function(str){if(str===undefined){return this.geometryFactory.createMultiPolygon(null);}
var polygon;var polygons=str.trim().split(this.regExes.doubleParenComma);var components=[];for(var i=0,len=polygons.length;i<len;++i){polygon=polygons[i].replace(this.regExes.trimParens,'$1');components.push(this.parse.polygon.apply(this,[polygon]));}
return this.geometryFactory.createMultiPolygon(components);},'geometrycollection':function(str){if(str===undefined){return this.geometryFactory.createGeometryCollection(null);}
str=str.replace(/,\s*([A-Za-z])/g,'|$1');var wktArray=str.trim().split('|');var components=[];for(var i=0,len=wktArray.length;i<len;++i){components.push(jsts.io.WKTParser.prototype.read.apply(this,[wktArray[i]]));}
return this.geometryFactory.createGeometryCollection(components);}};jsts.algorithm.HCoordinate=function(){this.x=0.0;this.y=0.0;this.w=1.0;if(arguments.length===1){this.initFrom1Coordinate(arguments[0]);}else if(arguments.length===2&&arguments[0]instanceof jsts.geom.Coordinate){this.initFrom2Coordinates(arguments[0],arguments[1]);}else if(arguments.length===2&&arguments[0]instanceof jsts.algorithm.HCoordinate){this.initFrom2HCoordinates(arguments[0],arguments[1]);}else if(arguments.length===2){this.initFromXY(arguments[0],arguments[1]);}else if(arguments.length===3){this.initFromXYW(arguments[0],arguments[1],arguments[2]);}else if(arguments.length===4){this.initFromXYW(arguments[0],arguments[1],arguments[2],arguments[3]);}};jsts.algorithm.HCoordinate.intersection=function(p1,p2,q1,q2){var px,py,pw,qx,qy,qw,x,y,w,xInt,yInt;px=p1.y-p2.y;py=p2.x-p1.x;pw=p1.x*p2.y-p2.x*p1.y;qx=q1.y-q2.y;qy=q2.x-q1.x;qw=q1.x*q2.y-q2.x*q1.y;x=py*qw-qy*pw;y=qx*pw-px*qw;w=px*qy-qx*py;xInt=x/w;yInt=y/w;if(!isFinite(xInt)||!isFinite(yInt)){throw new jsts.error.NotRepresentableError();}
return new jsts.geom.Coordinate(xInt,yInt);};jsts.algorithm.HCoordinate.prototype.initFrom1Coordinate=function(p){this.x=p.x;this.y=p.y;this.w=1.0;};jsts.algorithm.HCoordinate.prototype.initFrom2Coordinates=function(p1,p2){this.x=p1.y-p2.y;this.y=p2.x-p1.x;this.w=p1.x*p2.y-p2.x*p1.y;};jsts.algorithm.HCoordinate.prototype.initFrom2HCoordinates=function(p1,p2){this.x=p1.y*p2.w-p2.y*p1.w;this.y=p2.x*p1.w-p1.x*p2.w;this.w=p1.x*p2.y-p2.x*p1.y;};jsts.algorithm.HCoordinate.prototype.initFromXYW=function(x,y,w){this.x=x;this.y=y;this.w=w;};jsts.algorithm.HCoordinate.prototype.initFromXY=function(x,y){this.x=x;this.y=y;this.w=1.0;};jsts.algorithm.HCoordinate.prototype.initFrom4Coordinates=function(p1,p2,q1,q2){var px,py,pw,qx,qy,qw;px=p1.y-p2.y;py=p2.x-p1.x;pw=p1.x*p2.y-p2.x*p1.y;qx=q1.y-q2.y;qy=q2.x-q1.x;qw=q1.x*q2.y-q2.x*q1.y;this.x=py*qw-qy*pw;this.y=qx*pw-px*qw;this.w=px*qy-qx*py;};jsts.algorithm.HCoordinate.prototype.getX=function(){var a=this.x/this.w;if(!isFinite(a)){throw new jsts.error.NotRepresentableError();}
return a;};jsts.algorithm.HCoordinate.prototype.getY=function(){var a=this.y/this.w;if(!isFinite(a)){throw new jsts.error.NotRepresentableError();}
return a;};jsts.algorithm.HCoordinate.prototype.getCoordinate=function(){var p=new jsts.geom.Coordinate();p.x=this.getX();p.y=this.getY();return p;};jsts.algorithm.CGAlgorithms=function(){};jsts.algorithm.CGAlgorithms.CLOCKWISE=-1;jsts.algorithm.CGAlgorithms.RIGHT=jsts.algorithm.CGAlgorithms.CLOCKWISE;jsts.algorithm.CGAlgorithms.COUNTERCLOCKWISE=1;jsts.algorithm.CGAlgorithms.LEFT=jsts.algorithm.CGAlgorithms.COUNTERCLOCKWISE;jsts.algorithm.CGAlgorithms.COLLINEAR=0;jsts.algorithm.CGAlgorithms.STRAIGHT=jsts.algorithm.CGAlgorithms.COLLINEAR;jsts.algorithm.CGAlgorithms.orientationIndex=function(p1,p2,q){var dx1,dy1,dx2,dy2;dx1=p2.x-p1.x;dy1=p2.y-p1.y;dx2=q.x-p2.x;dy2=q.y-p2.y;return jsts.algorithm.RobustDeterminant.signOfDet2x2(dx1,dy1,dx2,dy2);};jsts.algorithm.CGAlgorithms.isPointInRing=function(p,ring){return jsts.algorithm.CGAlgorithms.locatePointInRing(p,ring)!==jsts.geom.Location.EXTERIOR;};jsts.algorithm.CGAlgorithms.locatePointInRing=function(p,ring){return jsts.algorithm.RayCrossingCounter.locatePointInRing(p,ring);};jsts.algorithm.CGAlgorithms.isOnLine=function(p,pt){var lineIntersector,i,il,p0,p1;lineIntersector=new jsts.algorithm.RobustLineIntersector();for(i=1,il=pt.length;i<il;i++){p0=pt[i-1];p1=pt[i];lineIntersector.computeIntersection(p,p0,p1);if(lineIntersector.hasIntersection()){return true;}}
return false;};jsts.algorithm.CGAlgorithms.isCCW=function(ring){var nPts,hiPt,hiIndex,p,iPrev,iNext,prev,next,i,disc,isCCW;nPts=ring.length-1;if(nPts<3){throw new jsts.IllegalArgumentError('Ring has fewer than 3 points, so orientation cannot be determined');}
hiPt=ring[0];hiIndex=0;i=1;for(i;i<=nPts;i++){p=ring[i];if(p.y>hiPt.y){hiPt=p;hiIndex=i;}}
iPrev=hiIndex;do{iPrev=iPrev-1;if(iPrev<0){iPrev=nPts;}}while(ring[iPrev].equals2D(hiPt)&&iPrev!==hiIndex);iNext=hiIndex;do{iNext=(iNext+1)%nPts;}while(ring[iNext].equals2D(hiPt)&&iNext!==hiIndex);prev=ring[iPrev];next=ring[iNext];if(prev.equals2D(hiPt)||next.equals2D(hiPt)||prev.equals2D(next)){return false;}
disc=jsts.algorithm.CGAlgorithms.computeOrientation(prev,hiPt,next);isCCW=false;if(disc===0){isCCW=(prev.x>next.x);}else{isCCW=(disc>0);}
return isCCW;};jsts.algorithm.CGAlgorithms.computeOrientation=function(p1,p2,q){return jsts.algorithm.CGAlgorithms.orientationIndex(p1,p2,q);};jsts.algorithm.CGAlgorithms.distancePointLine=function(p,A,B){if(!(A instanceof jsts.geom.Coordinate)){jsts.algorithm.CGAlgorithms.distancePointLine2.apply(this,arguments);}
if(A.x===B.x&&A.y===B.y){return p.distance(A);}
var r,s;r=((p.x-A.x)*(B.x-A.x)+(p.y-A.y)*(B.y-A.y))/((B.x-A.x)*(B.x-A.x)+(B.y-A.y)*(B.y-A.y));if(r<=0.0){return p.distance(A);}
if(r>=1.0){return p.distance(B);}
s=((A.y-p.y)*(B.x-A.x)-(A.x-p.x)*(B.y-A.y))/((B.x-A.x)*(B.x-A.x)+(B.y-A.y)*(B.y-A.y));return Math.abs(s)*Math.sqrt(((B.x-A.x)*(B.x-A.x)+(B.y-A.y)*(B.y-A.y)));};jsts.algorithm.CGAlgorithms.distancePointLinePerpendicular=function(p,A,B){var s=((A.y-p.y)*(B.x-A.x)-(A.x-p.x)*(B.y-A.y))/((B.x-A.x)*(B.x-A.x)+(B.y-A.y)*(B.y-A.y));return Math.abs(s)*Math.sqrt(((B.x-A.x)*(B.x-A.x)+(B.y-A.y)*(B.y-A.y)));};jsts.algorithm.CGAlgorithms.distancePointLine2=function(p,line){var minDistance,i,il,dist;if(line.length===0){throw new jsts.error.IllegalArgumentError('Line array must contain at least one vertex');}
minDistance=p.distance(line[0]);for(i=0,il=line.length-1;i<il;i++){dist=jsts.algorithm.CGAlgorithms.distancePointLine(p,line[i],line[i+1]);if(dist<minDistance){minDistance=dist;}}
return minDistance;};jsts.algorithm.CGAlgorithms.distanceLineLine=function(A,B,C,D){if(A.equals(B)){return jsts.algorithm.CGAlgorithms.distancePointLine(A,C,D);}
if(C.equals(D)){return jsts.algorithm.CGAlgorithms.distancePointLine(D,A,B);}
var r_top,r_bot,s_top,s_bot,s,r;r_top=(A.y-C.y)*(D.x-C.x)-(A.x-C.x)*(D.y-C.y);r_bot=(B.x-A.x)*(D.y-C.y)-(B.y-A.y)*(D.x-C.x);s_top=(A.y-C.y)*(B.x-A.x)-(A.x-C.x)*(B.y-A.y);s_bot=(B.x-A.x)*(D.y-C.y)-(B.y-A.y)*(D.x-C.x);if((r_bot===0)||(s_bot===0)){return Math.min(jsts.algorithm.CGAlgorithms.distancePointLine(A,C,D),Math.min(jsts.algorithm.CGAlgorithms.distancePointLine(B,C,D),Math.min(jsts.algorithm.CGAlgorithms.distancePointLine(C,A,B),jsts.algorithm.CGAlgorithms.distancePointLine(D,A,B))));}
s=s_top/s_bot;r=r_top/r_bot;if((r<0)||(r>1)||(s<0)||(s>1)){return Math.min(jsts.algorithm.CGAlgorithms.distancePointLine(A,C,D),Math.min(jsts.algorithm.CGAlgorithms.distancePointLine(B,C,D),Math.min(jsts.algorithm.CGAlgorithms.distancePointLine(C,A,B),jsts.algorithm.CGAlgorithms.distancePointLine(D,A,B))));}
return 0.0;};jsts.algorithm.CGAlgorithms.signedArea=function(ring){if(ring.length<3){return 0.0;}
var sum,i,il,bx,by,cx,cy;sum=0.0;for(i=0,il=ring.length-1;i<il;i++){bx=ring[i].x;by=ring[i].y;cx=ring[i+1].x;cy=ring[i+1].y;sum+=(bx+cx)*(cy-by);}
return-sum/2.0;};jsts.algorithm.CGAlgorithms.signedArea=function(ring){var n,sum,p,bx,by,i,cx,cy;n=ring.length;if(n<3){return 0.0;}
sum=0.0;p=ring[0];bx=p.x;by=p.y;for(i=1;i<n;i++){p=ring[i];cx=p.x;cy=p.y;sum+=(bx+cx)*(cy-by);bx=cx;by=cy;}
return-sum/2.0;};jsts.algorithm.CGAlgorithms.computeLength=function(pts){var n=pts.length,len,x0,y0,x1,y1,dx,dy,p,i,il;if(n<=1){return 0.0;}
len=0.0;p=pts[0];x0=p.x;y0=p.y;i=1,il=n;for(i;i<n;i++){p=pts[i];x1=p.x;y1=p.y;dx=x1-x0;dy=y1-y0;len+=Math.sqrt(dx*dx+dy*dy);x0=x1;y0=y1;}
return len;};jsts.algorithm.CGAlgorithms.length=function(){};jsts.algorithm.Angle=function(){};jsts.algorithm.Angle.PI_TIMES_2=2.0*Math.PI;jsts.algorithm.Angle.PI_OVER_2=Math.PI/2.0;jsts.algorithm.Angle.PI_OVER_4=Math.PI/4.0;jsts.algorithm.Angle.COUNTERCLOCKWISE=jsts.algorithm.CGAlgorithms.prototype.COUNTERCLOCKWISE;jsts.algorithm.Angle.CLOCKWISE=jsts.algorithm.CGAlgorithms.prototype.CLOCKWISE;jsts.algorithm.Angle.NONE=jsts.algorithm.CGAlgorithms.prototype.COLLINEAR;jsts.algorithm.Angle.toDegrees=function(radians){return(radians*180)/Math.PI;};jsts.algorithm.Angle.toRadians=function(angleDegrees){return(angleDegrees*Math.PI)/180.0;};jsts.algorithm.Angle.angle=function(){if(arguments.length===1){return jsts.algorithm.Angle.angleFromOrigo(arguments[0]);}else{return jsts.algorithm.Angle.angleBetweenCoords(arguments[0],arguments[1]);}};jsts.algorithm.Angle.angleBetweenCoords=function(p0,p1){var dx,dy;dx=p1.x-p0.x;dy=p1.y-p0.y;return Math.atan2(dy,dx);};jsts.algorithm.Angle.angleFromOrigo=function(p){return Math.atan2(p.y,p.x);};jsts.algorithm.Angle.isAcute=function(p0,p1,p2){var dx0,dy0,dx1,dy1,dotprod;dx0=p0.x-p1.x;dy0=p0.y-p1.y;dx1=p2.x-p1.x;dy1=p2.y-p1.y;dotprod=dx0*dx1+dy0*dy1;return dotprod>0;};jsts.algorithm.Angle.isObtuse=function(p0,p1,p2){var dx0,dy0,dx1,dy1,dotprod;dx0=p0.x-p1.x;dy0=p0.y-p1.y;dx1=p2.x-p1.x;dy1=p2.y-p1.y;dotprod=dx0*dx1+dy0*dy1;return dotprod<0;};jsts.algorithm.Angle.angleBetween=function(tip1,tail,tip2){var a1,a2;a1=jsts.algorithm.Angle.angle(tail,tip1);a2=jsts.algorithm.Angle.angle(tail,tip2);return jsts.algorithm.Angle.diff(a1,a2);};jsts.algorithm.Angle.angleBetweenOriented=function(tip1,tail,tip2){var a1,a2,angDel;a1=jsts.algorithm.Angle.angle(tail,tip1);a2=jsts.algorithm.Angle.angle(tail,tip2);angDel=a2-a1;if(angDel<=-Math.PI){return angDel+jsts.algorithm.Angle.PI_TIMES_2;}
if(angDel>Math.PI){return angDel-jsts.algorithm.Angle.PI_TIMES_2;}
return angDel;};jsts.algorithm.Angle.interiorAngle=function(p0,p1,p2){var anglePrev,angleNext;anglePrev=jsts.algorithm.Angle.angle(p1,p0);angleNext=jsts.algorithm.Angle.angle(p1,p2);return Math.abs(angleNext-anglePrev);};jsts.algorithm.Angle.getTurn=function(ang1,ang2){var crossproduct=Math.sin(ang2-ang1);if(crossproduct>0){return jsts.algorithm.Angle.COUNTERCLOCKWISE;}
if(crossproduct<0){return jsts.algorithm.Angle.CLOCKWISE;}
return jsts.algorithm.Angle.NONE;};jsts.algorithm.Angle.normalize=function(angle){while(angle>Math.PI){angle-=jsts.algorithm.Angle.PI_TIMES_2;}
while(angle<=-Math.PI){angle+=jsts.algorithm.Angle.PI_TIMES_2;}
return angle;};jsts.algorithm.Angle.normalizePositive=function(angle){if(angle<0.0){while(angle<0.0){angle+=jsts.algorithm.Angle.PI_TIMES_2;}
if(angle>=jsts.algorithm.Angle.PI_TIMES_2){angle=0.0;}}
else{while(angle>=jsts.algorithm.Angle.PI_TIMES_2){angle-=jsts.algorithm.Angle.PI_TIMES_2;}
if(angle<0.0){angle=0.0;}}
return angle;};jsts.algorithm.Angle.diff=function(ang1,ang2){var delAngle;if(ang1<ang2){delAngle=ang2-ang1;}else{delAngle=ang1-ang2;}
if(delAngle>Math.PI){delAngle=(2*Math.PI)-delAngle;}
return delAngle;};jsts.geom.GeometryComponentFilter=function(){};jsts.geom.GeometryComponentFilter.prototype.filter=function(geom){throw new jsts.error.AbstractMethodInvocationError();};jsts.geom.util.LinearComponentExtracter=function(lines,isForcedToLineString){this.lines=lines;this.isForcedToLineString=isForcedToLineString;};jsts.geom.util.LinearComponentExtracter.prototype=new jsts.geom.GeometryComponentFilter();jsts.geom.util.LinearComponentExtracter.prototype.lines=null;jsts.geom.util.LinearComponentExtracter.prototype.isForcedToLineString=false;jsts.geom.util.LinearComponentExtracter.getLines=function(geoms,lines){if(arguments.length==1){return jsts.geom.util.LinearComponentExtracter.getLines5.apply(this,arguments);}
else if(arguments.length==2&&typeof lines==='boolean'){return jsts.geom.util.LinearComponentExtracter.getLines6.apply(this,arguments);}
else if(arguments.length==2&&geoms instanceof jsts.geom.Geometry){return jsts.geom.util.LinearComponentExtracter.getLines3.apply(this,arguments);}
else if(arguments.length==3&&geoms instanceof jsts.geom.Geometry){return jsts.geom.util.LinearComponentExtracter.getLines4.apply(this,arguments);}
else if(arguments.length==3){return jsts.geom.util.LinearComponentExtracter.getLines2.apply(this,arguments);}
for(var i=0;i<geoms.length;i++){var g=geoms[i];jsts.geom.util.LinearComponentExtracter.getLines3(g,lines);}
return lines;};jsts.geom.util.LinearComponentExtracter.getLines2=function(geoms,lines,forceToLineString){for(var i=0;i<geoms.length;i++){var g=geoms[i];jsts.geom.util.LinearComponentExtracter.getLines4(g,lines,forceToLineString);}
return lines;};jsts.geom.util.LinearComponentExtracter.getLines3=function(geom,lines){if(geom instanceof LineString){lines.add(geom);}else{geom.apply(new jsts.geom.util.LinearComponentExtracter(lines));}
return lines;};jsts.geom.util.LinearComponentExtracter.getLines4=function(geom,lines,forceToLineString){geom.apply(new jsts.geom.util.LinearComponentExtracter(lines,forceToLineString));return lines;};jsts.geom.util.LinearComponentExtracter.getLines5=function(geom){return jsts.geom.util.LinearComponentExtracter.getLines6(geom,false);};jsts.geom.util.LinearComponentExtracter.getLines6=function(geom,forceToLineString){var lines=[];geom.apply(new jsts.geom.util.LinearComponentExtracter(lines,forceToLineString));return lines;};jsts.geom.util.LinearComponentExtracter.prototype.setForceToLineString=function(isForcedToLineString){this.isForcedToLineString=isForcedToLineString;};jsts.geom.util.LinearComponentExtracter.prototype.filter=function(geom){if(this.isForcedToLineString&&geom instanceof jsts.geom.LinearRing){var line=geom.getFactory().createLineString(geom.getCoordinateSequence());this.lines.push(line);return;}
if(geom instanceof jsts.geom.LineString||geom instanceof jsts.geom.LinearRing)
this.lines.push(geom);};(function(){var GraphComponent=function(){};GraphComponent.setVisited=function(i,visited){while(i.hasNext()){var comp=i.next();comp.setVisited(visited);}};GraphComponent.setMarked=function(i,marked){while(i.hasNext()){var comp=i.next();comp.setMarked(marked);}};GraphComponent.getComponentWithVisitedState=function(i,visitedState){while(i.hasNext()){var comp=i.next();if(comp.isVisited()==visitedState)
return comp;}
return null;};GraphComponent.prototype._isMarked=false;GraphComponent.prototype._isVisited=false;GraphComponent.prototype.data;GraphComponent.prototype.isVisited=function(){return this._isVisited;};GraphComponent.prototype.setVisited=function(isVisited){this._isVisited=isVisited;};GraphComponent.prototype.isMarked=function(){return this._isMarked;};GraphComponent.prototype.setMarked=function(isMarked){this._isMarked=isMarked;};GraphComponent.prototype.setContext=function(data){this.data=data;};GraphComponent.prototype.getContext=function(){return data;};GraphComponent.prototype.setData=function(data){this.data=data;};GraphComponent.prototype.getData=function(){return data;};GraphComponent.prototype.isRemoved=function(){throw new jsts.error.AbstractMethodInvocationError();};jsts.planargraph.GraphComponent=GraphComponent;})();(function(){var ArrayList=javascript.util.ArrayList;var DirectedEdgeStar=function(){this.outEdges=new ArrayList();};DirectedEdgeStar.prototype.outEdges=null;DirectedEdgeStar.prototype.sorted=false;DirectedEdgeStar.prototype.add=function(de){this.outEdges.add(de);this.sorted=false;};DirectedEdgeStar.prototype.remove=function(de){this.outEdges.remove(de);};DirectedEdgeStar.prototype.iterator=function(){this.sortEdges();return this.outEdges.iterator();};DirectedEdgeStar.prototype.getDegree=function(){return this.outEdges.size();};DirectedEdgeStar.prototype.getCoordinate=function(){var it=iterator();if(!it.hasNext())
return null;var e=it.next();return e.getCoordinate();};DirectedEdgeStar.prototype.getEdges=function(){this.sortEdges();return this.outEdges;};DirectedEdgeStar.prototype.sortEdges=function(){if(!this.sorted){var array=this.outEdges.toArray();array.sort(function(a,b){return a.compareTo(b);});this.outEdges=javascript.util.Arrays.asList(array);this.sorted=true;}};DirectedEdgeStar.prototype.getIndex=function(edge){if(edge instanceof jsts.planargraph.DirectedEdge){return this.getIndex2(edge);}else if(typeof(edge)==='number'){return this.getIndex3(edge);}
this.sortEdges();for(var i=0;i<this.outEdges.size();i++){var de=this.outEdges.get(i);if(de.getEdge()==edge)
return i;}
return-1;};DirectedEdgeStar.prototype.getIndex2=function(dirEdge){this.sortEdges();for(var i=0;i<this.outEdges.size();i++){var de=this.outEdges.get(i);if(de==dirEdge)
return i;}
return-1;};DirectedEdgeStar.prototype.getIndex3=function(i){var modi=toInt(i%this.outEdges.size());if(modi<0)
modi+=this.outEdges.size();return modi;};DirectedEdgeStar.prototype.getNextEdge=function(dirEdge){var i=this.getIndex(dirEdge);return this.outEdges.get(getIndex(i+1));};DirectedEdgeStar.prototype.getNextCWEdge=function(dirEdge){var i=this.getIndex(dirEdge);return this.outEdges.get(getIndex(i-1));};jsts.planargraph.DirectedEdgeStar=DirectedEdgeStar;})();(function(){var GraphComponent=jsts.planargraph.GraphComponent;var DirectedEdgeStar=jsts.planargraph.DirectedEdgeStar;var Node=function(pt,deStar){this.pt=pt;this.deStar=deStar||new DirectedEdgeStar();};Node.prototype=new GraphComponent();Node.getEdgesBetween=function(node0,node1){var edges0=DirectedEdge.toEdges(node0.getOutEdges().getEdges());var commonEdges=new javascript.util.HashSet(edges0);var edges1=DirectedEdge.toEdges(node1.getOutEdges().getEdges());commonEdges.retainAll(edges1);return commonEdges;};Node.prototype.pt=null;Node.prototype.deStar=null;Node.prototype.getCoordinate=function(){return this.pt;};Node.prototype.addOutEdge=function(de){this.deStar.add(de);};Node.prototype.getOutEdges=function(){return this.deStar;};Node.prototype.getDegree=function(){return this.deStar.getDegree();};Node.prototype.getIndex=function(edge){return this.deStar.getIndex(edge);};Node.prototype.remove=function(de){if(de===undefined){return this.remove2();}
this.deStar.remove(de);};Node.prototype.remove2=function(){this.pt=null;};Node.prototype.isRemoved=function(){return this.pt==null;};jsts.planargraph.Node=Node;})();(function(){jsts.io.GeoJSONReader=function(geometryFactory){this.geometryFactory=geometryFactory||new jsts.geom.GeometryFactory();this.precisionModel=this.geometryFactory.getPrecisionModel();this.parser=new jsts.io.GeoJSONParser(this.geometryFactory);};jsts.io.GeoJSONReader.prototype.read=function(geoJson){var geometry=this.parser.read(geoJson);if(this.precisionModel.getType()===jsts.geom.PrecisionModel.FIXED){this.reducePrecision(geometry);}
return geometry;};jsts.io.GeoJSONReader.prototype.reducePrecision=function(geometry){var i,len;if(geometry.coordinate){this.precisionModel.makePrecise(geometry.coordinate);}else if(geometry.points){for(i=0,len=geometry.points.length;i<len;i++){this.precisionModel.makePrecise(geometry.points[i]);}}else if(geometry.geometries){for(i=0,len=geometry.geometries.length;i<len;i++){this.reducePrecision(geometry.geometries[i]);}}};})();jsts.geom.Geometry=function(factory){this.factory=factory;};jsts.geom.Geometry.prototype.envelope=null;jsts.geom.Geometry.prototype.factory=null;jsts.geom.Geometry.prototype.getGeometryType=function(){return'Geometry';};jsts.geom.Geometry.hasNonEmptyElements=function(geometries){var i;for(i=0;i<geometries.length;i++){if(!geometries[i].isEmpty()){return true;}}
return false;};jsts.geom.Geometry.hasNullElements=function(array){var i;for(i=0;i<array.length;i++){if(array[i]===null){return true;}}
return false;};jsts.geom.Geometry.prototype.getFactory=function(){if(this.factory===null||this.factory===undefined){this.factory=new jsts.geom.GeometryFactory();}
return this.factory;};jsts.geom.Geometry.prototype.getNumGeometries=function(){return 1;};jsts.geom.Geometry.prototype.getGeometryN=function(n){return this;};jsts.geom.Geometry.prototype.getPrecisionModel=function(){return this.getFactory().getPrecisionModel();};jsts.geom.Geometry.prototype.getCoordinate=function(){throw new jsts.error.AbstractMethodInvocationError();};jsts.geom.Geometry.prototype.getCoordinates=function(){throw new jsts.error.AbstractMethodInvocationError();};jsts.geom.Geometry.prototype.getNumPoints=function(){throw new jsts.error.AbstractMethodInvocationError();};jsts.geom.Geometry.prototype.isSimple=function(){this.checkNotGeometryCollection(this);var op=new jsts.operation.IsSimpleOp(this);return op.isSimple();};jsts.geom.Geometry.prototype.isValid=function(){var isValidOp=new jsts.operation.valid.IsValidOp(this);return isValidOp.isValid();};jsts.geom.Geometry.prototype.isEmpty=function(){throw new jsts.error.AbstractMethodInvocationError();};jsts.geom.Geometry.prototype.distance=function(g){return jsts.operation.distance.DistanceOp.distance(this,g);};jsts.geom.Geometry.prototype.isWithinDistance=function(geom,distance){var envDist=this.getEnvelopeInternal().distance(geom.getEnvelopeInternal());if(envDist>distance){return false;}
return DistanceOp.isWithinDistance(this,geom,distance);};jsts.geom.Geometry.prototype.isRectangle=function(){return false;};jsts.geom.Geometry.prototype.getArea=function(){return 0.0;};jsts.geom.Geometry.prototype.getLength=function(){return 0.0;};jsts.geom.Geometry.prototype.getCentroid=function(){if(this.isEmpty()){return null;}
var cent;var centPt=null;var dim=this.getDimension();if(dim===0){cent=new jsts.algorithm.CentroidPoint();cent.add(this);centPt=cent.getCentroid();}else if(dim===1){cent=new jsts.algorithm.CentroidLine();cent.add(this);centPt=cent.getCentroid();}else{cent=new jsts.algorithm.CentroidArea();cent.add(this);centPt=cent.getCentroid();}
return this.createPointFromInternalCoord(centPt,this);};jsts.geom.Geometry.prototype.getInteriorPoint=function(){var intPt;var interiorPt=null;var dim=this.getDimension();if(dim===0){intPt=new InteriorPointPoint(this);interiorPt=intPt.getInteriorPoint();}else if(dim===1){intPt=new InteriorPointLine(this);interiorPt=intPt.getInteriorPoint();}else{intPt=new InteriorPointArea(this);interiorPt=intPt.getInteriorPoint();}
return this.createPointFromInternalCoord(interiorPt,this);};jsts.geom.Geometry.prototype.getDimension=function(){throw new jsts.error.AbstractMethodInvocationError();};jsts.geom.Geometry.prototype.getBoundary=function(){throw new jsts.error.AbstractMethodInvocationError();};jsts.geom.Geometry.prototype.getBoundaryDimension=function(){throw new jsts.error.AbstractMethodInvocationError();};jsts.geom.Geometry.prototype.getEnvelope=function(){return this.getFactory().toGeometry(this.getEnvelopeInternal());};jsts.geom.Geometry.prototype.getEnvelopeInternal=function(){if(this.envelope===null){this.envelope=this.computeEnvelopeInternal();}
return this.envelope;};jsts.geom.Geometry.prototype.disjoint=function(g){return!this.intersects(g);};jsts.geom.Geometry.prototype.touches=function(g){if(!this.getEnvelopeInternal().intersects(g.getEnvelopeInternal())){return false;}
return this.relate(g).isTouches(this.getDimension(),g.getDimension());};jsts.geom.Geometry.prototype.intersects=function(g){if(!this.getEnvelopeInternal().intersects(g.getEnvelopeInternal())){return false;}
if(this.isRectangle()){return RectangleIntersects.intersects(this,g);}
if(g.isRectangle()){return RectangleIntersects.intersects(g,this);}
return this.relate(g).isIntersects();};jsts.geom.Geometry.prototype.crosses=function(g){if(!this.getEnvelopeInternal().intersects(g.getEnvelopeInternal())){return false;}
return this.relate(g).isCrosses(this.getDimension(),g.getDimension());};jsts.geom.Geometry.prototype.within=function(g){return g.contains(this);};jsts.geom.Geometry.prototype.contains=function(g){if(!this.getEnvelopeInternal().contains(g.getEnvelopeInternal())){return false;}
if(this.isRectangle()){return RectangleContains.contains(this,g);}
return this.relate(g).isContains();};jsts.geom.Geometry.prototype.overlaps=function(g){if(!this.getEnvelopeInternal().intersects(g.getEnvelopeInternal())){return false;}
return this.relate(g).isOverlaps(this.getDimension(),g.getDimension());};jsts.geom.Geometry.prototype.covers=function(g){if(!this.getEnvelopeInternal().covers(g.getEnvelopeInternal())){return false;}
if(this.isRectangle()){return true;}
return this.relate(g).isCovers();};jsts.geom.Geometry.prototype.coveredBy=function(g){return g.covers(this);};jsts.geom.Geometry.prototype.relate=function(g,intersectionPattern){if(arguments.length===1){return this.relate2.apply(this,arguments);}
return this.relate2(g).matches(intersectionPattern);};jsts.geom.Geometry.prototype.relate2=function(g){this.checkNotGeometryCollection(this);this.checkNotGeometryCollection(g);return jsts.operation.relate.RelateOp.relate(this,g);};jsts.geom.Geometry.prototype.equalsTopo=function(g){if(!this.getEnvelopeInternal().equals(g.getEnvelopeInternal())){return false;}
return this.relate(g).isEquals(this.getDimension(),g.getDimension());};jsts.geom.Geometry.prototype.equals=function(o){if(o instanceof jsts.geom.Geometry||o instanceof jsts.geom.LinearRing||o instanceof jsts.geom.Polygon||o instanceof jsts.geom.GeometryCollection||o instanceof jsts.geom.MultiPoint||o instanceof jsts.geom.MultiLineString||o instanceof jsts.geom.MultiPolygon){return this.equalsExact(o);}
return false;};jsts.geom.Geometry.prototype.buffer=function(distance,quadrantSegments,endCapStyle){var params=new jsts.operation.buffer.BufferParameters(quadrantSegments,endCapStyle)
return jsts.operation.buffer.BufferOp.bufferOp2(this,distance,params);};jsts.geom.Geometry.prototype.convexHull=function(){return new jsts.algorithm.ConvexHull(this).getConvexHull();};jsts.geom.Geometry.prototype.intersection=function(other){if(this.isEmpty()){return this.getFactory().createGeometryCollection(null);}
if(other.isEmpty()){return this.getFactory().createGeometryCollection(null);}
if(this.isGeometryCollection(this)){var g2=other;}
this.checkNotGeometryCollection(this);this.checkNotGeometryCollection(other);return jsts.operation.overlay.snap.SnapIfNeededOverlayOp.overlayOp(this,other,jsts.operation.overlay.OverlayOp.INTERSECTION);};jsts.geom.Geometry.prototype.union=function(other){if(arguments.length===0){return jsts.operation.union.UnaryUnionOp.union(this);}
if(this.isEmpty()){return other.clone();}
if(other.isEmpty()){return this.clone();}
this.checkNotGeometryCollection(this);this.checkNotGeometryCollection(other);return jsts.operation.overlay.snap.SnapIfNeededOverlayOp.overlayOp(this,other,jsts.operation.overlay.OverlayOp.UNION);};jsts.geom.Geometry.prototype.difference=function(other){if(this.isEmpty()){return this.getFactory().createGeometryCollection(null);}
if(other.isEmpty()){return this.clone();}
this.checkNotGeometryCollection(this);this.checkNotGeometryCollection(other);return jsts.operation.overlay.snap.SnapIfNeededOverlayOp.overlayOp(this,other,jsts.operation.overlay.OverlayOp.DIFFERENCE);};jsts.geom.Geometry.prototype.symDifference=function(other){if(this.isEmpty()){return other.clone();}
if(other.isEmpty()){return this.clone();}
this.checkNotGeometryCollection(this);this.checkNotGeometryCollection(other);return jsts.operation.overlay.snap.SnapIfNeededOverlayOp.overlayOp(this,other,jsts.operation.overlay.OverlayOp.SYMDIFFERENCE);};jsts.geom.Geometry.prototype.equalsExact=function(other,tolerance){throw new jsts.error.AbstractMethodInvocationError();};jsts.geom.Geometry.prototype.equalsNorm=function(g){if(g===null||g===undefined)
return false;return this.norm().equalsExact(g.norm());};jsts.geom.Geometry.prototype.apply=function(filter){throw new jsts.error.AbstractMethodInvocationError();};jsts.geom.Geometry.prototype.clone=function(){throw new jsts.error.AbstractMethodInvocationError();};jsts.geom.Geometry.prototype.normalize=function(){throw new jsts.error.AbstractMethodInvocationError();};jsts.geom.Geometry.prototype.norm=function(){var copy=this.clone();copy.normalize();return copy;};jsts.geom.Geometry.prototype.compareTo=function(o){var other=o;if(this.getClassSortIndex()!==other.getClassSortIndex()){return this.getClassSortIndex()-other.getClassSortIndex();}
if(this.isEmpty()&&other.isEmpty()){return 0;}
if(this.isEmpty()){return-1;}
if(other.isEmpty()){return 1;}
return this.compareToSameClass(o);};jsts.geom.Geometry.prototype.isEquivalentClass=function(other){if(this instanceof jsts.geom.Point&&other instanceof jsts.geom.Point){return true;}else if(this instanceof jsts.geom.LineString&&(other instanceof jsts.geom.LineString|other instanceof jsts.geom.LinearRing)){return true;}else if(this instanceof jsts.geom.LinearRing&&(other instanceof jsts.geom.LineString|other instanceof jsts.geom.LinearRing)){return true;}else if(this instanceof jsts.geom.Polygon&&(other instanceof jsts.geom.Polygon)){return true;}else if(this instanceof jsts.geom.MultiPoint&&(other instanceof jsts.geom.MultiPoint)){return true;}else if(this instanceof jsts.geom.MultiLineString&&(other instanceof jsts.geom.MultiLineString)){return true;}else if(this instanceof jsts.geom.MultiPolygon&&(other instanceof jsts.geom.MultiPolygon)){return true;}else if(this instanceof jsts.geom.GeometryCollection&&(other instanceof jsts.geom.GeometryCollection)){return true;}
return false;};jsts.geom.Geometry.prototype.checkNotGeometryCollection=function(g){if(g.isGeometryCollectionBase()){throw new jsts.error.IllegalArgumentError('This method does not support GeometryCollection');}};jsts.geom.Geometry.prototype.isGeometryCollection=function(){return(this instanceof jsts.geom.GeometryCollection);};jsts.geom.Geometry.prototype.isGeometryCollectionBase=function(){return(this.CLASS_NAME==='jsts.geom.GeometryCollection');};jsts.geom.Geometry.prototype.computeEnvelopeInternal=function(){throw new jsts.error.AbstractMethodInvocationError();};jsts.geom.Geometry.prototype.compareToSameClass=function(o){throw new jsts.error.AbstractMethodInvocationError();};jsts.geom.Geometry.prototype.compare=function(a,b){var i=a.iterator();var j=b.iterator();while(i.hasNext()&&j.hasNext()){var aElement=i.next();var bElement=j.next();var comparison=aElement.compareTo(bElement);if(comparison!==0){return comparison;}}
if(i.hasNext()){return 1;}
if(j.hasNext()){return-1;}
return 0;};jsts.geom.Geometry.prototype.equal=function(a,b,tolerance){if(tolerance===undefined||tolerance===null||tolerance===0){return a.equals(b);}
return a.distance(b)<=tolerance;};jsts.geom.Geometry.prototype.getClassSortIndex=function(){var sortedClasses=[jsts.geom.Point,jsts.geom.MultiPoint,jsts.geom.LineString,jsts.geom.LinearRing,jsts.geom.MultiLineString,jsts.geom.Polygon,jsts.geom.MultiPolygon,jsts.geom.GeometryCollection];for(var i=0;i<sortedClasses.length;i++){if(this instanceof sortedClasses[i])
return i;}
jsts.util.Assert.shouldNeverReachHere('Class not supported: '+this);return-1;};jsts.geom.Geometry.prototype.toString=function(){return new jsts.io.WKTWriter().write(this);};jsts.geom.Geometry.prototype.createPointFromInternalCoord=function(coord,exemplar){exemplar.getPrecisionModel().makePrecise(coord);return exemplar.getFactory().createPoint(coord);};(function(){jsts.geom.Coordinate=function(x,y){if(typeof x==='number'){this.x=x;this.y=y;}else if(x instanceof jsts.geom.Coordinate){this.x=parseFloat(x.x);this.y=parseFloat(x.y);}else if(x===undefined||x===null){this.x=0;this.y=0;}else if(typeof x==='string'){this.x=parseFloat(x);this.y=parseFloat(y);}};jsts.geom.Coordinate.prototype.setCoordinate=function(other){this.x=other.x;this.y=other.y;};jsts.geom.Coordinate.prototype.clone=function(){return new jsts.geom.Coordinate(this.x,this.y);};jsts.geom.Coordinate.prototype.distance=function(p){var dx=this.x-p.x;var dy=this.y-p.y;return Math.sqrt(dx*dx+dy*dy);};jsts.geom.Coordinate.prototype.equals2D=function(other){if(this.x!==other.x){return false;}
if(this.y!==other.y){return false;}
return true;};jsts.geom.Coordinate.prototype.equals=function(other){if(!other instanceof jsts.geom.Coordinate||other===undefined){return false;}
return this.equals2D(other);};jsts.geom.Coordinate.prototype.compareTo=function(other){if(this.x<other.x){return-1;}
if(this.x>other.x){return 1;}
if(this.y<other.y){return-1;}
if(this.y>other.y){return 1;}
return 0;};jsts.geom.Coordinate.prototype.toString=function(){return'('+this.x+', '+this.y+')';};})();jsts.geom.Envelope=function(){jsts.geom.Envelope.prototype.init.apply(this,arguments);};jsts.geom.Envelope.prototype.minx=null;jsts.geom.Envelope.prototype.maxx=null;jsts.geom.Envelope.prototype.miny=null;jsts.geom.Envelope.prototype.maxy=null;jsts.geom.Envelope.prototype.init=function(){if(typeof arguments[0]==='number'&&arguments.length===4){this.initFromValues(arguments[0],arguments[1],arguments[2],arguments[3]);}else if(arguments[0]instanceof jsts.geom.Coordinate&&arguments.length===1){this.initFromCoordinate(arguments[0]);}else if(arguments[0]instanceof jsts.geom.Coordinate&&arguments.length===2){this.initFromCoordinates(arguments[0],arguments[1]);}else if(arguments[0]instanceof jsts.geom.Envelope&&arguments.length===1){this.initFromEnvelope(arguments[0]);}else{this.setToNull();}};jsts.geom.Envelope.prototype.initFromValues=function(x1,x2,y1,y2){if(x1<x2){this.minx=x1;this.maxx=x2;}else{this.minx=x2;this.maxx=x1;}
if(y1<y2){this.miny=y1;this.maxy=y2;}else{this.miny=y2;this.maxy=y1;}};jsts.geom.Envelope.prototype.initFromCoordinates=function(p1,p2){this.initFromValues(p1.x,p2.x,p1.y,p2.y);};jsts.geom.Envelope.prototype.initFromCoordinate=function(p){this.initFromValues(p.x,p.x,p.y,p.y);};jsts.geom.Envelope.prototype.initFromEnvelope=function(env){this.minx=env.minx;this.maxx=env.maxx;this.miny=env.miny;this.maxy=env.maxy;};jsts.geom.Envelope.prototype.setToNull=function(){this.minx=0;this.maxx=-1;this.miny=0;this.maxy=-1;};jsts.geom.Envelope.prototype.isNull=function(){return this.maxx<this.minx;};jsts.geom.Envelope.prototype.getHeight=function(){if(this.isNull()){return 0;}
return this.maxy-this.miny;};jsts.geom.Envelope.prototype.getWidth=function(){if(this.isNull()){return 0;}
return this.maxx-this.minx;};jsts.geom.Envelope.prototype.getMinX=function(){return this.minx;};jsts.geom.Envelope.prototype.getMaxX=function(){return this.maxx;};jsts.geom.Envelope.prototype.getMinY=function(){return this.miny;};jsts.geom.Envelope.prototype.getMaxY=function(){return this.maxy;};jsts.geom.Envelope.prototype.getArea=function(){return this.getWidth()*this.getHeight();};jsts.geom.Envelope.prototype.expandToInclude=function(){if(arguments[0]instanceof jsts.geom.Coordinate){this.expandToIncludeCoordinate(arguments[0]);}else if(arguments[0]instanceof jsts.geom.Envelope){this.expandToIncludeEnvelope(arguments[0]);}else{this.expandToIncludeValues(arguments[0],arguments[1]);}};jsts.geom.Envelope.prototype.expandToIncludeCoordinate=function(p){this.expandToIncludeValues(p.x,p.y);};jsts.geom.Envelope.prototype.expandToIncludeValues=function(x,y){if(this.isNull()){this.minx=x;this.maxx=x;this.miny=y;this.maxy=y;}else{if(x<this.minx){this.minx=x;}
if(x>this.maxx){this.maxx=x;}
if(y<this.miny){this.miny=y;}
if(y>this.maxy){this.maxy=y;}}};jsts.geom.Envelope.prototype.expandToIncludeEnvelope=function(other){if(other.isNull()){return;}
if(this.isNull()){this.minx=other.getMinX();this.maxx=other.getMaxX();this.miny=other.getMinY();this.maxy=other.getMaxY();}else{if(other.minx<this.minx){this.minx=other.minx;}
if(other.maxx>this.maxx){this.maxx=other.maxx;}
if(other.miny<this.miny){this.miny=other.miny;}
if(other.maxy>this.maxy){this.maxy=other.maxy;}}};jsts.geom.Envelope.prototype.expandBy=function(){if(arguments.length===1){this.expandByDistance(arguments[0]);}else{this.expandByDistances(arguments[0],arguments[1]);}};jsts.geom.Envelope.prototype.expandByDistance=function(distance){this.expandByDistances(distance,distance);};jsts.geom.Envelope.prototype.expandByDistances=function(deltaX,deltaY){if(this.isNull()){return;}
this.minx-=deltaX;this.maxx+=deltaX;this.miny-=deltaY;this.maxy+=deltaY;if(this.minx>this.maxx||this.miny>this.maxy){this.setToNull();}};jsts.geom.Envelope.prototype.translate=function(transX,transY){if(this.isNull()){return;}
this.init(this.minx+transX,this.maxx+transX,this.miny+transY,this.maxy+transY);};jsts.geom.Envelope.prototype.centre=function(){if(this.isNull()){return null;}
return new jsts.geom.Coordinate((this.minx+this.maxx)/2.0,(this.miny+this.maxy)/2.0);};jsts.geom.Envelope.prototype.intersection=function(env){if(this.isNull()||env.isNull()||!this.intersects(env)){return new jsts.geom.Envelope();}
var intMinX=this.minx>env.minx?this.minx:env.minx;var intMinY=this.miny>env.miny?this.miny:env.miny;var intMaxX=this.maxx<env.maxx?this.maxx:env.maxx;var intMaxY=this.maxy<env.maxy?this.maxy:env.maxy;return new jsts.geom.Envelope(intMinX,intMaxX,intMinY,intMaxY);};jsts.geom.Envelope.prototype.intersects=function(){if(arguments[0]instanceof jsts.geom.Envelope){return this.intersectsEnvelope(arguments[0]);}else if(arguments[0]instanceof jsts.geom.Coordinate){return this.intersectsCoordinate(arguments[0]);}else{return this.intersectsValues(arguments[0],arguments[1]);}};jsts.geom.Envelope.prototype.intersectsEnvelope=function(other){if(this.isNull()||other.isNull()){return false;}
var result=!(other.minx>this.maxx||other.maxx<this.minx||other.miny>this.maxy||other.maxy<this.miny);return result;};jsts.geom.Envelope.prototype.intersectsCoordinate=function(p){return this.intersectsValues(p.x,p.y);};jsts.geom.Envelope.prototype.intersectsValues=function(x,y){if(this.isNull()){return false;}
return!(x>this.maxx||x<this.minx||y>this.maxy||y<this.miny);};jsts.geom.Envelope.prototype.contains=function(){if(arguments[0]instanceof jsts.geom.Envelope){return this.containsEnvelope(arguments[0]);}else if(arguments[0]instanceof jsts.geom.Coordinate){return this.containsCoordinate(arguments[0]);}else{return this.containsValues(arguments[0],arguments[1]);}};jsts.geom.Envelope.prototype.containsEnvelope=function(other){return this.coversEnvelope(other);};jsts.geom.Envelope.prototype.containsCoordinate=function(p){return this.coversCoordinate(p);};jsts.geom.Envelope.prototype.containsValues=function(x,y){return this.coversValues(x,y);};jsts.geom.Envelope.prototype.covers=function(){if(p instanceof jsts.geom.Envelope){this.coversEnvelope(arguments[0]);}else if(p instanceof jsts.geom.Coordinate){this.coversCoordinate(arguments[0]);}else{this.coversValues(arguments[0],arguments[1]);}};jsts.geom.Envelope.prototype.coversValues=function(x,y){if(this.isNull()){return false;}
return x>=this.minx&&x<=this.maxx&&y>=this.miny&&y<=this.maxy;};jsts.geom.Envelope.prototype.coversCoordinate=function(p){return this.coversValues(p.x,p.y);};jsts.geom.Envelope.prototype.coversEnvelope=function(other){if(this.isNull()||other.isNull()){return false;}
return other.minx>=this.minx&&other.maxx<=this.maxx&&other.miny>=this.miny&&other.maxy<=this.maxy;};jsts.geom.Envelope.prototype.distance=function(env){if(this.intersects(env)){return 0;}
var dx=0.0;if(this.maxx<env.minx){dx=env.minx-this.maxx;}
if(this.minx>env.maxx){dx=this.minx-env.maxx;}
var dy=0.0;if(this.maxy<env.miny){dy=env.miny-this.maxy;}
if(this.miny>env.maxy){dy=this.miny-env.maxy;}
if(dx===0.0){return dy;}
if(dy===0.0){return dx;}
return Math.sqrt(dx*dx+dy*dy);};jsts.geom.Envelope.prototype.equals=function(other){if(this.isNull()){return other.isNull();}
return this.maxx===other.maxx&&this.maxy===other.maxy&&this.minx===other.minx&&this.miny===other.miny;};jsts.geom.Envelope.prototype.toString=function(){return'Env['+this.minx+' : '+this.maxx+', '+this.miny+' : '+
this.maxy+']';};jsts.geom.Envelope.intersects=function(p1,p2,q){if(arguments.length===4){return jsts.geom.Envelope.intersectsEnvelope(arguments[0],arguments[1],arguments[2],arguments[3]);}
var xc1=p1.x<p2.x?p1.x:p2.x;var xc2=p1.x>p2.x?p1.x:p2.x;var yc1=p1.y<p2.y?p1.y:p2.y;var yc2=p1.y>p2.y?p1.y:p2.y;if(((q.x>=xc1)&&(q.x<=xc2))&&((q.y>=yc1)&&(q.y<=yc2))){return true;}
return false;};jsts.geom.Envelope.intersectsEnvelope=function(p1,p2,q1,q2){var minq=Math.min(q1.x,q2.x);var maxq=Math.max(q1.x,q2.x);var minp=Math.min(p1.x,p2.x);var maxp=Math.max(p1.x,p2.x);if(minp>maxq){return false;}
if(maxp<minq){return false;}
minq=Math.min(q1.y,q2.y);maxq=Math.max(q1.y,q2.y);minp=Math.min(p1.y,p2.y);maxp=Math.max(p1.y,p2.y);if(minp>maxq){return false;}
if(maxp<minq){return false;}
return true;};jsts.geom.Envelope.prototype.clone=function(){return new jsts.geom.Envelope(this.minx,this.maxx,this.miny,this.maxy);};jsts.geom.util.GeometryCombiner=function(geoms){this.geomFactory=jsts.geom.util.GeometryCombiner.extractFactory(geoms);this.inputGeoms=geoms;};jsts.geom.util.GeometryCombiner.combine=function(geoms){if(arguments.length>1)return this.combine2.apply(this,arguments);var combiner=new jsts.geom.util.GeometryCombiner(geoms);return combiner.combine();};jsts.geom.util.GeometryCombiner.combine2=function(){var arrayList=new javascript.util.ArrayList();arguments.foreach(function(a){arrayList.add(a);})
var combiner=jsts.geom.util.GeometryCombiner(arrayList);return combiner.combine();};jsts.geom.util.GeometryCombiner.prototype.geomFactory=null;jsts.geom.util.GeometryCombiner.prototype.skipEmpty=false;jsts.geom.util.GeometryCombiner.prototype.inputGeoms;jsts.geom.util.GeometryCombiner.extractFactory=function(geoms){if(geoms.isEmpty())return null;return geoms.iterator().next().getFactory();};jsts.geom.util.GeometryCombiner.prototype.combine=function(){var elems=new javascript.util.ArrayList(),i;for(i=this.inputGeoms.iterator();i.hasNext();){var g=i.next();this.extractElements(g,elems);}
if(elems.size()===0){if(this.geomFactory!==null){return geomFactory.createGeometryCollection(null);}
return null;}
return this.geomFactory.buildGeometry(elems);};jsts.geom.util.GeometryCombiner.prototype.extractElements=function(geom,elems){if(geom===null){return;}
for(var i=0;i<geom.getNumGeometries();i++){var elemGeom=geom.getGeometryN(i);if(this.skipEmpty&&elemGeom.isEmpty()){continue;}
elems.add(elemGeom);}};jsts.geom.PrecisionModel=function(modelType){if(typeof modelType==='number'){this.modelType=jsts.geom.PrecisionModel.FIXED;this.scale=modelType;return;}
this.modelType=modelType||jsts.geom.PrecisionModel.FLOATING;if(this.modelType===jsts.geom.PrecisionModel.FIXED){this.scale=1.0;}};jsts.geom.PrecisionModel.FLOATING='FLOATING';jsts.geom.PrecisionModel.FIXED='FIXED';jsts.geom.PrecisionModel.FLOATING_SINGLE='FLOATING_SINGLE';jsts.geom.PrecisionModel.prototype.scale=null;jsts.geom.PrecisionModel.prototype.modelType=null;jsts.geom.PrecisionModel.prototype.isFloating=function(){return this.modelType===jsts.geom.PrecisionModel.FLOATING||this.modelType===jsts.geom.PrecisionModel.FLOATING_SINLGE;};jsts.geom.PrecisionModel.prototype.getScale=function(){return this.scale;};jsts.geom.PrecisionModel.prototype.getType=function(){return this.modelType;};jsts.geom.PrecisionModel.prototype.equals=function(other){return true;if(!(other instanceof jsts.geom.PrecisionModel)){return false;}
var otherPrecisionModel=other;return this.modelType===otherPrecisionModel.modelType&&this.scale===otherPrecisionModel.scale;};jsts.geom.PrecisionModel.prototype.makePrecise=function(val){if(val instanceof jsts.geom.Coordinate){this.makePrecise2(val);return;}
if(isNaN(val))
return val;if(this.modelType===jsts.geom.PrecisionModel.FIXED){return Math.round(val*this.scale)/this.scale;}
return val;};jsts.geom.PrecisionModel.prototype.makePrecise2=function(coord){if(this.modelType===jsts.geom.PrecisionModel.FLOATING)
return;coord.x=this.makePrecise(coord.x);coord.y=this.makePrecise(coord.y);};jsts.geom.PrecisionModel.prototype.compareTo=function(o){var other=o;return 0;};jsts.geom.CoordinateFilter=function(){};jsts.geom.CoordinateFilter.prototype.filter=function(coord){throw new jsts.error.AbstractMethodInvocationError();};jsts.geom.Point=function(coordinate,factory){this.factory=factory;if(coordinate===undefined)
return;this.coordinate=coordinate;};jsts.geom.Point.prototype=new jsts.geom.Geometry();jsts.geom.Point.constructor=jsts.geom.Point;jsts.geom.Point.CLASS_NAME='jsts.geom.Point';jsts.geom.Point.prototype.coordinate=null;jsts.geom.Point.prototype.getX=function(){return this.coordinate.x;};jsts.geom.Point.prototype.getY=function(){return this.coordinate.y;};jsts.geom.Point.prototype.getCoordinate=function(){return this.coordinate;};jsts.geom.Point.prototype.getCoordinates=function(){return this.isEmpty()?[]:[this.coordinate];};jsts.geom.Point.prototype.isEmpty=function(){return this.coordinate===null;};jsts.geom.Point.prototype.equalsExact=function(other,tolerance){if(!this.isEquivalentClass(other)){return false;}
if(this.isEmpty()&&other.isEmpty()){return true;}
return this.equal(other.getCoordinate(),this.getCoordinate(),tolerance);};jsts.geom.Point.prototype.getNumPoints=function(){return this.isEmpty()?0:1;};jsts.geom.Point.prototype.isSimple=function(){return true;};jsts.geom.Point.prototype.getBoundary=function(){return new jsts.geom.GeometryCollection(null);};jsts.geom.Point.prototype.computeEnvelopeInternal=function(){if(this.isEmpty()){return new jsts.geom.Envelope();}
return new jsts.geom.Envelope(this.coordinate);};jsts.geom.Point.prototype.apply=function(filter){if(filter instanceof jsts.geom.GeometryFilter||filter instanceof jsts.geom.GeometryComponentFilter){filter.filter(this);}else if(filter instanceof jsts.geom.CoordinateFilter){if(this.isEmpty()){return;}
filter.filter(this.getCoordinate());}};jsts.geom.Point.prototype.clone=function(){return new jsts.geom.Point(this.coordinate.clone(),this.factory);};jsts.geom.Point.prototype.getDimension=function(){return 0;};jsts.geom.Point.prototype.getBoundaryDimension=function(){return jsts.geom.Dimension.FALSE;};jsts.geom.Point.prototype.reverse=function(){return this.clone();};jsts.geom.Point.prototype.isValid=function(){if(!jsts.operation.valid.IsValidOp.isValid(this.getCoordinate())){return false;}
return true;};jsts.geom.Point.prototype.normalize=function(){};jsts.geom.Point.prototype.compareToSameClass=function(other){var point=other;return this.getCoordinate().compareTo(point.getCoordinate());};jsts.geom.Point.prototype.getGeometryType=function(){return'Point';};jsts.geom.Point.prototype.hashCode=function(){return'Point_'+this.coordinate.hashCode();};jsts.geom.Point.prototype.CLASS_NAME='jsts.geom.Point';jsts.geomgraph.EdgeIntersection=function(coord,segmentIndex,dist){this.coord=new jsts.geom.Coordinate(coord);this.segmentIndex=segmentIndex;this.dist=dist;};jsts.geomgraph.EdgeIntersection.prototype.coord=null;jsts.geomgraph.EdgeIntersection.prototype.segmentIndex=null;jsts.geomgraph.EdgeIntersection.prototype.dist=null;jsts.geomgraph.EdgeIntersection.prototype.getCoordinate=function(){return this.coord;};jsts.geomgraph.EdgeIntersection.prototype.getSegmentIndex=function(){return this.segmentIndex;};jsts.geomgraph.EdgeIntersection.prototype.getDistance=function(){return this.dist;};jsts.geomgraph.EdgeIntersection.prototype.compareTo=function(other){return this.compare(other.segmentIndex,other.dist);};jsts.geomgraph.EdgeIntersection.prototype.compare=function(segmentIndex,dist){if(this.segmentIndex<segmentIndex)
return-1;if(this.segmentIndex>segmentIndex)
return 1;if(this.dist<dist)
return-1;if(this.dist>dist)
return 1;return 0;};jsts.geomgraph.EdgeIntersection.prototype.isEndPoint=function(maxSegmentIndex){if(this.segmentIndex===0&&this.dist===0.0)
return true;if(this.segmentIndex===maxSegmentIndex)
return true;return false;};jsts.geomgraph.EdgeIntersection.prototype.toString=function(){return''+this.segmentIndex+this.dist;};(function(){var EdgeIntersection=jsts.geomgraph.EdgeIntersection;var TreeMap=javascript.util.TreeMap;jsts.geomgraph.EdgeIntersectionList=function(edge){this.nodeMap=new TreeMap();this.edge=edge;};jsts.geomgraph.EdgeIntersectionList.prototype.nodeMap=null;jsts.geomgraph.EdgeIntersectionList.prototype.edge=null;jsts.geomgraph.EdgeIntersectionList.prototype.isIntersection=function(pt){for(var it=this.iterator();it.hasNext();){var ei=it.next();if(ei.coord.equals(pt)){return true;}}
return false;};jsts.geomgraph.EdgeIntersectionList.prototype.add=function(intPt,segmentIndex,dist){var eiNew=new EdgeIntersection(intPt,segmentIndex,dist);var ei=this.nodeMap.get(eiNew);if(ei!==null){return ei;}
this.nodeMap.put(eiNew,eiNew);return eiNew;};jsts.geomgraph.EdgeIntersectionList.prototype.iterator=function(){return this.nodeMap.values().iterator();};jsts.geomgraph.EdgeIntersectionList.prototype.addEndpoints=function(){var maxSegIndex=this.edge.pts.length-1;this.add(this.edge.pts[0],0,0.0);this.add(this.edge.pts[maxSegIndex],maxSegIndex,0.0);};jsts.geomgraph.EdgeIntersectionList.prototype.addSplitEdges=function(edgeList)
{this.addEndpoints();var it=this.iterator();var eiPrev=it.next();while(it.hasNext()){var ei=it.next();var newEdge=this.createSplitEdge(eiPrev,ei);edgeList.add(newEdge);eiPrev=ei;}};jsts.geomgraph.EdgeIntersectionList.prototype.createSplitEdge=function(ei0,ei1){var npts=ei1.segmentIndex-ei0.segmentIndex+2;var lastSegStartPt=this.edge.pts[ei1.segmentIndex];var useIntPt1=ei1.dist>0.0||!ei1.coord.equals2D(lastSegStartPt);if(!useIntPt1){npts--;}
var pts=[];var ipt=0;pts[ipt++]=new jsts.geom.Coordinate(ei0.coord);for(var i=ei0.segmentIndex+1;i<=ei1.segmentIndex;i++){pts[ipt++]=this.edge.pts[i];}
if(useIntPt1)pts[ipt]=ei1.coord;return new jsts.geomgraph.Edge(pts,new jsts.geomgraph.Label(this.edge.label));};})();jsts.geom.Location=function(){};jsts.geom.Location.INTERIOR=0;jsts.geom.Location.BOUNDARY=1;jsts.geom.Location.EXTERIOR=2;jsts.geom.Location.NONE=-1;jsts.geom.Location.toLocationSymbol=function(locationValue){switch(locationValue){case jsts.geom.Location.EXTERIOR:return'e';case jsts.geom.Location.BOUNDARY:return'b';case jsts.geom.Location.INTERIOR:return'i';case jsts.geom.Location.NONE:return'-';}
throw new jsts.IllegalArgumentError('Unknown location value: '+
locationValue);};(function(){var AssertionFailedException=function(message){this.message=message;};AssertionFailedException.prototype=new Error();AssertionFailedException.prototype.name='AssertionFailedException';jsts.util.AssertionFailedException=AssertionFailedException;})();(function(){var AssertionFailedException=jsts.util.AssertionFailedException;jsts.util.Assert=function(){};jsts.util.Assert.isTrue=function(assertion,message){if(!assertion){if(message===null){throw new AssertionFailedException();}else{throw new AssertionFailedException(message);}}};jsts.util.Assert.equals=function(expectedValue,actualValue,message){if(!actualValue.equals(expectedValue)){throw new AssertionFailedException('Expected '+expectedValue+' but encountered '+actualValue+
(message!=null?': '+message:''));}};jsts.util.Assert.shouldNeverReachHere=function(message){throw new AssertionFailedException('Should never reach here'+
(message!=null?': '+message:''));};})();(function(){var Location=jsts.geom.Location;var Assert=jsts.util.Assert;var ArrayList=javascript.util.ArrayList;jsts.operation.relate.RelateComputer=function(arg){this.li=new jsts.algorithm.RobustLineIntersector();this.ptLocator=new jsts.algorithm.PointLocator();this.nodes=new jsts.geomgraph.NodeMap(new jsts.operation.relate.RelateNodeFactory());this.isolatedEdges=new ArrayList();this.arg=arg;};jsts.operation.relate.RelateComputer.prototype.li=null;jsts.operation.relate.RelateComputer.prototype.ptLocator=null;jsts.operation.relate.RelateComputer.prototype.arg=null;jsts.operation.relate.RelateComputer.prototype.nodes=null;jsts.operation.relate.RelateComputer.prototype.im=null;jsts.operation.relate.RelateComputer.prototype.isolatedEdges=null;jsts.operation.relate.RelateComputer.prototype.invalidPoint=null;jsts.operation.relate.RelateComputer.prototype.computeIM=function(){var im=new jsts.geom.IntersectionMatrix();im.set(Location.EXTERIOR,Location.EXTERIOR,2);if(!this.arg[0].getGeometry().getEnvelopeInternal().intersects(this.arg[1].getGeometry().getEnvelopeInternal())){this.computeDisjointIM(im);return im;}
this.arg[0].computeSelfNodes(this.li,false);this.arg[1].computeSelfNodes(this.li,false);var intersector=this.arg[0].computeEdgeIntersections(this.arg[1],this.li,false);this.computeIntersectionNodes(0);this.computeIntersectionNodes(1);this.copyNodesAndLabels(0);this.copyNodesAndLabels(1);this.labelIsolatedNodes();this.computeProperIntersectionIM(intersector,im);var eeBuilder=new jsts.operation.relate.EdgeEndBuilder();var ee0=eeBuilder.computeEdgeEnds(this.arg[0].getEdgeIterator());this.insertEdgeEnds(ee0);var ee1=eeBuilder.computeEdgeEnds(this.arg[1].getEdgeIterator());this.insertEdgeEnds(ee1);this.labelNodeEdges();this.labelIsolatedEdges(0,1);this.labelIsolatedEdges(1,0);this.updateIM(im);return im;};jsts.operation.relate.RelateComputer.prototype.insertEdgeEnds=function(ee){for(var i=ee.iterator();i.hasNext();){var e=i.next();this.nodes.add(e);}};jsts.operation.relate.RelateComputer.prototype.computeProperIntersectionIM=function(intersector,im){var dimA=this.arg[0].getGeometry().getDimension();var dimB=this.arg[1].getGeometry().getDimension();var hasProper=intersector.hasProperIntersection();var hasProperInterior=intersector.hasProperInteriorIntersection();if(dimA===2&&dimB===2){if(hasProper)
im.setAtLeast('212101212');}
else if(dimA===2&&dimB===1){if(hasProper)
im.setAtLeast('FFF0FFFF2');if(hasProperInterior)
im.setAtLeast('1FFFFF1FF');}else if(dimA===1&&dimB===2){if(hasProper)
im.setAtLeast('F0FFFFFF2');if(hasProperInterior)
im.setAtLeast('1F1FFFFFF');}
else if(dimA===1&&dimB===1){if(hasProperInterior)
im.setAtLeast('0FFFFFFFF');}};jsts.operation.relate.RelateComputer.prototype.copyNodesAndLabels=function(argIndex){for(var i=this.arg[argIndex].getNodeIterator();i.hasNext();){var graphNode=i.next();var newNode=this.nodes.addNode(graphNode.getCoordinate());newNode.setLabel(argIndex,graphNode.getLabel().getLocation(argIndex));}};jsts.operation.relate.RelateComputer.prototype.computeIntersectionNodes=function(argIndex){for(var i=this.arg[argIndex].getEdgeIterator();i.hasNext();){var e=i.next();var eLoc=e.getLabel().getLocation(argIndex);for(var eiIt=e.getEdgeIntersectionList().iterator();eiIt.hasNext();){var ei=eiIt.next();var n=this.nodes.addNode(ei.coord);if(eLoc===Location.BOUNDARY)
n.setLabelBoundary(argIndex);else{if(n.getLabel().isNull(argIndex))
n.setLabel(argIndex,Location.INTERIOR);}}}};jsts.operation.relate.RelateComputer.prototype.labelIntersectionNodes=function(argIndex){for(var i=this.arg[argIndex].getEdgeIterator();i.hasNext();){var e=i.next();var eLoc=e.getLabel().getLocation(argIndex);for(var eiIt=e.getEdgeIntersectionList().iterator();eiIt.hasNext();){var ei=eiIt.next();var n=this.nodes.find(ei.coord);if(n.getLabel().isNull(argIndex)){if(eLoc===Location.BOUNDARY)
n.setLabelBoundary(argIndex);else
n.setLabel(argIndex,Location.INTERIOR);}}}};jsts.operation.relate.RelateComputer.prototype.computeDisjointIM=function(im){var ga=this.arg[0].getGeometry();if(!ga.isEmpty()){im.set(Location.INTERIOR,Location.EXTERIOR,ga.getDimension());im.set(Location.BOUNDARY,Location.EXTERIOR,ga.getBoundaryDimension());}
var gb=this.arg[1].getGeometry();if(!gb.isEmpty()){im.set(Location.EXTERIOR,Location.INTERIOR,gb.getDimension());im.set(Location.EXTERIOR,Location.BOUNDARY,gb.getBoundaryDimension());}};jsts.operation.relate.RelateComputer.prototype.labelNodeEdges=function(){for(var ni=this.nodes.iterator();ni.hasNext();){var node=ni.next();node.getEdges().computeLabelling(this.arg);}};jsts.operation.relate.RelateComputer.prototype.updateIM=function(im){for(var ei=this.isolatedEdges.iterator();ei.hasNext();){var e=ei.next();e.updateIM(im);}
for(var ni=this.nodes.iterator();ni.hasNext();){var node=ni.next();node.updateIM(im);node.updateIMFromEdges(im);}};jsts.operation.relate.RelateComputer.prototype.labelIsolatedEdges=function(thisIndex,targetIndex){for(var ei=this.arg[thisIndex].getEdgeIterator();ei.hasNext();){var e=ei.next();if(e.isIsolated()){this.labelIsolatedEdge(e,targetIndex,this.arg[targetIndex].getGeometry());this.isolatedEdges.add(e);}}};jsts.operation.relate.RelateComputer.prototype.labelIsolatedEdge=function(e,targetIndex,target){if(target.getDimension()>0){var loc=this.ptLocator.locate(e.getCoordinate(),target);e.getLabel().setAllLocations(targetIndex,loc);}else{e.getLabel().setAllLocations(targetIndex,Location.EXTERIOR);}};jsts.operation.relate.RelateComputer.prototype.labelIsolatedNodes=function(){for(var ni=this.nodes.iterator();ni.hasNext();){var n=ni.next();var label=n.getLabel();Assert.isTrue(label.getGeometryCount()>0,'node with empty label found');if(n.isIsolated()){if(label.isNull(0))
this.labelIsolatedNode(n,0);else
this.labelIsolatedNode(n,1);}}};jsts.operation.relate.RelateComputer.prototype.labelIsolatedNode=function(n,targetIndex){var loc=this.ptLocator.locate(n.getCoordinate(),this.arg[targetIndex].getGeometry());n.getLabel().setAllLocations(targetIndex,loc);};})();(function(){var Assert=jsts.util.Assert;jsts.geomgraph.GraphComponent=function(label){this.label=label;};jsts.geomgraph.GraphComponent.prototype.label=null;jsts.geomgraph.GraphComponent.prototype._isInResult=false;jsts.geomgraph.GraphComponent.prototype._isCovered=false;jsts.geomgraph.GraphComponent.prototype._isCoveredSet=false;jsts.geomgraph.GraphComponent.prototype._isVisited=false;jsts.geomgraph.GraphComponent.prototype.getLabel=function(){return this.label;};jsts.geomgraph.GraphComponent.prototype.setLabel=function(label){if(arguments.length===2){this.setLabel2.apply(this,arguments);return;}
this.label=label;};jsts.geomgraph.GraphComponent.prototype.setInResult=function(isInResult){this._isInResult=isInResult;};jsts.geomgraph.GraphComponent.prototype.isInResult=function(){return this._isInResult;};jsts.geomgraph.GraphComponent.prototype.setCovered=function(isCovered){this._isCovered=isCovered;this._isCoveredSet=true;};jsts.geomgraph.GraphComponent.prototype.isCovered=function(){return this._isCovered;};jsts.geomgraph.GraphComponent.prototype.isCoveredSet=function(){return this._isCoveredSet;};jsts.geomgraph.GraphComponent.prototype.isVisited=function(){return this._isVisited;};jsts.geomgraph.GraphComponent.prototype.setVisited=function(isVisited){this._isVisited=isVisited;};jsts.geomgraph.GraphComponent.prototype.getCoordinate=function(){throw new jsts.error.AbstractMethodInvocationError();};jsts.geomgraph.GraphComponent.prototype.computeIM=function(im){throw new jsts.error.AbstractMethodInvocationError();};jsts.geomgraph.GraphComponent.prototype.isIsolated=function(){throw new jsts.error.AbstractMethodInvocationError();};jsts.geomgraph.GraphComponent.prototype.updateIM=function(im){Assert.isTrue(this.label.getGeometryCount()>=2,'found partial label');this.computeIM(im);};})();jsts.geomgraph.Node=function(coord,edges){this.coord=coord;this.edges=edges;this.label=new jsts.geomgraph.Label(0,jsts.geom.Location.NONE);};jsts.geomgraph.Node.prototype=new jsts.geomgraph.GraphComponent();jsts.geomgraph.Node.prototype.coord=null;jsts.geomgraph.Node.prototype.edges=null;jsts.geomgraph.Node.prototype.isIsolated=function(){return(this.label.getGeometryCount()==1);};jsts.geomgraph.Node.prototype.setLabel2=function(argIndex,onLocation){if(this.label===null){this.label=new jsts.geomgraph.Label(argIndex,onLocation);}else
this.label.setLocation(argIndex,onLocation);};jsts.geomgraph.Node.prototype.setLabelBoundary=function(argIndex){var loc=jsts.geom.Location.NONE;if(this.label!==null)
loc=this.label.getLocation(argIndex);var newLoc;switch(loc){case jsts.geom.Location.BOUNDARY:newLoc=jsts.geom.Location.INTERIOR;break;case jsts.geom.Location.INTERIOR:newLoc=jsts.geom.Location.BOUNDARY;break;default:newLoc=jsts.geom.Location.BOUNDARY;break;}
this.label.setLocation(argIndex,newLoc);};jsts.geomgraph.Node.prototype.add=function(e){this.edges.insert(e);e.setNode(this);};jsts.geomgraph.Node.prototype.getCoordinate=function(){return this.coord;};jsts.geomgraph.Node.prototype.getEdges=function(){return this.edges;};jsts.geomgraph.Node.prototype.isIncidentEdgeInResult=function(){for(var it=this.getEdges().getEdges().iterator();it.hasNext();){var de=it.next();if(de.getEdge().isInResult())
return true;}
return false;};(function(){var EdgeRing=function(factory){this.deList=new javascript.util.ArrayList();this.factory=factory;};EdgeRing.findEdgeRingContaining=function(testEr,shellList){var testRing=testEr.getRing();var testEnv=testRing.getEnvelopeInternal();var testPt=testRing.getCoordinateN(0);var minShell=null;var minEnv=null;for(var it=shellList.iterator();it.hasNext();){var tryShell=it.next();var tryRing=tryShell.getRing();var tryEnv=tryRing.getEnvelopeInternal();if(minShell!=null)
minEnv=minShell.getRing().getEnvelopeInternal();var isContained=false;if(tryEnv.equals(testEnv))
continue;testPt=jsts.geom.CoordinateArrays.ptNotInList(testRing.getCoordinates(),tryRing.getCoordinates());if(tryEnv.contains(testEnv)&&jsts.algorithm.CGAlgorithms.isPointInRing(testPt,tryRing.getCoordinates()))
isContained=true;if(isContained){if(minShell==null||minEnv.contains(tryEnv)){minShell=tryShell;}}}
return minShell;};EdgeRing.ptNotInList=function(testPts,pts){for(var i=0;i<testPts.length;i++){var testPt=testPts[i];if(!isInList(testPt,pts))
return testPt;}
return null;};EdgeRing.isInList=function(pt,pts){for(var i=0;i<pts.length;i++){if(pt.equals(pts[i]))
return true;}
return false;}
EdgeRing.prototype.factory=null;EdgeRing.prototype.deList=null;EdgeRing.prototype.ring=null;EdgeRing.prototype.ringPts=null;EdgeRing.prototype.holes=null;EdgeRing.prototype.add=function(de){this.deList.add(de);};EdgeRing.prototype.isHole=function(){var ring=this.getRing();return jsts.algorithm.CGAlgorithms.isCCW(ring.getCoordinates());};EdgeRing.prototype.addHole=function(hole){if(this.holes==null)
this.holes=new javascript.util.ArrayList();this.holes.add(hole);};EdgeRing.prototype.getPolygon=function(){var holeLR=null;if(this.holes!=null){holeLR=[];for(var i=0;i<this.holes.size();i++){holeLR[i]=this.holes.get(i);}}
var poly=this.factory.createPolygon(this.ring,holeLR);return poly;};EdgeRing.prototype.isValid=function(){this.getCoordinates();if(this.ringPts.length<=3)
return false;this.getRing();return this.ring.isValid();};EdgeRing.prototype.getCoordinates=function(){if(this.ringPts==null){var coordList=new jsts.geom.CoordinateList();for(var i=this.deList.iterator();i.hasNext();){var de=i.next();var edge=de.getEdge();EdgeRing.addEdge(edge.getLine().getCoordinates(),de.getEdgeDirection(),coordList);}
this.ringPts=coordList.toCoordinateArray();}
return this.ringPts;};EdgeRing.prototype.getLineString=function(){this.getCoordinates();return this.factory.createLineString(this.ringPts);};EdgeRing.prototype.getRing=function(){if(this.ring!=null)
return this.ring;this.getCoordinates();if(this.ringPts.length<3)
console.log(this.ringPts);try{this.ring=this.factory.createLinearRing(this.ringPts);}catch(ex){console.log(this.ringPts);}
return this.ring;};EdgeRing.addEdge=function(coords,isForward,coordList){if(isForward){for(var i=0;i<coords.length;i++){coordList.add(coords[i],false);}}else{for(var i=coords.length-1;i>=0;i--){coordList.add(coords[i],false);}}};jsts.operation.polygonize.EdgeRing=EdgeRing;})();(function(){var GraphComponent=jsts.planargraph.GraphComponent;var Edge=function(de0,de1){if(de0===undefined){return;}
this.setDirectedEdges(de0,de1);};Edge.prototype=new GraphComponent();Edge.prototype.dirEdge=null;Edge.prototype.setDirectedEdges=function(de0,de1){this.dirEdge=[de0,de1];de0.setEdge(this);de1.setEdge(this);de0.setSym(de1);de1.setSym(de0);de0.getFromNode().addOutEdge(de0);de1.getFromNode().addOutEdge(de1);};Edge.prototype.getDirEdge=function(i){if(i instanceof jsts.planargraph.Node){this.getDirEdge2(i);}
return this.dirEdge[i];};Edge.prototype.getDirEdge2=function(fromNode){if(this.dirEdge[0].getFromNode()==fromNode)
return this.dirEdge[0];if(this.dirEdge[1].getFromNode()==fromNode)
return this.dirEdge[1];return null;};Edge.prototype.getOppositeNode=function(node){if(this.dirEdge[0].getFromNode()==node)
return this.dirEdge[0].getToNode();if(this.dirEdge[1].getFromNode()==node)
return this.dirEdge[1].getToNode();return null;};Edge.prototype.remove=function(){this.dirEdge=null;};Edge.prototype.isRemoved=function(){return dirEdge==null;};jsts.planargraph.Edge=Edge;})();jsts.operation.polygonize.PolygonizeEdge=function(line){this.line=line;};jsts.operation.polygonize.PolygonizeEdge.prototype=new jsts.planargraph.Edge();jsts.operation.polygonize.PolygonizeEdge.prototype.line=null;jsts.operation.polygonize.PolygonizeEdge.prototype.getLine=function(){return this.line;};(function(){var ArrayList=javascript.util.ArrayList;var GraphComponent=jsts.planargraph.GraphComponent;var DirectedEdge=function(from,to,directionPt,edgeDirection){if(from===undefined){return;}
this.from=from;this.to=to;this.edgeDirection=edgeDirection;this.p0=from.getCoordinate();this.p1=directionPt;var dx=this.p1.x-this.p0.x;var dy=this.p1.y-this.p0.y;this.quadrant=jsts.geomgraph.Quadrant.quadrant(dx,dy);this.angle=Math.atan2(dy,dx);};DirectedEdge.prototype=new GraphComponent();DirectedEdge.toEdges=function(dirEdges){var edges=new ArrayList();for(var i=dirEdges.iterator();i.hasNext();){edges.add((i.next()).parentEdge);}
return edges;};DirectedEdge.prototype.parentEdge=null;DirectedEdge.prototype.from=null;DirectedEdge.prototype.to=null;DirectedEdge.prototype.p0=null;DirectedEdge.prototype.p1=null;DirectedEdge.prototype.sym=null;DirectedEdge.prototype.edgeDirection=null;DirectedEdge.prototype.quadrant=null;DirectedEdge.prototype.angle=null;DirectedEdge.prototype.getEdge=function(){return this.parentEdge;};DirectedEdge.prototype.setEdge=function(parentEdge){this.parentEdge=parentEdge;};DirectedEdge.prototype.getQuadrant=function(){return this.quadrant;};DirectedEdge.prototype.getDirectionPt=function(){return this.p1;};DirectedEdge.prototype.getEdgeDirection=function(){return this.edgeDirection;};DirectedEdge.prototype.getFromNode=function(){return this.from;};DirectedEdge.prototype.getToNode=function(){return this.to;};DirectedEdge.prototype.getCoordinate=function(){return this.from.getCoordinate();};DirectedEdge.prototype.getAngle=function(){return this.angle;};DirectedEdge.prototype.getSym=function(){return this.sym;};DirectedEdge.prototype.setSym=function(sym){this.sym=sym;};DirectedEdge.prototype.remove=function(){this.sym=null;this.parentEdge=null;};DirectedEdge.prototype.isRemoved=function(){return this.parentEdge==null;};DirectedEdge.prototype.compareTo=function(obj){var de=obj;return this.compareDirection(de);};DirectedEdge.prototype.compareDirection=function(e){if(this.quadrant>e.quadrant)
return 1;if(this.quadrant<e.quadrant)
return-1;return jsts.algorithm.CGAlgorithms.computeOrientation(e.p0,e.p1,this.p1);};jsts.planargraph.DirectedEdge=DirectedEdge;})();(function(){var DirectedEdge=jsts.planargraph.DirectedEdge;var PolygonizeDirectedEdge=function(from,to,directionPt,edgeDirection){DirectedEdge.apply(this,arguments);};PolygonizeDirectedEdge.prototype=new DirectedEdge();PolygonizeDirectedEdge.prototype.edgeRing=null;PolygonizeDirectedEdge.prototype.next=null;PolygonizeDirectedEdge.prototype.label=-1;PolygonizeDirectedEdge.prototype.getLabel=function(){return this.label;};PolygonizeDirectedEdge.prototype.setLabel=function(label){this.label=label;};PolygonizeDirectedEdge.prototype.getNext=function(){return this.next;};PolygonizeDirectedEdge.prototype.setNext=function(next){this.next=next;};PolygonizeDirectedEdge.prototype.isInRing=function(){return this.edgeRing!=null;};PolygonizeDirectedEdge.prototype.setRing=function(edgeRing){this.edgeRing=edgeRing;};jsts.operation.polygonize.PolygonizeDirectedEdge=PolygonizeDirectedEdge;})();(function(){var NodeMap=function(){this.nodeMap=new javascript.util.TreeMap();};NodeMap.prototype.nodeMap=null;NodeMap.prototype.add=function(n){this.nodeMap.put(n.getCoordinate(),n);return n;};NodeMap.prototype.remove=function(pt){return this.nodeMap.remove(pt);};NodeMap.prototype.find=function(coord){return this.nodeMap.get(coord);};NodeMap.prototype.iterator=function(){return this.nodeMap.values().iterator();};NodeMap.prototype.values=function(){return this.nodeMap.values();};jsts.planargraph.NodeMap=NodeMap;})();(function(){var ArrayList=javascript.util.ArrayList;var PlanarGraph=function(){this.edges=new javascript.util.HashSet();this.dirEdges=new javascript.util.HashSet();this.nodeMap=new jsts.planargraph.NodeMap();};PlanarGraph.prototype.edges=null;PlanarGraph.prototype.dirEdges=null;PlanarGraph.prototype.nodeMap=null;PlanarGraph.prototype.findNode=function(pt){return this.nodeMap.find(pt);};PlanarGraph.prototype.add=function(node){if(node instanceof jsts.planargraph.Edge){return this.add2(node);}else if(node instanceof jsts.planargraph.DirectedEdge){return this.add3(node);}
this.nodeMap.add(node);};PlanarGraph.prototype.add2=function(edge){this.edges.add(edge);this.add(edge.getDirEdge(0));this.add(edge.getDirEdge(1));};PlanarGraph.prototype.add3=function(dirEdge){this.dirEdges.add(dirEdge);};PlanarGraph.prototype.nodeIterator=function(){return this.nodeMap.iterator();};PlanarGraph.prototype.contains=function(e){if(e instanceof jsts.planargraph.DirectedEdge){return this.contains2(e);}
return this.edges.contains(e);};PlanarGraph.prototype.contains2=function(de){return this.dirEdges.contains(de);};PlanarGraph.prototype.getNodes=function(){return this.nodeMap.values();};PlanarGraph.prototype.dirEdgeIterator=function(){return this.dirEdges.iterator();};PlanarGraph.prototype.edgeIterator=function(){return this.edges.iterator();};PlanarGraph.prototype.getEdges=function(){return this.edges;};PlanarGraph.prototype.remove=function(edge){if(edge instanceof jsts.planargraph.DirectedEdge){return this.remove2(edge);}
this.remove(edge.getDirEdge(0));this.remove(edge.getDirEdge(1));this.edges.remove(edge);this.edge.remove();};PlanarGraph.prototype.remove2=function(de){if(de instanceof jsts.planargraph.Node){return this.remove3(de);}
var sym=de.getSym();if(sym!=null)
sym.setSym(null);de.getFromNode().remove(de);de.remove();this.dirEdges.remove(de);};PlanarGraph.prototype.remove3=function(node){var outEdges=node.getOutEdges().getEdges();for(var i=outEdges.iterator();i.hasNext();){var de=i.next();var sym=de.getSym();if(sym!=null)
this.remove(sym);this.dirEdges.remove(de);var edge=de.getEdge();if(edge!=null){this.edges.remove(edge);}}
this.nodeMap.remove(node.getCoordinate());node.remove();};PlanarGraph.prototype.findNodesOfDegree=function(degree){var nodesFound=new ArrayList();for(var i=this.nodeIterator();i.hasNext();){var node=i.next();if(node.getDegree()==degree)
nodesFound.add(node);}
return nodesFound;};jsts.planargraph.PlanarGraph=PlanarGraph;})();(function(){var ArrayList=javascript.util.ArrayList;var Stack=javascript.util.Stack;var HashSet=javascript.util.HashSet;var Assert=jsts.util.Assert;var EdgeRing=jsts.operation.polygonize.EdgeRing;var PolygonizeEdge=jsts.operation.polygonize.PolygonizeEdge;var PolygonizeDirectedEdge=jsts.operation.polygonize.PolygonizeDirectedEdge;var PlanarGraph=jsts.planargraph.PlanarGraph;var Node=jsts.planargraph.Node;var PolygonizeGraph=function(factory){PlanarGraph.apply(this);this.factory=factory;};PolygonizeGraph.prototype=new PlanarGraph();PolygonizeGraph.getDegreeNonDeleted=function(node){var edges=node.getOutEdges().getEdges();var degree=0;for(var i=edges.iterator();i.hasNext();){var de=i.next();if(!de.isMarked())
degree++;}
return degree;};PolygonizeGraph.getDegree=function(node,label){var edges=node.getOutEdges().getEdges();var degree=0;for(var i=edges.iterator();i.hasNext();){var de=i.next();if(de.getLabel()==label)
degree++;}
return degree;};PolygonizeGraph.deleteAllEdges=function(node){var edges=node.getOutEdges().getEdges();for(var i=edges.iterator();i.hasNext();){var de=i.next();de.setMarked(true);var sym=de.getSym();if(sym!=null)
sym.setMarked(true);}};PolygonizeGraph.prototype.factory=null;PolygonizeGraph.prototype.addEdge=function(line){if(line.isEmpty()){return;}
var linePts=jsts.geom.CoordinateArrays.removeRepeatedPoints(line.getCoordinates());if(linePts.length<2){return;}
var startPt=linePts[0];var endPt=linePts[linePts.length-1];var nStart=this.getNode(startPt);var nEnd=this.getNode(endPt);var de0=new PolygonizeDirectedEdge(nStart,nEnd,linePts[1],true);var de1=new PolygonizeDirectedEdge(nEnd,nStart,linePts[linePts.length-2],false);var edge=new PolygonizeEdge(line);edge.setDirectedEdges(de0,de1);this.add(edge);};PolygonizeGraph.prototype.getNode=function(pt){var node=this.findNode(pt);if(node==null){node=new Node(pt);this.add(node);}
return node;};PolygonizeGraph.prototype.computeNextCWEdges=function(){for(var iNode=this.nodeIterator();iNode.hasNext();){var node=iNode.next();PolygonizeGraph.computeNextCWEdges(node);}};PolygonizeGraph.prototype.convertMaximalToMinimalEdgeRings=function(ringEdges){for(var i=ringEdges.iterator();i.hasNext();){var de=i.next();var label=de.getLabel();var intNodes=PolygonizeGraph.findIntersectionNodes(de,label);if(intNodes==null)
continue;for(var iNode=intNodes.iterator();iNode.hasNext();){var node=iNode.next();PolygonizeGraph.computeNextCCWEdges(node,label);}}};PolygonizeGraph.findIntersectionNodes=function(startDE,label){var de=startDE;var intNodes=null;do{var node=de.getFromNode();if(PolygonizeGraph.getDegree(node,label)>1){if(intNodes==null)
intNodes=new ArrayList();intNodes.add(node);}
de=de.getNext();Assert.isTrue(de!=null,'found null DE in ring');Assert.isTrue(de==startDE||!de.isInRing(),'found DE already in ring');}while(de!=startDE);return intNodes;};PolygonizeGraph.prototype.getEdgeRings=function(){this.computeNextCWEdges();PolygonizeGraph.label(this.dirEdges,-1);var maximalRings=PolygonizeGraph.findLabeledEdgeRings(this.dirEdges);this.convertMaximalToMinimalEdgeRings(maximalRings);var edgeRingList=new ArrayList();for(var i=this.dirEdges.iterator();i.hasNext();){var de=i.next();if(de.isMarked())
continue;if(de.isInRing())
continue;var er=this.findEdgeRing(de);edgeRingList.add(er);}
return edgeRingList;};PolygonizeGraph.findLabeledEdgeRings=function(dirEdges){var edgeRingStarts=new ArrayList();var currLabel=1;for(var i=dirEdges.iterator();i.hasNext();){var de=i.next();if(de.isMarked())
continue;if(de.getLabel()>=0)
continue;edgeRingStarts.add(de);var edges=PolygonizeGraph.findDirEdgesInRing(de);PolygonizeGraph.label(edges,currLabel);currLabel++;}
return edgeRingStarts;};PolygonizeGraph.prototype.deleteCutEdges=function(){this.computeNextCWEdges();PolygonizeGraph.findLabeledEdgeRings(this.dirEdges);var cutLines=new ArrayList();for(var i=this.dirEdges.iterator();i.hasNext();){var de=i.next();if(de.isMarked())
continue;var sym=de.getSym();if(de.getLabel()==sym.getLabel()){de.setMarked(true);sym.setMarked(true);var e=de.getEdge();cutLines.add(e.getLine());}}
return cutLines;};PolygonizeGraph.label=function(dirEdges,label){for(var i=dirEdges.iterator();i.hasNext();){var de=i.next();de.setLabel(label);}};PolygonizeGraph.computeNextCWEdges=function(node){var deStar=node.getOutEdges();var startDE=null;var prevDE=null;for(var i=deStar.getEdges().iterator();i.hasNext();){var outDE=i.next();if(outDE.isMarked())
continue;if(startDE==null)
startDE=outDE;if(prevDE!=null){var sym=prevDE.getSym();sym.setNext(outDE);}
prevDE=outDE;}
if(prevDE!=null){var sym=prevDE.getSym();sym.setNext(startDE);}};PolygonizeGraph.computeNextCCWEdges=function(node,label){var deStar=node.getOutEdges();var firstOutDE=null;var prevInDE=null;var edges=deStar.getEdges();for(var i=edges.size()-1;i>=0;i--){var de=edges.get(i);var sym=de.getSym();var outDE=null;if(de.getLabel()==label)
outDE=de;var inDE=null;if(sym.getLabel()==label)
inDE=sym;if(outDE==null&&inDE==null)
continue;if(inDE!=null){prevInDE=inDE;}
if(outDE!=null){if(prevInDE!=null){prevInDE.setNext(outDE);prevInDE=null;}
if(firstOutDE==null)
firstOutDE=outDE;}}
if(prevInDE!=null){Assert.isTrue(firstOutDE!=null);prevInDE.setNext(firstOutDE);}};PolygonizeGraph.findDirEdgesInRing=function(startDE){var de=startDE;var edges=new ArrayList();do{edges.add(de);de=de.getNext();Assert.isTrue(de!=null,'found null DE in ring');Assert.isTrue(de==startDE||!de.isInRing(),'found DE already in ring');}while(de!=startDE);return edges;};PolygonizeGraph.prototype.findEdgeRing=function(startDE){var de=startDE;var er=new EdgeRing(this.factory);do{er.add(de);de.setRing(er);de=de.getNext();Assert.isTrue(de!=null,'found null DE in ring');Assert.isTrue(de==startDE||!de.isInRing(),'found DE already in ring');}while(de!=startDE);return er;};PolygonizeGraph.prototype.deleteDangles=function(){var nodesToRemove=this.findNodesOfDegree(1);var dangleLines=new HashSet();var nodeStack=new Stack();for(var i=nodesToRemove.iterator();i.hasNext();){nodeStack.push(i.next());}
while(!nodeStack.isEmpty()){var node=nodeStack.pop();PolygonizeGraph.deleteAllEdges(node);var nodeOutEdges=node.getOutEdges().getEdges();for(var i=nodeOutEdges.iterator();i.hasNext();){var de=i.next();de.setMarked(true);var sym=de.getSym();if(sym!=null)
sym.setMarked(true);var e=de.getEdge();dangleLines.add(e.getLine());var toNode=de.getToNode();if(PolygonizeGraph.getDegreeNonDeleted(toNode)==1)
nodeStack.push(toNode);}}
return dangleLines;};PolygonizeGraph.prototype.computeDepthParity=function(){while(true){var de=null;if(de==null)
return;this.computeDepthParity(de);}};PolygonizeGraph.prototype.computeDepthParity=function(de){};jsts.operation.polygonize.PolygonizeGraph=PolygonizeGraph;})();jsts.index.strtree.Interval=function(){var other;if(arguments.length===1){other=arguments[0];return jsts.index.strtree.Interval(other.min,other.max);}else if(arguments.length===2){jsts.util.Assert.isTrue(this.min<=this.max);this.min=arguments[0];this.max=arguments[1];}};jsts.index.strtree.Interval.prototype.min=null;jsts.index.strtree.Interval.prototype.max=null;jsts.index.strtree.Interval.prototype.getCentre=function(){return(this.min+this.max)/2;};jsts.index.strtree.Interval.prototype.expandToInclude=function(other){this.max=Math.max(this.max,other.max);this.min=Math.min(this.min,other.min);return this;};jsts.index.strtree.Interval.prototype.intersects=function(other){return!(other.min>this.max||other.max<this.min);};jsts.index.strtree.Interval.prototype.equals=function(o){if(!(o instanceof jsts.index.strtree.Interval)){return false;}
other=o;return this.min===other.min&&this.max===other.max;};jsts.geom.GeometryFactory=function(precisionModel){this.precisionModel=precisionModel||new jsts.geom.PrecisionModel();};jsts.geom.GeometryFactory.prototype.precisionModel=null;jsts.geom.GeometryFactory.prototype.getPrecisionModel=function(){return this.precisionModel;};jsts.geom.GeometryFactory.prototype.createPoint=function(coordinate){var point=new jsts.geom.Point(coordinate,this);return point;};jsts.geom.GeometryFactory.prototype.createLineString=function(coordinates){var lineString=new jsts.geom.LineString(coordinates,this);return lineString;};jsts.geom.GeometryFactory.prototype.createLinearRing=function(coordinates){var linearRing=new jsts.geom.LinearRing(coordinates,this);return linearRing;};jsts.geom.GeometryFactory.prototype.createPolygon=function(shell,holes){var polygon=new jsts.geom.Polygon(shell,holes,this);return polygon;};jsts.geom.GeometryFactory.prototype.createMultiPoint=function(points){if(points&&points[0]instanceof jsts.geom.Coordinate){var converted=[];var i;for(i=0;i<points.length;i++){converted.push(this.createPoint(points[i]));}
points=converted;}
return new jsts.geom.MultiPoint(points,this);};jsts.geom.GeometryFactory.prototype.createMultiLineString=function(lineStrings){return new jsts.geom.MultiLineString(lineStrings,this);};jsts.geom.GeometryFactory.prototype.createMultiPolygon=function(polygons){return new jsts.geom.MultiPolygon(polygons,this);};jsts.geom.GeometryFactory.prototype.buildGeometry=function(geomList){var geomClass=null;var isHeterogeneous=false;var hasGeometryCollection=false;for(var i=geomList.iterator();i.hasNext();){var geom=i.next();var partClass=geom.CLASS_NAME;if(geomClass===null){geomClass=partClass;}
if(!(partClass===geomClass)){isHeterogeneous=true;}
if(geom.isGeometryCollectionBase())
hasGeometryCollection=true;}
if(geomClass===null){return this.createGeometryCollection(null);}
if(isHeterogeneous||hasGeometryCollection){return this.createGeometryCollection(geomList.toArray());}
var geom0=geomList.get(0);var isCollection=geomList.size()>1;if(isCollection){if(geom0 instanceof jsts.geom.Polygon){return this.createMultiPolygon(geomList.toArray());}else if(geom0 instanceof jsts.geom.LineString){return this.createMultiLineString(geomList.toArray());}else if(geom0 instanceof jsts.geom.Point){return this.createMultiPoint(geomList.toArray());}
jsts.util.Assert.shouldNeverReachHere('Unhandled class: '+geom0);}
return geom0;};jsts.geom.GeometryFactory.prototype.createGeometryCollection=function(geometries){return new jsts.geom.GeometryCollection(geometries,this);};jsts.geom.GeometryFactory.prototype.toGeometry=function(envelope){if(envelope.isNull()){return this.createPoint(null);}
if(envelope.getMinX()===envelope.getMaxX()&&envelope.getMinY()===envelope.getMaxY()){return this.createPoint(new jsts.geom.Coordinate(envelope.getMinX(),envelope.getMinY()));}
if(envelope.getMinX()===envelope.getMaxX()||envelope.getMinY()===envelope.getMaxY()){return this.createLineString([new jsts.geom.Coordinate(envelope.getMinX(),envelope.getMinY()),new jsts.geom.Coordinate(envelope.getMaxX(),envelope.getMaxY())]);}
return this.createPolygon(this.createLinearRing([new jsts.geom.Coordinate(envelope.getMinX(),envelope.getMinY()),new jsts.geom.Coordinate(envelope.getMinX(),envelope.getMaxY()),new jsts.geom.Coordinate(envelope.getMaxX(),envelope.getMaxY()),new jsts.geom.Coordinate(envelope.getMaxX(),envelope.getMinY()),new jsts.geom.Coordinate(envelope.getMinX(),envelope.getMinY())]),null);};jsts.geomgraph.NodeFactory=function(){};jsts.geomgraph.NodeFactory.prototype.createNode=function(coord){return new jsts.geomgraph.Node(coord,null);};(function(){jsts.geomgraph.Position=function(){};jsts.geomgraph.Position.ON=0;jsts.geomgraph.Position.LEFT=1;jsts.geomgraph.Position.RIGHT=2;jsts.geomgraph.Position.opposite=function(position){if(position===jsts.geomgraph.Position.LEFT){return jsts.geomgraph.Position.RIGHT;}
if(position===jsts.geomgraph.Position.RIGHT){return jsts.geomgraph.Position.LEFT;}
return position;};})();jsts.geomgraph.TopologyLocation=function(){this.location=[];if(arguments.length===3){var on=arguments[0];var left=arguments[1];var right=arguments[2];this.init(3);this.location[jsts.geomgraph.Position.ON]=on;this.location[jsts.geomgraph.Position.LEFT]=left;this.location[jsts.geomgraph.Position.RIGHT]=right;}else if(arguments[0]instanceof jsts.geomgraph.TopologyLocation){var gl=arguments[0];this.init(gl.location.length);if(gl!=null){for(var i=0;i<this.location.length;i++){this.location[i]=gl.location[i];}}}else if(typeof arguments[0]==='number'){var on=arguments[0];this.init(1);this.location[jsts.geomgraph.Position.ON]=on;}else if(arguments[0]instanceof Array){var location=arguments[0];this.init(location.length);}};jsts.geomgraph.TopologyLocation.prototype.location=null;jsts.geomgraph.TopologyLocation.prototype.init=function(size){this.location[size-1]=null;this.setAllLocations(jsts.geom.Location.NONE);};jsts.geomgraph.TopologyLocation.prototype.get=function(posIndex){if(posIndex<this.location.length)
return this.location[posIndex];return jsts.geom.Location.NONE;};jsts.geomgraph.TopologyLocation.prototype.isNull=function(){for(var i=0;i<this.location.length;i++){if(this.location[i]!==jsts.geom.Location.NONE)
return false;}
return true;};jsts.geomgraph.TopologyLocation.prototype.isAnyNull=function(){for(var i=0;i<this.location.length;i++){if(this.location[i]===jsts.geom.Location.NONE)
return true;}
return false;};jsts.geomgraph.TopologyLocation.prototype.isEqualOnSide=function(le,locIndex){return this.location[locIndex]==le.location[locIndex];};jsts.geomgraph.TopologyLocation.prototype.isArea=function(){return this.location.length>1;};jsts.geomgraph.TopologyLocation.prototype.isLine=function(){return this.location.length===1;};jsts.geomgraph.TopologyLocation.prototype.flip=function(){if(this.location.length<=1)
return;var temp=this.location[jsts.geomgraph.Position.LEFT];this.location[jsts.geomgraph.Position.LEFT]=this.location[jsts.geomgraph.Position.RIGHT];this.location[jsts.geomgraph.Position.RIGHT]=temp;};jsts.geomgraph.TopologyLocation.prototype.setAllLocations=function(locValue){for(var i=0;i<this.location.length;i++){this.location[i]=locValue;}};jsts.geomgraph.TopologyLocation.prototype.setAllLocationsIfNull=function(locValue){for(var i=0;i<this.location.length;i++){if(this.location[i]===jsts.geom.Location.NONE)
this.location[i]=locValue;}};jsts.geomgraph.TopologyLocation.prototype.setLocation=function(locIndex,locValue){if(locValue!==undefined){this.location[locIndex]=locValue;}else{this.setLocation(jsts.geomgraph.Position.ON,locIndex);}};jsts.geomgraph.TopologyLocation.prototype.getLocations=function(){return location;};jsts.geomgraph.TopologyLocation.prototype.setLocations=function(on,left,right){this.location[jsts.geomgraph.Position.ON]=on;this.location[jsts.geomgraph.Position.LEFT]=left;this.location[jsts.geomgraph.Position.RIGHT]=right;};jsts.geomgraph.TopologyLocation.prototype.allPositionsEqual=function(loc){for(var i=0;i<this.location.length;i++){if(this.location[i]!==loc)
return false;}
return true;};jsts.geomgraph.TopologyLocation.prototype.merge=function(gl){if(gl.location.length>this.location.length){var newLoc=[];newLoc[jsts.geomgraph.Position.ON]=this.location[jsts.geomgraph.Position.ON];newLoc[jsts.geomgraph.Position.LEFT]=jsts.geom.Location.NONE;newLoc[jsts.geomgraph.Position.RIGHT]=jsts.geom.Location.NONE;this.location=newLoc;}
for(var i=0;i<this.location.length;i++){if(this.location[i]===jsts.geom.Location.NONE&&i<gl.location.length)
this.location[i]=gl.location[i];}};jsts.geomgraph.Label=function(){this.elt=[];var geomIndex,onLoc,leftLoc,lbl,rightLoc;if(arguments.length===4){geomIndex=arguments[0];onLoc=arguments[1];leftLoc=arguments[2];rightLoc=arguments[3];this.elt[0]=new jsts.geomgraph.TopologyLocation(jsts.geom.Location.NONE,jsts.geom.Location.NONE,jsts.geom.Location.NONE);this.elt[1]=new jsts.geomgraph.TopologyLocation(jsts.geom.Location.NONE,jsts.geom.Location.NONE,jsts.geom.Location.NONE);this.elt[geomIndex].setLocations(onLoc,leftLoc,rightLoc);}else if(arguments.length===3){onLoc=arguments[0];leftLoc=arguments[1];rightLoc=arguments[2];this.elt[0]=new jsts.geomgraph.TopologyLocation(onLoc,leftLoc,rightLoc);this.elt[1]=new jsts.geomgraph.TopologyLocation(onLoc,leftLoc,rightLoc);}else if(arguments.length===2){geomIndex=arguments[0];onLoc=arguments[1];this.elt[0]=new jsts.geomgraph.TopologyLocation(jsts.geom.Location.NONE);this.elt[1]=new jsts.geomgraph.TopologyLocation(jsts.geom.Location.NONE);this.elt[geomIndex].setLocation(onLoc);}else if(arguments[0]instanceof jsts.geomgraph.Label){lbl=arguments[0];this.elt[0]=new jsts.geomgraph.TopologyLocation(lbl.elt[0]);this.elt[1]=new jsts.geomgraph.TopologyLocation(lbl.elt[1]);}else if(typeof arguments[0]==='number'){onLoc=arguments[0];this.elt[0]=new jsts.geomgraph.TopologyLocation(onLoc);this.elt[1]=new jsts.geomgraph.TopologyLocation(onLoc);}};jsts.geomgraph.Label.toLineLabel=function(label){var i,lineLabel=new jsts.geomgraph.Label(jsts.geom.Location.NONE);for(i=0;i<2;i++){lineLabel.setLocation(i,label.getLocation(i));}
return lineLabel;};jsts.geomgraph.Label.prototype.elt=null;jsts.geomgraph.Label.prototype.flip=function(){this.elt[0].flip();this.elt[1].flip();};jsts.geomgraph.Label.prototype.getLocation=function(geomIndex,posIndex){if(arguments.length==1){return this.getLocation2.apply(this,arguments);}
return this.elt[geomIndex].get(posIndex);};jsts.geomgraph.Label.prototype.getLocation2=function(geomIndex){return this.elt[geomIndex].get(jsts.geomgraph.Position.ON);};jsts.geomgraph.Label.prototype.setLocation=function(geomIndex,posIndex,location){if(arguments.length==2){this.setLocation2.apply(this,arguments);return;}
this.elt[geomIndex].setLocation(posIndex,location);};jsts.geomgraph.Label.prototype.setLocation2=function(geomIndex,location){this.elt[geomIndex].setLocation(jsts.geomgraph.Position.ON,location);};jsts.geomgraph.Label.prototype.setAllLocations=function(geomIndex,location){this.elt[geomIndex].setAllLocations(location);};jsts.geomgraph.Label.prototype.setAllLocationsIfNull=function(geomIndex,location){if(arguments.length==1){this.setAllLocationsIfNull2.apply(this,arguments);return;}
this.elt[geomIndex].setAllLocationsIfNull(location);};jsts.geomgraph.Label.prototype.setAllLocationsIfNull2=function(location){this.setAllLocationsIfNull(0,location);this.setAllLocationsIfNull(1,location);};jsts.geomgraph.Label.prototype.merge=function(lbl){var i;for(i=0;i<2;i++){if(this.elt[i]===null&&lbl.elt[i]!==null){this.elt[i]=new jsts.geomgraph.TopologyLocation(lbl.elt[i]);}else{this.elt[i].merge(lbl.elt[i]);}}};jsts.geomgraph.Label.prototype.getGeometryCount=function(){var count=0;if(!this.elt[0].isNull()){count++;}
if(!this.elt[1].isNull()){count++;}
return count;};jsts.geomgraph.Label.prototype.isNull=function(geomIndex){return this.elt[geomIndex].isNull();};jsts.geomgraph.Label.prototype.isAnyNull=function(geomIndex){return this.elt[geomIndex].isAnyNull();};jsts.geomgraph.Label.prototype.isArea=function(){if(arguments.length==1){return this.isArea2(arguments[0]);}
return this.elt[0].isArea()||this.elt[1].isArea();};jsts.geomgraph.Label.prototype.isArea2=function(geomIndex){return this.elt[geomIndex].isArea();};jsts.geomgraph.Label.prototype.isLine=function(geomIndex){return this.elt[geomIndex].isLine();};jsts.geomgraph.Label.prototype.isEqualOnSide=function(lbl,side){return this.elt[0].isEqualOnSide(lbl.elt[0],side)&&this.elt[1].isEqualOnSide(lbl.elt[1],side);};jsts.geomgraph.Label.prototype.allPositionsEqual=function(geomIndex,loc){return this.elt[geomIndex].allPositionsEqual(loc);};jsts.geomgraph.Label.prototype.toLine=function(geomIndex){if(this.elt[geomIndex].isArea()){this.elt[geomIndex]=new jsts.geomgraph.TopologyLocation(this.elt[geomIndex].location[0]);}};jsts.geomgraph.EdgeRing=function(start,geometryFactory){this.edges=[];this.pts=[];this.holes=[];this.label=new jsts.geomgraph.Label(jsts.geom.Location.NONE);this.geometryFactory=geometryFactory;if(start){this.computePoints(start);this.computeRing();}};jsts.geomgraph.EdgeRing.prototype.startDe=null;jsts.geomgraph.EdgeRing.prototype.maxNodeDegree=-1;jsts.geomgraph.EdgeRing.prototype.edges=null;jsts.geomgraph.EdgeRing.prototype.pts=null;jsts.geomgraph.EdgeRing.prototype.label=null;jsts.geomgraph.EdgeRing.prototype.ring=null;jsts.geomgraph.EdgeRing.prototype._isHole=null;jsts.geomgraph.EdgeRing.prototype.shell=null;jsts.geomgraph.EdgeRing.prototype.holes=null;jsts.geomgraph.EdgeRing.prototype.geometryFactory=null;jsts.geomgraph.EdgeRing.prototype.isIsolated=function(){return(this.label.getGeometryCount()==1);};jsts.geomgraph.EdgeRing.prototype.isHole=function(){return this._isHole;};jsts.geomgraph.EdgeRing.prototype.getCoordinate=function(i){return this.pts[i];};jsts.geomgraph.EdgeRing.prototype.getLinearRing=function(){return this.ring;};jsts.geomgraph.EdgeRing.prototype.getLabel=function(){return this.label;};jsts.geomgraph.EdgeRing.prototype.isShell=function(){return this.shell===null;};jsts.geomgraph.EdgeRing.prototype.getShell=function(){return this.shell;};jsts.geomgraph.EdgeRing.prototype.setShell=function(shell){this.shell=shell;if(shell!==null)
shell.addHole(this);};jsts.geomgraph.EdgeRing.prototype.addHole=function(ring){this.holes.push(ring);};jsts.geomgraph.EdgeRing.prototype.toPolygon=function(geometryFactory){var holeLR=[];for(var i=0;i<this.holes.length;i++){holeLR[i]=this.holes[i].getLinearRing();}
var poly=this.geometryFactory.createPolygon(this.getLinearRing(),holeLR);return poly;};jsts.geomgraph.EdgeRing.prototype.computeRing=function(){if(this.ring!==null)
return;var coord=[];for(var i=0;i<this.pts.length;i++){coord[i]=this.pts[i];}
this.ring=this.geometryFactory.createLinearRing(coord);this._isHole=jsts.algorithm.CGAlgorithms.isCCW(this.ring.getCoordinates());};jsts.geomgraph.EdgeRing.prototype.getNext=function(de){throw new jsts.error.AbstractInvocationError();};jsts.geomgraph.EdgeRing.prototype.setEdgeRing=function(de,er){throw new jsts.error.AbstractInvocationError();};jsts.geomgraph.EdgeRing.prototype.getEdges=function(){return this.edges;};jsts.geomgraph.EdgeRing.prototype.computePoints=function(start){this.startDe=start;var de=start;var isFirstEdge=true;do{if(de===null)
throw new jsts.error.TopologyError('Found null DirectedEdge');if(de.getEdgeRing()===this)
throw new jsts.error.TopologyError('Directed Edge visited twice during ring-building at '+
de.getCoordinate());this.edges.push(de);var label=de.getLabel();jsts.util.Assert.isTrue(label.isArea());this.mergeLabel(label);this.addPoints(de.getEdge(),de.isForward(),isFirstEdge);isFirstEdge=false;this.setEdgeRing(de,this);de=this.getNext(de);}while(de!==this.startDe);};jsts.geomgraph.EdgeRing.prototype.getMaxNodeDegree=function(){if(this.maxNodeDegree<0)
this.computeMaxNodeDegree();return this.maxNodeDegree;};jsts.geomgraph.EdgeRing.prototype.computeMaxNodeDegree=function(){this.maxNodeDegree=0;var de=this.startDe;do{var node=de.getNode();var degree=node.getEdges().getOutgoingDegree(this);if(degree>this.maxNodeDegree)
this.maxNodeDegree=degree;de=this.getNext(de);}while(de!==this.startDe);this.maxNodeDegree*=2;};jsts.geomgraph.EdgeRing.prototype.setInResult=function(){var de=this.startDe;do{de.getEdge().setInResult(true);de=de.getNext();}while(de!=this.startDe);};jsts.geomgraph.EdgeRing.prototype.mergeLabel=function(deLabel){this.mergeLabel2(deLabel,0);this.mergeLabel2(deLabel,1);};jsts.geomgraph.EdgeRing.prototype.mergeLabel2=function(deLabel,geomIndex){var loc=deLabel.getLocation(geomIndex,jsts.geomgraph.Position.RIGHT);if(loc==jsts.geom.Location.NONE)
return;if(this.label.getLocation(geomIndex)===jsts.geom.Location.NONE){this.label.setLocation(geomIndex,loc);return;}};jsts.geomgraph.EdgeRing.prototype.addPoints=function(edge,isForward,isFirstEdge){var edgePts=edge.getCoordinates();if(isForward){var startIndex=1;if(isFirstEdge)
startIndex=0;for(var i=startIndex;i<edgePts.length;i++){this.pts.push(edgePts[i]);}}else{var startIndex=edgePts.length-2;if(isFirstEdge)
startIndex=edgePts.length-1;for(var i=startIndex;i>=0;i--){this.pts.push(edgePts[i]);}}};jsts.geomgraph.EdgeRing.prototype.containsPoint=function(p){var shell=this.getLinearRing();var env=shell.getEnvelopeInternal();if(!env.contains(p))
return false;if(!jsts.algorithm.CGAlgorithms.isPointInRing(p,shell.getCoordinates()))
return false;for(var i=0;i<this.holes.length;i++){var hole=this.holes[i];if(hole.containsPoint(p))
return false;}
return true;};jsts.geom.Dimension=function(){};jsts.geom.Dimension.P=0;jsts.geom.Dimension.L=1;jsts.geom.Dimension.A=2;jsts.geom.Dimension.FALSE=-1;jsts.geom.Dimension.TRUE=-2;jsts.geom.Dimension.DONTCARE=-3;jsts.geom.Dimension.toDimensionSymbol=function(dimensionValue){switch(dimensionValue){case jsts.geom.Dimension.FALSE:return'F';case jsts.geom.Dimension.TRUE:return'T';case jsts.geom.Dimension.DONTCARE:return'*';case jsts.geom.Dimension.P:return'0';case jsts.geom.Dimension.L:return'1';case jsts.geom.Dimension.A:return'2';}
throw new jsts.IllegalArgumentError('Unknown dimension value: '+
dimensionValue);};jsts.geom.Dimension.toDimensionValue=function(dimensionSymbol){switch(dimensionSymbol.toUpperCase()){case'F':return jsts.geom.Dimension.FALSE;case'T':return jsts.geom.Dimension.TRUE;case'*':return jsts.geom.Dimension.DONTCARE;case'0':return jsts.geom.Dimension.P;case'1':return jsts.geom.Dimension.L;case'2':return jsts.geom.Dimension.A;}
throw new jsts.error.IllegalArgumentError('Unknown dimension symbol: '+
dimensionSymbol);};(function(){var Dimension=jsts.geom.Dimension;jsts.geom.LineString=function(points,factory){this.factory=factory;this.points=points||[];};jsts.geom.LineString.prototype=new jsts.geom.Geometry();jsts.geom.LineString.constructor=jsts.geom.LineString;jsts.geom.LineString.prototype.points=null;jsts.geom.LineString.prototype.getCoordinates=function(){return this.points;};jsts.geom.LineString.prototype.getCoordinateSequence=function(){return this.points;};jsts.geom.LineString.prototype.getCoordinateN=function(n){return this.points[n];};jsts.geom.LineString.prototype.getCoordinate=function(){if(this.isEmpty()){return null;}
return this.getCoordinateN(0);};jsts.geom.LineString.prototype.getDimension=function(){return 1;};jsts.geom.LineString.prototype.getBoundaryDimension=function(){if(this.isClosed()){return Dimension.FALSE;}
return 0;};jsts.geom.LineString.prototype.isEmpty=function(){return this.points.length===0;};jsts.geom.LineString.prototype.getNumPoints=function(){return this.points.length;};jsts.geom.LineString.prototype.getPointN=function(n){return this.getFactory().createPoint(this.points[n]);};jsts.geom.LineString.prototype.getStartPoint=function(){if(this.isEmpty()){return null;}
return this.getPointN(0);};jsts.geom.LineString.prototype.getEndPoint=function(){if(this.isEmpty()){return null;}
return this.getPointN(this.getNumPoints()-1);};jsts.geom.LineString.prototype.isClosed=function(){if(this.isEmpty()){return false;}
return this.getCoordinateN(0).equals2D(this.getCoordinateN(this.points.length-1));};jsts.geom.LineString.prototype.isRing=function(){return this.isClosed()&&this.isSimple();};jsts.geom.LineString.prototype.getGeometryType=function(){return'LineString';};jsts.geom.LineString.prototype.getLength=function(){return jsts.algorithm.CGAlgorithms.computeLength(this.points);};jsts.geom.LineString.prototype.getBoundary=function(){return(new jsts.operation.BoundaryOp(this)).getBoundary();};jsts.geom.LineString.prototype.computeEnvelopeInternal=function(){if(this.isEmpty()){return new jsts.geom.Envelope();}
var env=new jsts.geom.Envelope();this.points.forEach(function(component){env.expandToInclude(component);});return env;};jsts.geom.LineString.prototype.equalsExact=function(other,tolerance){if(!this.isEquivalentClass(other)){return false;}
if(this.points.length!==other.points.length){return false;}
if(this.isEmpty()&&other.isEmpty()){return true;}
return this.points.reduce(function(equal,point,i){return equal&&jsts.geom.Geometry.prototype.equal(point,other.points[i],tolerance);});};jsts.geom.LineString.prototype.isEquivalentClass=function(other){return other instanceof jsts.geom.LineString;};jsts.geom.LineString.prototype.compareToSameClass=function(o){var line=o;var i=0,il=this.points.length;var j=0,jl=line.points.length;while(i<il&&j<jl){var comparison=this.points[i].compareTo(line.points[j]);if(comparison!==0){return comparison;}
i++;j++;}
if(i<il){return 1;}
if(j<jl){return-1;}
return 0;};jsts.geom.LineString.prototype.apply=function(filter){if(filter instanceof jsts.geom.GeometryFilter||filter instanceof jsts.geom.GeometryComponentFilter){filter.filter(this);}else if(filter instanceof jsts.geom.CoordinateFilter){for(var i=0,len=this.points.length;i<len;i++){filter.filter(this.points[i]);}}else if(filter instanceof jsts.geom.CoordinateSequenceFilter){this.apply2.apply(this,arguments);}};jsts.geom.LineString.prototype.apply2=function(filter){if(this.points.length===0)
return;for(var i=0;i<this.points.length;i++){filter.filter(this.points,i);if(filter.isDone())
break;}
if(filter.isGeometryChanged()){}};jsts.geom.LineString.prototype.clone=function(){var points=[];for(var i=0,len=this.points.length;i<len;i++){points.push(this.points[i].clone());}
return this.factory.createLineString(points);};jsts.geom.LineString.prototype.normalize=function(){var i,il,j,ci,cj,len;len=this.points.length;il=parseInt(len/2);for(i=0;i<il;i++){j=len-1-i;ci=this.points[i];cj=this.points[j];if(!ci.equals(cj)){if(ci.compareTo(cj)>0){this.points.reverse();}
return;}}};jsts.geom.LineString.prototype.CLASS_NAME='jsts.geom.LineString';})();(function(){jsts.geom.LinearRing=function(points,factory){jsts.geom.LineString.apply(this,arguments);};jsts.geom.LinearRing.prototype=new jsts.geom.LineString();jsts.geom.LinearRing.constructor=jsts.geom.LinearRing;jsts.geom.LinearRing.prototype.getBoundaryDimension=function(){return jsts.geom.Dimension.FALSE;};jsts.geom.LinearRing.prototype.isSimple=function(){return true;};jsts.geom.LinearRing.prototype.getGeometryType=function(){return'LinearRing';};jsts.geom.LinearRing.MINIMUM_VALID_SIZE=4;jsts.geom.LinearRing.prototype.CLASS_NAME='jsts.geom.LinearRing';})();jsts.operation.overlay.OverlayNodeFactory=function(){};jsts.operation.overlay.OverlayNodeFactory.prototype=new jsts.geomgraph.NodeFactory();jsts.operation.overlay.OverlayNodeFactory.constructor=jsts.operation.overlay.OverlayNodeFactory;jsts.operation.overlay.OverlayNodeFactory.prototype.createNode=function(coord){return new jsts.geomgraph.Node(coord,new jsts.geomgraph.DirectedEdgeStar());};jsts.operation.buffer.SubgraphDepthLocater=function(subgraphs){this.subgraphs=[];this.seg=new jsts.geom.LineSegment();this.subgraphs=subgraphs;};jsts.operation.buffer.SubgraphDepthLocater.prototype.subgraphs=null;jsts.operation.buffer.SubgraphDepthLocater.prototype.seg=null;jsts.operation.buffer.SubgraphDepthLocater.prototype.getDepth=function(p){var stabbedSegments=this.findStabbedSegments(p);if(stabbedSegments.length===0)
return 0;stabbedSegments.sort();var ds=stabbedSegments[0];return ds.leftDepth;};jsts.operation.buffer.SubgraphDepthLocater.prototype.findStabbedSegments=function(stabbingRayLeftPt){if(arguments.length===3){this.findStabbedSegments2.apply(this,arguments);return;}
var stabbedSegments=[];for(var i=0;i<this.subgraphs.length;i++){var bsg=this.subgraphs[i];var env=bsg.getEnvelope();if(stabbingRayLeftPt.y<env.getMinY()||stabbingRayLeftPt.y>env.getMaxY())
continue;this.findStabbedSegments2(stabbingRayLeftPt,bsg.getDirectedEdges(),stabbedSegments);}
return stabbedSegments;};jsts.operation.buffer.SubgraphDepthLocater.prototype.findStabbedSegments2=function(stabbingRayLeftPt,dirEdges,stabbedSegments){if(arguments[1]instanceof jsts.geomgraph.DirectedEdge){this.findStabbedSegments3(stabbingRayLeftPt,dirEdges,stabbedSegments);return;}
for(var i=dirEdges.iterator();i.hasNext();){var de=i.next();if(!de.isForward())
continue;this.findStabbedSegments3(stabbingRayLeftPt,de,stabbedSegments);}};jsts.operation.buffer.SubgraphDepthLocater.prototype.findStabbedSegments3=function(stabbingRayLeftPt,dirEdge,stabbedSegments){var pts=dirEdge.getEdge().getCoordinates();for(var i=0;i<pts.length-1;i++){this.seg.p0=pts[i];this.seg.p1=pts[i+1];if(this.seg.p0.y>this.seg.p1.y)
this.seg.reverse();var maxx=Math.max(this.seg.p0.x,this.seg.p1.x);if(maxx<stabbingRayLeftPt.x)
continue;if(this.seg.isHorizontal())
continue;if(stabbingRayLeftPt.y<this.seg.p0.y||stabbingRayLeftPt.y>this.seg.p1.y)
continue;if(jsts.algorithm.CGAlgorithms.computeOrientation(this.seg.p0,this.seg.p1,stabbingRayLeftPt)===jsts.algorithm.CGAlgorithms.RIGHT)
continue;var depth=dirEdge.getDepth(jsts.geomgraph.Position.LEFT);if(!this.seg.p0.equals(pts[i]))
depth=dirEdge.getDepth(jsts.geomgraph.Position.RIGHT);var ds=new jsts.operation.buffer.SubgraphDepthLocater.DepthSegment(this.seg,depth);stabbedSegments.push(ds);}};jsts.operation.buffer.SubgraphDepthLocater.DepthSegment=function(seg,depth){this.upwardSeg=new jsts.geom.LineSegment(seg);this.leftDepth=depth;};jsts.operation.buffer.SubgraphDepthLocater.DepthSegment.prototype.upwardSeg=null;jsts.operation.buffer.SubgraphDepthLocater.DepthSegment.prototype.leftDepth=null;jsts.operation.buffer.SubgraphDepthLocater.DepthSegment.prototype.compareTo=function(obj){var other=obj;var orientIndex=this.upwardSeg.orientationIndex(other.upwardSeg);if(orientIndex===0)
orientIndex=-1*other.upwardSeg.orientationIndex(upwardSeg);if(orientIndex!==0)
return orientIndex;return this.compareX(this.upwardSeg,other.upwardSeg);};jsts.operation.buffer.SubgraphDepthLocater.DepthSegment.prototype.compareX=function(seg0,seg1){var compare0=seg0.p0.compareTo(seg1.p0);if(compare0!==0)
return compare0;return seg0.p1.compareTo(seg1.p1);};jsts.index.ItemVisitor=function(){};jsts.index.ItemVisitor.prototype.visitItem=function(){throw new jsts.error.AbstractMethodInvocationError();};jsts.simplify.LineSegmentIndex=function(){this.index=new jsts.index.quadtree.Quadtree();};jsts.simplify.LineSegmentIndex.prototype.index=null;jsts.simplify.LineSegmentIndex.prototype.add=function(line){if(line instanceof jsts.geom.LineSegment){this.add2(line);return;}
var segs=line.getSegments();for(var i=0;i<segs.length;i++){var seg=segs[i];this.add2(seg);}};jsts.simplify.LineSegmentIndex.prototype.add2=function(seg){this.index.insert(new jsts.geom.Envelope(seg.p0,seg.p1),seg);};jsts.simplify.LineSegmentIndex.prototype.remove=function(seg){this.index.remove(new jsts.geom.Envelope(seg.p0,seg.p1),seg);};jsts.simplify.LineSegmentIndex.prototype.query=function(querySeg){var env=new jsts.geom.Envelope(querySeg.p0,querySeg.p1);var visitor=new jsts.simplify.LineSegmentIndex.LineSegmentVisitor(querySeg);this.index.query(env,visitor);var itemsFound=visitor.getItems();return itemsFound;};jsts.simplify.LineSegmentIndex.LineSegmentVisitor=function(querySeg){this.items=[];this.querySeg=querySeg;};jsts.simplify.LineSegmentIndex.LineSegmentVisitor.prototype=new jsts.index.ItemVisitor();jsts.simplify.LineSegmentIndex.LineSegmentVisitor.prototype.querySeg=null;jsts.simplify.LineSegmentIndex.LineSegmentVisitor.prototype.items=null;jsts.simplify.LineSegmentIndex.LineSegmentVisitor.prototype.visitItem=function(item){var seg=item;if(jsts.geom.Envelope.intersects(seg.p0,seg.p1,this.querySeg.p0,this.querySeg.p1))
this.items.push(item);};jsts.simplify.LineSegmentIndex.LineSegmentVisitor.prototype.getItems=function(){return this.items;};jsts.geomgraph.EdgeEndStar=function(){this.edgeMap=new javascript.util.TreeMap();this.edgeList=null;this.ptInAreaLocation=[jsts.geom.Location.NONE,jsts.geom.Location.NONE];};jsts.geomgraph.EdgeEndStar.prototype.edgeMap=null;jsts.geomgraph.EdgeEndStar.prototype.edgeList=null;jsts.geomgraph.EdgeEndStar.prototype.ptInAreaLocation=null;jsts.geomgraph.EdgeEndStar.prototype.insert=function(e){throw new jsts.error.AbstractMethodInvocationError();};jsts.geomgraph.EdgeEndStar.prototype.insertEdgeEnd=function(e,obj){this.edgeMap.put(e,obj);this.edgeList=null;};jsts.geomgraph.EdgeEndStar.prototype.getCoordinate=function(){var it=this.iterator();if(!it.hasNext())
return null;var e=it.next();return e.getCoordinate();};jsts.geomgraph.EdgeEndStar.prototype.getDegree=function(){return this.edgeMap.size();};jsts.geomgraph.EdgeEndStar.prototype.iterator=function(){return this.getEdges().iterator();};jsts.geomgraph.EdgeEndStar.prototype.getEdges=function(){if(this.edgeList===null){this.edgeList=new javascript.util.ArrayList(this.edgeMap.values());}
return this.edgeList;};jsts.geomgraph.EdgeEndStar.prototype.getNextCW=function(ee){this.getEdges();var i=this.edgeList.indexOf(ee);var iNextCW=i-1;if(i===0)
iNextCW=this.edgeList.length-1;return this.edgeList[iNextCW];};jsts.geomgraph.EdgeEndStar.prototype.computeLabelling=function(geomGraph){this.computeEdgeEndLabels(geomGraph[0].getBoundaryNodeRule());this.propagateSideLabels(0);this.propagateSideLabels(1);var hasDimensionalCollapseEdge=[false,false];for(var it=this.iterator();it.hasNext();){var e=it.next();var label=e.getLabel();for(var geomi=0;geomi<2;geomi++){if(label.isLine(geomi)&&label.getLocation(geomi)===jsts.geom.Location.BOUNDARY)
hasDimensionalCollapseEdge[geomi]=true;}}
for(var it=this.iterator();it.hasNext();){var e=it.next();var label=e.getLabel();for(var geomi=0;geomi<2;geomi++){if(label.isAnyNull(geomi)){var loc=jsts.geom.Location.NONE;if(hasDimensionalCollapseEdge[geomi]){loc=jsts.geom.Location.EXTERIOR;}else{var p=e.getCoordinate();loc=this.getLocation(geomi,p,geomGraph);}
label.setAllLocationsIfNull(geomi,loc);}}}};jsts.geomgraph.EdgeEndStar.prototype.computeEdgeEndLabels=function(boundaryNodeRule){for(var it=this.iterator();it.hasNext();){var ee=it.next();ee.computeLabel(boundaryNodeRule);}};jsts.geomgraph.EdgeEndStar.prototype.getLocation=function(geomIndex,p,geom){if(this.ptInAreaLocation[geomIndex]===jsts.geom.Location.NONE){this.ptInAreaLocation[geomIndex]=jsts.algorithm.locate.SimplePointInAreaLocator.locate(p,geom[geomIndex].getGeometry());}
return this.ptInAreaLocation[geomIndex];};jsts.geomgraph.EdgeEndStar.prototype.isAreaLabelsConsistent=function(geomGraph){this.computeEdgeEndLabels(geomGraph.getBoundaryNodeRule());return this.checkAreaLabelsConsistent(0);};jsts.geomgraph.EdgeEndStar.prototype.checkAreaLabelsConsistent=function(geomIndex){var edges=this.getEdges();if(edges.size()<=0)
return true;var lastEdgeIndex=edges.size()-1;var startLabel=edges.get(lastEdgeIndex).getLabel();var startLoc=startLabel.getLocation(geomIndex,jsts.geomgraph.Position.LEFT);jsts.util.Assert.isTrue(startLoc!=jsts.geom.Location.NONE,'Found unlabelled area edge');var currLoc=startLoc;for(var it=this.iterator();it.hasNext();){var e=it.next();var label=e.getLabel();jsts.util.Assert.isTrue(label.isArea(geomIndex),'Found non-area edge');var leftLoc=label.getLocation(geomIndex,jsts.geomgraph.Position.LEFT);var rightLoc=label.getLocation(geomIndex,jsts.geomgraph.Position.RIGHT);if(leftLoc===rightLoc){return false;}
if(rightLoc!==currLoc){return false;}
currLoc=leftLoc;}
return true;};jsts.geomgraph.EdgeEndStar.prototype.propagateSideLabels=function(geomIndex){var startLoc=jsts.geom.Location.NONE;for(var it=this.iterator();it.hasNext();){var e=it.next();var label=e.getLabel();if(label.isArea(geomIndex)&&label.getLocation(geomIndex,jsts.geomgraph.Position.LEFT)!==jsts.geom.Location.NONE)
startLoc=label.getLocation(geomIndex,jsts.geomgraph.Position.LEFT);}
if(startLoc===jsts.geom.Location.NONE)
return;var currLoc=startLoc;for(var it=this.iterator();it.hasNext();){var e=it.next();var label=e.getLabel();if(label.getLocation(geomIndex,jsts.geomgraph.Position.ON)===jsts.geom.Location.NONE)
label.setLocation(geomIndex,jsts.geomgraph.Position.ON,currLoc);if(label.isArea(geomIndex)){var leftLoc=label.getLocation(geomIndex,jsts.geomgraph.Position.LEFT);var rightLoc=label.getLocation(geomIndex,jsts.geomgraph.Position.RIGHT);if(rightLoc!==jsts.geom.Location.NONE){if(rightLoc!==currLoc)
throw new jsts.error.TopologyError('side location conflict',e.getCoordinate());if(leftLoc===jsts.geom.Location.NONE){jsts.util.Assert.shouldNeverReachHere('found single null side (at '+
e.getCoordinate()+')');}
currLoc=leftLoc;}else{jsts.util.Assert.isTrue(label.getLocation(geomIndex,jsts.geomgraph.Position.LEFT)===jsts.geom.Location.NONE,'found single null side');label.setLocation(geomIndex,jsts.geomgraph.Position.RIGHT,currLoc);label.setLocation(geomIndex,jsts.geomgraph.Position.LEFT,currLoc);}}}};jsts.geomgraph.EdgeEndStar.prototype.findIndex=function(eSearch){this.iterator();for(var i=0;i<this.edgeList.size();i++){var e=this.edgeList.get(i);if(e===eSearch)
return i;}
return-1;};jsts.operation.relate.EdgeEndBundleStar=function(){jsts.geomgraph.EdgeEndStar.apply(this,arguments);};jsts.operation.relate.EdgeEndBundleStar.prototype=new jsts.geomgraph.EdgeEndStar();jsts.operation.relate.EdgeEndBundleStar.prototype.insert=function(e){var eb=this.edgeMap.get(e);if(eb===null){eb=new jsts.operation.relate.EdgeEndBundle(e);this.insertEdgeEnd(e,eb);}
else{eb.insert(e);}};jsts.operation.relate.EdgeEndBundleStar.prototype.updateIM=function(im){for(var it=this.iterator();it.hasNext();){var esb=it.next();esb.updateIM(im);}};(function(){jsts.geom.Polygon=function(shell,holes,factory){this.shell=shell||factory.createLinearRing(null);this.holes=holes||[];this.factory=factory;};jsts.geom.Polygon.prototype=new jsts.geom.Geometry();jsts.geom.Polygon.constructor=jsts.geom.Polygon;jsts.geom.Polygon.prototype.getCoordinate=function(){return this.shell.getCoordinate();};jsts.geom.Polygon.prototype.getCoordinates=function(){if(this.isEmpty()){return[];}
var coordinates=[];var k=-1;var shellCoordinates=this.shell.getCoordinates();for(var x=0;x<shellCoordinates.length;x++){k++;coordinates[k]=shellCoordinates[x];}
for(var i=0;i<this.holes.length;i++){var childCoordinates=this.holes[i].getCoordinates();for(var j=0;j<childCoordinates.length;j++){k++;coordinates[k]=childCoordinates[j];}}
return coordinates;};jsts.geom.Polygon.prototype.isEmpty=function(){return this.shell.isEmpty();};jsts.geom.Polygon.prototype.getExteriorRing=function(){return this.shell;};jsts.geom.Polygon.prototype.getInteriorRingN=function(n){return this.holes[n];};jsts.geom.Polygon.prototype.getNumInteriorRing=function(){return this.holes.length;};jsts.geom.Polygon.prototype.getArea=function(){var area=0.0;area+=Math.abs(jsts.algorithm.CGAlgorithms.signedArea(this.shell.getCoordinateSequence()));for(var i=0;i<this.holes.length;i++){area-=Math.abs(jsts.algorithm.CGAlgorithms.signedArea(this.holes[i].getCoordinateSequence()));}
return area;};jsts.geom.Polygon.prototype.getLength=function(){var len=0.0;len+=this.shell.getLength();for(var i=0;i<this.holes.length;i++){len+=this.holes[i].getLength();}
return len;};jsts.geom.Polygon.prototype.getBoundary=function(){if(this.isEmpty()){return this.getFactory().createMultiLineString(null);}
var rings=[];rings[0]=this.shell.clone();for(var i=0,len=this.holes.length;i<len;i++){rings[i+1]=this.holes[i].clone();}
if(rings.length<=1)
return rings[0];return this.getFactory().createMultiLineString(rings);};jsts.geom.Polygon.prototype.computeEnvelopeInternal=function(){return this.shell.getEnvelopeInternal();};jsts.geom.Polygon.prototype.getDimension=function(){return 2;};jsts.geom.Polygon.prototype.getBoundaryDimension=function(){return 1;};jsts.geom.Polygon.prototype.equalsExact=function(other,tolerance){if(!this.isEquivalentClass(other)){return false;}
if(this.isEmpty()&&other.isEmpty()){return true;}
if(this.isEmpty()!==other.isEmpty()){return false;}
if(!this.shell.equalsExact(other.shell,tolerance)){return false;}
if(this.holes.length!==other.holes.length){return false;}
if(this.holes.length!==other.holes.length){return false;}
for(var i=0;i<this.holes.length;i++){if(!(this.holes[i]).equalsExact(other.holes[i],tolerance)){return false;}}
return true;};jsts.geom.Polygon.prototype.compareToSameClass=function(o){return this.shell.compareToSameClass(o.shell);};jsts.geom.Polygon.prototype.apply=function(filter){if(filter instanceof jsts.geom.GeometryComponentFilter){filter.filter(this);this.shell.apply(filter);for(var i=0,len=this.holes.length;i<len;i++){this.holes[i].apply(filter);}}else if(filter instanceof jsts.geom.GeometryFilter){filter.filter(this);}else if(filter instanceof jsts.geom.CoordinateFilter){this.shell.apply(filter);for(var i=0,len=this.holes.length;i<len;i++){this.holes[i].apply(filter);}}else if(filter instanceof jsts.geom.CoordinateSequenceFilter){this.apply2.apply(this,arguments);}};jsts.geom.Polygon.prototype.apply2=function(filter){this.shell.apply(filter);if(!filter.isDone()){for(var i=0;i<this.holes.length;i++){this.holes[i].apply(filter);if(filter.isDone())
break;}}
if(filter.isGeometryChanged()){}};jsts.geom.Polygon.prototype.clone=function(){var holes=[];for(var i=0,len=this.holes.length;i<len;i++){holes.push(this.holes[i].clone());}
return this.factory.createPolygon(this.shell.clone(),holes);};jsts.geom.Polygon.prototype.normalize=function(){this.normalize2(this.shell,true);for(var i=0,len=this.holes.length;i<len;i++){this.normalize2(this.holes[i],false);}
this.holes.sort();};jsts.geom.Polygon.prototype.normalize2=function(ring,clockwise){if(ring.isEmpty()){return;}
var uniqueCoordinates=ring.points.slice(0,ring.points.length-1);var minCoordinate=jsts.geom.CoordinateArrays.minCoordinate(ring.points);jsts.geom.CoordinateArrays.scroll(uniqueCoordinates,minCoordinate);ring.points=uniqueCoordinates.concat();ring.points[uniqueCoordinates.length]=uniqueCoordinates[0];if(jsts.algorithm.CGAlgorithms.isCCW(ring.points)===clockwise){ring.points.reverse();}};jsts.geom.Polygon.prototype.CLASS_NAME='jsts.geom.Polygon';})();jsts.algorithm.distance.DistanceToPoint=function(){};jsts.algorithm.distance.DistanceToPoint.computeDistance=function(geom,pt,ptDist){if(geom instanceof jsts.geom.LineString){jsts.algorithm.distance.DistanceToPoint.computeDistance2(geom,pt,ptDist);}else if(geom instanceof jsts.geom.Polygon){jsts.algorithm.distance.DistanceToPoint.computeDistance4(geom,pt,ptDist);}else if(geom instanceof jsts.geom.GeometryCollection){var gc=geom;for(var i=0;i<gc.getNumGeometries();i++){var g=gc.getGeometryN(i);jsts.algorithm.distance.DistanceToPoint.computeDistance(g,pt,ptDist);}}else{ptDist.setMinimum(geom.getCoordinate(),pt);}};jsts.algorithm.distance.DistanceToPoint.computeDistance2=function(line,pt,ptDist){var tempSegment=new jsts.geom.LineSegment();var coords=line.getCoordinates();for(var i=0;i<coords.length-1;i++){tempSegment.setCoordinates(coords[i],coords[i+1]);var closestPt=tempSegment.closestPoint(pt);ptDist.setMinimum(closestPt,pt);}};jsts.algorithm.distance.DistanceToPoint.computeDistance3=function(segment,pt,ptDist){var closestPt=segment.closestPoint(pt);ptDist.setMinimum(closestPt,pt);};jsts.algorithm.distance.DistanceToPoint.computeDistance4=function(poly,pt,ptDist){jsts.algorithm.distance.DistanceToPoint.computeDistance2(poly.getExteriorRing(),pt,ptDist);for(var i=0;i<poly.getNumInteriorRing();i++){jsts.algorithm.distance.DistanceToPoint.computeDistance2(poly.getInteriorRingN(i),pt,ptDist);}};jsts.index.strtree.Boundable=function(){};jsts.index.strtree.Boundable.prototype.getBounds=function(){throw new jsts.error.AbstractMethodInvocationError();};jsts.index.strtree.ItemBoundable=function(bounds,item){this.bounds=bounds;this.item=item;};jsts.index.strtree.ItemBoundable.prototype=new jsts.index.strtree.Boundable();jsts.index.strtree.ItemBoundable.constructor=jsts.index.strtree.ItemBoundable;jsts.index.strtree.ItemBoundable.prototype.bounds=null;jsts.index.strtree.ItemBoundable.prototype.item=null;jsts.index.strtree.ItemBoundable.prototype.getBounds=function(){return this.bounds;};jsts.index.strtree.ItemBoundable.prototype.getItem=function(){return this.item;};jsts.noding.SegmentPointComparator=function(){};jsts.noding.SegmentPointComparator.compare=function(octant,p0,p1){if(p0.equals2D(p1))
return 0;var xSign=jsts.noding.SegmentPointComparator.relativeSign(p0.x,p1.x);var ySign=jsts.noding.SegmentPointComparator.relativeSign(p0.y,p1.y);switch(octant){case 0:return jsts.noding.SegmentPointComparator.compareValue(xSign,ySign);case 1:return jsts.noding.SegmentPointComparator.compareValue(ySign,xSign);case 2:return jsts.noding.SegmentPointComparator.compareValue(ySign,-xSign);case 3:return jsts.noding.SegmentPointComparator.compareValue(-xSign,ySign);case 4:return jsts.noding.SegmentPointComparator.compareValue(-xSign,-ySign);case 5:return jsts.noding.SegmentPointComparator.compareValue(-ySign,-xSign);case 6:return jsts.noding.SegmentPointComparator.compareValue(-ySign,xSign);case 7:return jsts.noding.SegmentPointComparator.compareValue(xSign,-ySign);}
return 0;};jsts.noding.SegmentPointComparator.relativeSign=function(x0,x1){if(x0<x1)
return-1;if(x0>x1)
return 1;return 0;};jsts.noding.SegmentPointComparator.compareValue=function(compareSign0,compareSign1){if(compareSign0<0)
return-1;if(compareSign0>0)
return 1;if(compareSign1<0)
return-1;if(compareSign1>0)
return 1;return 0;};jsts.operation.IsSimpleOp=function(geom){this.geom=geom;};jsts.operation.IsSimpleOp.prototype.geom=null;jsts.operation.IsSimpleOp.prototype.isClosedEndpointsInInterior=true;jsts.operation.IsSimpleOp.prototype.nonSimpleLocation=null;jsts.operation.IsSimpleOp.prototype.IsSimpleOp=function(geom){this.geom=geom;};jsts.operation.IsSimpleOp.prototype.isSimple=function(){this.nonSimpleLocation=null;if(this.geom instanceof jsts.geom.LineString){return this.isSimpleLinearGeometry(this.geom);}
if(this.geom instanceof jsts.geom.MultiLineString){return this.isSimpleLinearGeometry(this.geom);}
if(this.geom instanceof jsts.geom.MultiPoint){return this.isSimpleMultiPoint(this.geom);}
return true;};jsts.operation.IsSimpleOp.prototype.isSimpleMultiPoint=function(mp){if(mp.isEmpty())
return true;var points=[];for(var i=0;i<mp.getNumGeometries();i++){var pt=mp.getGeometryN(i);var p=pt.getCoordinate();for(var j=0;j<points.length;j++){var point=points[j];if(p.equals2D(point)){this.nonSimpleLocation=p;return false;}}
points.push(p);}
return true;};jsts.operation.IsSimpleOp.prototype.isSimpleLinearGeometry=function(geom){if(geom.isEmpty())
return true;var graph=new jsts.geomgraph.GeometryGraph(0,geom);var li=new jsts.algorithm.RobustLineIntersector();var si=graph.computeSelfNodes(li,true);if(!si.hasIntersection())
return true;if(si.hasProperIntersection()){this.nonSimpleLocation=si.getProperIntersectionPoint();return false;}
if(this.hasNonEndpointIntersection(graph))
return false;if(this.isClosedEndpointsInInterior){if(this.hasClosedEndpointIntersection(graph))
return false;}
return true;};jsts.operation.IsSimpleOp.prototype.hasNonEndpointIntersection=function(graph){for(var i=graph.getEdgeIterator();i.hasNext();){var e=i.next();var maxSegmentIndex=e.getMaximumSegmentIndex();for(var eiIt=e.getEdgeIntersectionList().iterator();eiIt.hasNext();){var ei=eiIt.next();if(!ei.isEndPoint(maxSegmentIndex)){this.nonSimpleLocation=ei.getCoordinate();return true;}}}
return false;};jsts.operation.IsSimpleOp.prototype.hasClosedEndpointIntersection=function(graph){var endPoints=new javascript.util.TreeMap();for(var i=graph.getEdgeIterator();i.hasNext();){var e=i.next();var maxSegmentIndex=e.getMaximumSegmentIndex();var isClosed=e.isClosed();var p0=e.getCoordinate(0);this.addEndpoint(endPoints,p0,isClosed);var p1=e.getCoordinate(e.getNumPoints()-1);this.addEndpoint(endPoints,p1,isClosed);}
for(var i=endPoints.values().iterator();i.hasNext();){var eiInfo=i.next();if(eiInfo.isClosed&&eiInfo.degree!=2){this.nonSimpleLocation=eiInfo.getCoordinate();return true;}}
return false;};jsts.operation.IsSimpleOp.EndpointInfo=function(pt){this.pt=pt;this.isClosed=false;this.degree=0;};jsts.operation.IsSimpleOp.EndpointInfo.prototype.pt=null;jsts.operation.IsSimpleOp.EndpointInfo.prototype.isClosed=null;jsts.operation.IsSimpleOp.EndpointInfo.prototype.degree=null;jsts.operation.IsSimpleOp.EndpointInfo.prototype.getCoordinate=function(){return this.pt;};jsts.operation.IsSimpleOp.EndpointInfo.prototype.addEndpoint=function(isClosed){this.degree++;this.isClosed=this.isClosed||isClosed;};jsts.operation.IsSimpleOp.prototype.addEndpoint=function(endPoints,p,isClosed){var eiInfo=endPoints.get(p);if(eiInfo===null){eiInfo=new jsts.operation.IsSimpleOp.EndpointInfo(p);endPoints.put(p,eiInfo);}
eiInfo.addEndpoint(isClosed);};(function(){var LineStringSnapper=function(){this.snapTolerance=0.0;this.seg=new jsts.geom.LineSegment();this.allowSnappingToSourceVertices=false;this.isClosed=false;this.srcPts=[];if(arguments[0]instanceof jsts.geom.LineString){this.initFromLine.apply(this,arguments);}else{this.initFromPoints.apply(this,arguments);}};LineStringSnapper.prototype.initFromLine=function(srcLine,snapTolerance){this.initFromPoints(srcLine.getCoordinates(),snapTolerance);};LineStringSnapper.prototype.initFromPoints=function(srcPts,snapTolerance){this.srcPts=srcPts;this.isClosed=this.calcIsClosed(srcPts);this.snapTolerance=snapTolerance;};LineStringSnapper.prototype.setAllowSnappingToSourceVertices=function(allowSnappingToSourceVertices){this.allowSnappingToSourceVertices=allowSnappingToSourceVertices;};LineStringSnapper.prototype.calcIsClosed=function(pts){if(pts.length<=1){return false;}
return pts[0].equals(pts[pts.length-1]);};LineStringSnapper.prototype.snapTo=function(snapPts){var coordList=new jsts.geom.CoordinateList(this.srcPts);this.snapVertices(coordList,snapPts);this.snapSegments(coordList,snapPts);return coordList.toCoordinateArray();};LineStringSnapper.prototype.snapVertices=function(srcCoords,snapPts){var end=this.isClosed?srcCoords.size()-1:srcCoords.size(),i=0,srcPt,snapVert;for(i;i<end;i++){srcPt=srcCoords.get(i);snapVert=this.findSnapForVertex(srcPt,snapPts);if(snapVert!==null){srcCoords.set(i,new jsts.geom.Coordinate(snapVert));if(i===0&&this.isClosed)
srcCoords.set(srcCoords.size()-1,new jsts.geom.Coordinate(snapVert));}}};LineStringSnapper.prototype.findSnapForVertex=function(pt,snapPts){var i=0,il=snapPts.length;for(i=0;i<il;i++){if(pt.equals(snapPts[i])){return null;}
if(pt.distance(snapPts[i])<this.snapTolerance){return snapPts[i];}}
return null;};LineStringSnapper.prototype.snapSegments=function(srcCoords,snapPts){if(snapPts.length===0){return;}
var distinctPtCount=snapPts.length,i,snapPt,index;if(snapPts.length>1&&snapPts[0].equals2D(snapPts[snapPts.length-1])){distinctPtCount=snapPts.length-1;}
i=0;for(i;i<distinctPtCount;i++){snapPt=snapPts[i];index=this.findSegmentIndexToSnap(snapPt,srcCoords);if(index>=0){srcCoords.add(index+1,new jsts.geom.Coordinate(snapPt),false);}}};LineStringSnapper.prototype.findSegmentIndexToSnap=function(snapPt,srcCoords){var minDist=Number.MAX_VALUE,snapIndex=-1,i=0,dist;for(i;i<srcCoords.size()-1;i++){this.seg.p0=srcCoords.get(i);this.seg.p1=srcCoords.get(i+1);if(this.seg.p0.equals(snapPt)||this.seg.p1.equals(snapPt)){if(this.allowSnappingToSourceVertices){continue;}else{return-1;}}
dist=this.seg.distance(snapPt);if(dist<this.snapTolerance&&dist<minDist){minDist=dist;snapIndex=i;}}
return snapIndex;};jsts.operation.overlay.snap.LineStringSnapper=LineStringSnapper;})();jsts.operation.buffer.BufferOp=function(g,bufParams){this.argGeom=g;this.bufParams=bufParams?bufParams:new jsts.operation.buffer.BufferParameters();};jsts.operation.buffer.BufferOp.MAX_PRECISION_DIGITS=12;jsts.operation.buffer.BufferOp.precisionScaleFactor=function(g,distance,maxPrecisionDigits){var env=g.getEnvelopeInternal();var envSize=Math.max(env.getHeight(),env.getWidth());var expandByDistance=distance>0.0?distance:0.0;var bufEnvSize=envSize+2*expandByDistance;var bufEnvLog10=(Math.log(bufEnvSize)/Math.log(10)+1.0);var minUnitLog10=bufEnvLog10-maxPrecisionDigits;var scaleFactor=Math.pow(10.0,-minUnitLog10);return scaleFactor;};jsts.operation.buffer.BufferOp.bufferOp=function(g,distance){if(arguments.length>2){return jsts.operation.buffer.BufferOp.bufferOp2.apply(this,arguments);}
var gBuf=new jsts.operation.buffer.BufferOp(g);var geomBuf=gBuf.getResultGeometry(distance);return geomBuf;};jsts.operation.buffer.BufferOp.bufferOp2=function(g,distance,params){if(arguments.length>3){return jsts.operation.buffer.BufferOp.bufferOp3.apply(this,arguments);}
var bufOp=new jsts.operation.buffer.BufferOp(g,params);var geomBuf=bufOp.getResultGeometry(distance);return geomBuf;};jsts.operation.buffer.BufferOp.bufferOp3=function(g,distance,quadrantSegments){if(arguments.length>4){return jsts.operation.buffer.BufferOp.bufferOp4.apply(this,arguments);}
var bufOp=new jsts.operation.buffer.BufferOp(g);bufOp.setQuadrantSegments(quadrantSegments);var geomBuf=bufOp.getResultGeometry(distance);return geomBuf;};jsts.operation.buffer.BufferOp.bufferOp4=function(g,distance,quadrantSegments,endCapStyle){var bufOp=new jsts.operation.buffer.BufferOp(g);bufOp.setQuadrantSegments(quadrantSegments);bufOp.setEndCapStyle(endCapStyle);var geomBuf=bufOp.getResultGeometry(distance);return geomBuf;};jsts.operation.buffer.BufferOp.prototype.argGeom=null;jsts.operation.buffer.BufferOp.prototype.distance=null;jsts.operation.buffer.BufferOp.prototype.bufParams=null;jsts.operation.buffer.BufferOp.prototype.resultGeometry=null;jsts.operation.buffer.BufferOp.prototype.setEndCapStyle=function(endCapStyle){this.bufParams.setEndCapStyle(endCapStyle);};jsts.operation.buffer.BufferOp.prototype.setQuadrantSegments=function(quadrantSegments){this.bufParams.setQuadrantSegments(quadrantSegments);};jsts.operation.buffer.BufferOp.prototype.getResultGeometry=function(dist){this.distance=dist;this.computeGeometry();return this.resultGeometry;};jsts.operation.buffer.BufferOp.prototype.computeGeometry=function(){this.bufferOriginalPrecision();if(this.resultGeometry!==null){return;}
var argPM=this.argGeom.getPrecisionModel();if(argPM.getType()===jsts.geom.PrecisionModel.FIXED){this.bufferFixedPrecision(argPM);}else{this.bufferReducedPrecision();}};jsts.operation.buffer.BufferOp.prototype.bufferReducedPrecision=function(){var precDigits;var saveException=null;for(precDigits=jsts.operation.buffer.BufferOp.MAX_PRECISION_DIGITS;precDigits>=0;precDigits--){try{this.bufferReducedPrecision2(precDigits);}catch(ex){saveException=ex;}
if(this.resultGeometry!==null){return;}}
throw saveException;};jsts.operation.buffer.BufferOp.prototype.bufferOriginalPrecision=function(){try{var bufBuilder=new jsts.operation.buffer.BufferBuilder(this.bufParams);this.resultGeometry=bufBuilder.buffer(this.argGeom,this.distance);}catch(e){}};jsts.operation.buffer.BufferOp.prototype.bufferReducedPrecision2=function(precisionDigits){var sizeBasedScaleFactor=jsts.operation.buffer.BufferOp.precisionScaleFactor(this.argGeom,this.distance,precisionDigits);var fixedPM=new jsts.geom.PrecisionModel(sizeBasedScaleFactor);this.bufferFixedPrecision(fixedPM);};jsts.operation.buffer.BufferOp.prototype.bufferFixedPrecision=function(fixedPM){var noder=new jsts.noding.ScaledNoder(new jsts.noding.snapround.MCIndexSnapRounder(new jsts.geom.PrecisionModel(1.0)),fixedPM.getScale());var bufBuilder=new jsts.operation.buffer.BufferBuilder(this.bufParams);bufBuilder.setWorkingPrecisionModel(fixedPM);bufBuilder.setNoder(noder);this.resultGeometry=bufBuilder.buffer(this.argGeom,this.distance);};jsts.geomgraph.index.EdgeSetIntersector=function(){};jsts.geomgraph.index.EdgeSetIntersector.prototype.computeIntersections=function(edges,si,testAllSegments){throw new jsts.error.AbstractMethodInvocationError();};jsts.geomgraph.index.EdgeSetIntersector.prototype.computeIntersections2=function(edges0,edges1,si){throw new jsts.error.AbstractMethodInvocationError();};jsts.geomgraph.index.SimpleMCSweepLineIntersector=function(){throw new jsts.error.NotImplementedError();};jsts.geomgraph.index.SimpleMCSweepLineIntersector.prototype=new jsts.geomgraph.index.EdgeSetIntersector();jsts.algorithm.locate.SimplePointInAreaLocator=function(geom){this.geom=geom;};jsts.algorithm.locate.SimplePointInAreaLocator.locate=function(p,geom){if(geom.isEmpty())
return jsts.geom.Location.EXTERIOR;if(jsts.algorithm.locate.SimplePointInAreaLocator.containsPoint(p,geom))
return jsts.geom.Location.INTERIOR;return jsts.geom.Location.EXTERIOR;};jsts.algorithm.locate.SimplePointInAreaLocator.containsPoint=function(p,geom){if(geom instanceof jsts.geom.Polygon){return jsts.algorithm.locate.SimplePointInAreaLocator.containsPointInPolygon(p,geom);}else if(geom instanceof jsts.geom.GeometryCollection||geom instanceof jsts.geom.MultiPoint||geom instanceof jsts.geom.MultiLineString||geom instanceof jsts.geom.MultiPolygon){for(var i=0;i<geom.geometries.length;i++){var g2=geom.geometries[i];if(g2!==geom)
if(jsts.algorithm.locate.SimplePointInAreaLocator.containsPoint(p,g2))
return true;}}
return false;};jsts.algorithm.locate.SimplePointInAreaLocator.containsPointInPolygon=function(p,poly){if(poly.isEmpty())
return false;var shell=poly.getExteriorRing();if(!jsts.algorithm.locate.SimplePointInAreaLocator.isPointInRing(p,shell))
return false;for(var i=0;i<poly.getNumInteriorRing();i++){var hole=poly.getInteriorRingN(i);if(jsts.algorithm.locate.SimplePointInAreaLocator.isPointInRing(p,hole))
return false;}
return true;};jsts.algorithm.locate.SimplePointInAreaLocator.isPointInRing=function(p,ring){if(!ring.getEnvelopeInternal().intersects(p))
return false;return jsts.algorithm.CGAlgorithms.isPointInRing(p,ring.getCoordinates());};jsts.algorithm.locate.SimplePointInAreaLocator.prototype.geom=null;jsts.algorithm.locate.SimplePointInAreaLocator.prototype.locate=function(p){return jsts.algorithm.locate.SimplePointInAreaLocator.locate(p,geom);};(function(){var Location=jsts.geom.Location;var Position=jsts.geomgraph.Position;var EdgeEndStar=jsts.geomgraph.EdgeEndStar;var Assert=jsts.util.Assert;jsts.geomgraph.DirectedEdgeStar=function(){jsts.geomgraph.EdgeEndStar.call(this);};jsts.geomgraph.DirectedEdgeStar.prototype=new EdgeEndStar();jsts.geomgraph.DirectedEdgeStar.constructor=jsts.geomgraph.DirectedEdgeStar;jsts.geomgraph.DirectedEdgeStar.prototype.resultAreaEdgeList=null;jsts.geomgraph.DirectedEdgeStar.prototype.label=null;jsts.geomgraph.DirectedEdgeStar.prototype.insert=function(ee){var de=ee;this.insertEdgeEnd(de,de);};jsts.geomgraph.DirectedEdgeStar.prototype.getLabel=function(){return this.label;};jsts.geomgraph.DirectedEdgeStar.prototype.getOutgoingDegree=function(){var degree=0;for(var it=this.iterator();it.hasNext();){var de=it.next();if(de.isInResult())
degree++;}
return degree;};jsts.geomgraph.DirectedEdgeStar.prototype.getOutgoingDegree=function(er){var degree=0;for(var it=this.iterator();it.hasNext();){var de=it.next();if(de.getEdgeRing()===er)
degree++;}
return degree;};jsts.geomgraph.DirectedEdgeStar.prototype.getRightmostEdge=function(){var edges=this.getEdges();var size=edges.size();if(size<1)
return null;var de0=edges.get(0);if(size==1)
return de0;var deLast=edges.get(size-1);var quad0=de0.getQuadrant();var quad1=deLast.getQuadrant();if(jsts.geomgraph.Quadrant.isNorthern(quad0)&&jsts.geomgraph.Quadrant.isNorthern(quad1))
return de0;else if(!jsts.geomgraph.Quadrant.isNorthern(quad0)&&!jsts.geomgraph.Quadrant.isNorthern(quad1))
return deLast;else{var nonHorizontalEdge=null;if(de0.getDy()!=0)
return de0;else if(deLast.getDy()!=0)
return deLast;}
Assert.shouldNeverReachHere('found two horizontal edges incident on node');return null;};jsts.geomgraph.DirectedEdgeStar.prototype.computeLabelling=function(geom){EdgeEndStar.prototype.computeLabelling.call(this,geom);this.label=new jsts.geomgraph.Label(Location.NONE);for(var it=this.iterator();it.hasNext();){var ee=it.next();var e=ee.getEdge();var eLabel=e.getLabel();for(var i=0;i<2;i++){var eLoc=eLabel.getLocation(i);if(eLoc===Location.INTERIOR||eLoc===Location.BOUNDARY)
this.label.setLocation(i,Location.INTERIOR);}}};jsts.geomgraph.DirectedEdgeStar.prototype.mergeSymLabels=function(){for(var it=this.iterator();it.hasNext();){var de=it.next();var label=de.getLabel();label.merge(de.getSym().getLabel());}};jsts.geomgraph.DirectedEdgeStar.prototype.updateLabelling=function(nodeLabel){for(var it=this.iterator();it.hasNext();){var de=it.next();var label=de.getLabel();label.setAllLocationsIfNull(0,nodeLabel.getLocation(0));label.setAllLocationsIfNull(1,nodeLabel.getLocation(1));}};jsts.geomgraph.DirectedEdgeStar.prototype.getResultAreaEdges=function(){if(this.resultAreaEdgeList!==null)
return this.resultAreaEdgeList;this.resultAreaEdgeList=new javascript.util.ArrayList();for(var it=this.iterator();it.hasNext();){var de=it.next();if(de.isInResult()||de.getSym().isInResult())
this.resultAreaEdgeList.add(de);}
return this.resultAreaEdgeList;};jsts.geomgraph.DirectedEdgeStar.prototype.SCANNING_FOR_INCOMING=1;jsts.geomgraph.DirectedEdgeStar.prototype.LINKING_TO_OUTGOING=2;jsts.geomgraph.DirectedEdgeStar.prototype.linkResultDirectedEdges=function(){this.getResultAreaEdges();var firstOut=null;var incoming=null;var state=this.SCANNING_FOR_INCOMING;for(var i=0;i<this.resultAreaEdgeList.size();i++){var nextOut=this.resultAreaEdgeList.get(i);var nextIn=nextOut.getSym();if(!nextOut.getLabel().isArea())
continue;if(firstOut===null&&nextOut.isInResult())
firstOut=nextOut;switch(state){case this.SCANNING_FOR_INCOMING:if(!nextIn.isInResult())
continue;incoming=nextIn;state=this.LINKING_TO_OUTGOING;break;case this.LINKING_TO_OUTGOING:if(!nextOut.isInResult())
continue;incoming.setNext(nextOut);state=this.SCANNING_FOR_INCOMING;break;}}
if(state===this.LINKING_TO_OUTGOING){if(firstOut===null)
throw new jsts.error.TopologyError('no outgoing dirEdge found',this.getCoordinate());Assert.isTrue(firstOut.isInResult(),'unable to link last incoming dirEdge');incoming.setNext(firstOut);}};jsts.geomgraph.DirectedEdgeStar.prototype.linkMinimalDirectedEdges=function(er){var firstOut=null;var incoming=null;var state=this.SCANNING_FOR_INCOMING;for(var i=this.resultAreaEdgeList.size()-1;i>=0;i--){var nextOut=this.resultAreaEdgeList.get(i);var nextIn=nextOut.getSym();if(firstOut===null&&nextOut.getEdgeRing()===er)
firstOut=nextOut;switch(state){case this.SCANNING_FOR_INCOMING:if(nextIn.getEdgeRing()!=er)
continue;incoming=nextIn;state=this.LINKING_TO_OUTGOING;break;case this.LINKING_TO_OUTGOING:if(nextOut.getEdgeRing()!==er)
continue;incoming.setNextMin(nextOut);state=this.SCANNING_FOR_INCOMING;break;}}
if(state===this.LINKING_TO_OUTGOING){Assert.isTrue(firstOut!==null,'found null for first outgoing dirEdge');Assert.isTrue(firstOut.getEdgeRing()===er,'unable to link last incoming dirEdge');incoming.setNextMin(firstOut);}};jsts.geomgraph.DirectedEdgeStar.prototype.linkAllDirectedEdges=function(){this.getEdges();var prevOut=null;var firstIn=null;for(var i=this.edgeList.size()-1;i>=0;i--){var nextOut=this.edgeList.get(i);var nextIn=nextOut.getSym();if(firstIn===null)
firstIn=nextIn;if(prevOut!==null)
nextIn.setNext(prevOut);prevOut=nextOut;}
firstIn.setNext(prevOut);};jsts.geomgraph.DirectedEdgeStar.prototype.findCoveredLineEdges=function(){var startLoc=Location.NONE;for(var it=this.iterator();it.hasNext();){var nextOut=it.next();var nextIn=nextOut.getSym();if(!nextOut.isLineEdge()){if(nextOut.isInResult()){startLoc=Location.INTERIOR;break;}
if(nextIn.isInResult()){startLoc=Location.EXTERIOR;break;}}}
if(startLoc===Location.NONE)
return;var currLoc=startLoc;for(var it=this.iterator();it.hasNext();){var nextOut=it.next();var nextIn=nextOut.getSym();if(nextOut.isLineEdge()){nextOut.getEdge().setCovered(currLoc===Location.INTERIOR);}else{if(nextOut.isInResult())
currLoc=Location.EXTERIOR;if(nextIn.isInResult())
currLoc=Location.INTERIOR;}}};jsts.geomgraph.DirectedEdgeStar.prototype.computeDepths=function(de){if(arguments.length===2){this.computeDepths2.apply(this,arguments);return;}
var edgeIndex=this.findIndex(de);var label=de.getLabel();var startDepth=de.getDepth(Position.LEFT);var targetLastDepth=de.getDepth(Position.RIGHT);var nextDepth=this.computeDepths2(edgeIndex+1,this.edgeList.size(),startDepth);var lastDepth=this.computeDepths2(0,edgeIndex,nextDepth);if(lastDepth!=targetLastDepth)
throw new jsts.error.TopologyError('depth mismatch at '+
de.getCoordinate());};jsts.geomgraph.DirectedEdgeStar.prototype.computeDepths2=function(startIndex,endIndex,startDepth){var currDepth=startDepth;for(var i=startIndex;i<endIndex;i++){var nextDe=this.edgeList.get(i);var label=nextDe.getLabel();nextDe.setEdgeDepths(Position.RIGHT,currDepth);currDepth=nextDe.getDepth(Position.LEFT);}
return currDepth;};})();jsts.algorithm.CentroidLine=function(){this.centSum=new jsts.geom.Coordinate();};jsts.algorithm.CentroidLine.prototype.centSum=null;jsts.algorithm.CentroidLine.prototype.totalLength=0.0;jsts.algorithm.CentroidLine.prototype.add=function(geom){if(geom instanceof Array){this.add2.apply(this,arguments);return;}
if(geom instanceof jsts.geom.LineString){this.add(geom.getCoordinates());}else if(geom instanceof jsts.geom.Polygon){var poly=geom;this.add(poly.getExteriorRing().getCoordinates());for(var i=0;i<poly.getNumInteriorRing();i++){this.add(poly.getInteriorRingN(i).getCoordinates());}}else if(geom instanceof jsts.geom.GeometryCollection||geom instanceof jsts.geom.MultiPoint||geom instanceof jsts.geom.MultiLineString||geom instanceof jsts.geom.MultiPolygon){var gc=geom;for(var i=0;i<gc.getNumGeometries();i++){this.add(gc.getGeometryN(i));}}};jsts.algorithm.CentroidLine.prototype.getCentroid=function(){var cent=new jsts.geom.Coordinate();cent.x=this.centSum.x/this.totalLength;cent.y=this.centSum.y/this.totalLength;return cent;};jsts.algorithm.CentroidLine.prototype.add2=function(pts){for(var i=0;i<pts.length-1;i++){var segmentLen=pts[i].distance(pts[i+1]);this.totalLength+=segmentLen;var midx=(pts[i].x+pts[i+1].x)/2;this.centSum.x+=segmentLen*midx;var midy=(pts[i].y+pts[i+1].y)/2;this.centSum.y+=segmentLen*midy;}};jsts.algorithm.PointLocator=function(boundaryRule){this.boundaryRule=boundaryRule?boundaryRule:jsts.algorithm.BoundaryNodeRule.OGC_SFS_BOUNDARY_RULE;};jsts.algorithm.PointLocator.prototype.boundaryRule=null;jsts.algorithm.PointLocator.prototype.isIn=null;jsts.algorithm.PointLocator.prototype.numBoundaries=null;jsts.algorithm.PointLocator.prototype.intersects=function(p,geom){return this.locate(p,geom)!==jsts.geom.Location.EXTERIOR;};jsts.algorithm.PointLocator.prototype.locate=function(p,geom){if(geom.isEmpty())
return jsts.geom.Location.EXTERIOR;if(geom instanceof jsts.geom.Point){return this.locate2(p,geom);}else if(geom instanceof jsts.geom.LineString){return this.locate3(p,geom);}else if(geom instanceof jsts.geom.Polygon){return this.locate4(p,geom);}
this.isIn=false;this.numBoundaries=0;this.computeLocation(p,geom);if(this.boundaryRule.isInBoundary(this.numBoundaries))
return jsts.geom.Location.BOUNDARY;if(this.numBoundaries>0||this.isIn)
return jsts.geom.Location.INTERIOR;return jsts.geom.Location.EXTERIOR;};jsts.algorithm.PointLocator.prototype.computeLocation=function(p,geom){if(geom instanceof jsts.geom.Point||geom instanceof jsts.geom.LineString||geom instanceof jsts.geom.Polygon){this.updateLocationInfo(this.locate(p,geom));}else if(geom instanceof jsts.geom.MultiLineString){var ml=geom;for(var i=0;i<ml.getNumGeometries();i++){var l=ml.getGeometryN(i);this.updateLocationInfo(this.locate(p,l));}}else if(geom instanceof jsts.geom.MultiPolygon){var mpoly=geom;for(var i=0;i<mpoly.getNumGeometries();i++){var poly=mpoly.getGeometryN(i);this.updateLocationInfo(this.locate(p,poly));}}else if(geom instanceof jsts.geom.MultiPoint||geom instanceof jsts.geom.GeometryCollection){for(var i=0;i<geom.getNumGeometries();i++){var part=geom.getGeometryN(i);if(part!==geom){this.computeLocation(p,part);}}}};jsts.algorithm.PointLocator.prototype.updateLocationInfo=function(loc){if(loc===jsts.geom.Location.INTERIOR)
this.isIn=true;if(loc===jsts.geom.Location.BOUNDARY)
this.numBoundaries++;};jsts.algorithm.PointLocator.prototype.locate2=function(p,pt){var ptCoord=pt.getCoordinate();if(ptCoord.equals2D(p))
return jsts.geom.Location.INTERIOR;return jsts.geom.Location.EXTERIOR;};jsts.algorithm.PointLocator.prototype.locate3=function(p,l){if(!l.getEnvelopeInternal().intersects(p))
return jsts.geom.Location.EXTERIOR;var pt=l.getCoordinates();if(!l.isClosed()){if(p.equals(pt[0])||p.equals(pt[pt.length-1])){return jsts.geom.Location.BOUNDARY;}}
if(jsts.algorithm.CGAlgorithms.isOnLine(p,pt))
return jsts.geom.Location.INTERIOR;return jsts.geom.Location.EXTERIOR;};jsts.algorithm.PointLocator.prototype.locateInPolygonRing=function(p,ring){if(!ring.getEnvelopeInternal().intersects(p))
return jsts.geom.Location.EXTERIOR;return jsts.algorithm.CGAlgorithms.locatePointInRing(p,ring.getCoordinates());};jsts.algorithm.PointLocator.prototype.locate4=function(p,poly){if(poly.isEmpty())
return jsts.geom.Location.EXTERIOR;var shell=poly.getExteriorRing();var shellLoc=this.locateInPolygonRing(p,shell);if(shellLoc===jsts.geom.Location.EXTERIOR)
return jsts.geom.Location.EXTERIOR;if(shellLoc===jsts.geom.Location.BOUNDARY)
return jsts.geom.Location.BOUNDARY;for(var i=0;i<poly.getNumInteriorRing();i++){var hole=poly.getInteriorRingN(i);var holeLoc=this.locateInPolygonRing(p,hole);if(holeLoc===jsts.geom.Location.INTERIOR)
return jsts.geom.Location.EXTERIOR;if(holeLoc===jsts.geom.Location.BOUNDARY)
return jsts.geom.Location.BOUNDARY;}
return jsts.geom.Location.INTERIOR;};(function(){var ArrayList=javascript.util.ArrayList;var TreeMap=javascript.util.TreeMap;jsts.geomgraph.EdgeList=function(){this.edges=new ArrayList();this.ocaMap=new TreeMap();};jsts.geomgraph.EdgeList.prototype.edges=null;jsts.geomgraph.EdgeList.prototype.ocaMap=null;jsts.geomgraph.EdgeList.prototype.add=function(e){this.edges.add(e);var oca=new jsts.noding.OrientedCoordinateArray(e.getCoordinates());this.ocaMap.put(oca,e);};jsts.geomgraph.EdgeList.prototype.addAll=function(edgeColl){for(var i=edgeColl.iterator();i.hasNext();){this.add(i.next());}};jsts.geomgraph.EdgeList.prototype.getEdges=function(){return this.edges;};jsts.geomgraph.EdgeList.prototype.findEqualEdge=function(e){var oca=new jsts.noding.OrientedCoordinateArray(e.getCoordinates());var matchEdge=this.ocaMap.get(oca);return matchEdge;};jsts.geomgraph.EdgeList.prototype.getEdges=function(){return this.edges;};jsts.geomgraph.EdgeList.prototype.iterator=function(){return this.edges.iterator();};jsts.geomgraph.EdgeList.prototype.get=function(i){return this.edges.get(i);};jsts.geomgraph.EdgeList.prototype.findEdgeIndex=function(e){for(var i=0;i<this.edges.size();i++){if(this.edges.get(i).equals(e))
return i;}
return-1;};})();(function(){var Location=jsts.geom.Location;var ArrayList=javascript.util.ArrayList;var TreeMap=javascript.util.TreeMap;jsts.geomgraph.NodeMap=function(nodeFactory){this.nodeMap=new TreeMap();this.nodeFact=nodeFactory;};jsts.geomgraph.NodeMap.prototype.nodeMap=null;jsts.geomgraph.NodeMap.prototype.nodeFact=null;jsts.geomgraph.NodeMap.prototype.addNode=function(arg){var node,coord;if(arg instanceof jsts.geom.Coordinate){coord=arg;node=this.nodeMap.get(coord);if(node===null){node=this.nodeFact.createNode(coord);this.nodeMap.put(coord,node);}
return node;}else if(arg instanceof jsts.geomgraph.Node){var n=arg;coord=n.getCoordinate();node=this.nodeMap.get(coord);if(node===null){this.nodeMap.put(coord,n);return n;}
node.mergeLabel(n);return node;}};jsts.geomgraph.NodeMap.prototype.add=function(e){var p=e.getCoordinate();var n=this.addNode(p);n.add(e);};jsts.geomgraph.NodeMap.prototype.find=function(coord){return this.nodeMap.get(coord);};jsts.geomgraph.NodeMap.prototype.values=function(){return this.nodeMap.values();};jsts.geomgraph.NodeMap.prototype.iterator=function(){return this.values().iterator();};jsts.geomgraph.NodeMap.prototype.getBoundaryNodes=function(geomIndex){var bdyNodes=new ArrayList();for(var i=this.iterator();i.hasNext();){var node=i.next();if(node.getLabel().getLocation(geomIndex)===Location.BOUNDARY){bdyNodes.add(node);}}
return bdyNodes;};})();(function(){var ArrayList=javascript.util.ArrayList;jsts.geomgraph.PlanarGraph=function(nodeFactory){this.edges=new ArrayList();this.edgeEndList=new ArrayList();this.nodes=new jsts.geomgraph.NodeMap(nodeFactory||new jsts.geomgraph.NodeFactory());};jsts.geomgraph.PlanarGraph.prototype.edges=null;jsts.geomgraph.PlanarGraph.prototype.nodes=null;jsts.geomgraph.PlanarGraph.prototype.edgeEndList=null;jsts.geomgraph.PlanarGraph.linkResultDirectedEdges=function(nodes){for(var nodeit=nodes.iterator();nodeit.hasNext();){var node=nodeit.next();node.getEdges().linkResultDirectedEdges();}};jsts.geomgraph.PlanarGraph.prototype.getEdgeIterator=function(){return this.edges.iterator();};jsts.geomgraph.PlanarGraph.prototype.getEdgeEnds=function(){return this.edgeEndList;};jsts.geomgraph.PlanarGraph.prototype.isBoundaryNode=function(geomIndex,coord){var node=this.nodes.find(coord);if(node===null)
return false;var label=node.getLabel();if(label!==null&&label.getLocation(geomIndex)===jsts.geom.Location.BOUNDARY)
return true;return false;};jsts.geomgraph.PlanarGraph.prototype.insertEdge=function(e){this.edges.add(e);};jsts.geomgraph.PlanarGraph.prototype.add=function(e){this.nodes.add(e);this.edgeEndList.add(e);};jsts.geomgraph.PlanarGraph.prototype.getNodeIterator=function(){return this.nodes.iterator();};jsts.geomgraph.PlanarGraph.prototype.getNodes=function(){return this.nodes.values();};jsts.geomgraph.PlanarGraph.prototype.addNode=function(node){return this.nodes.addNode(node);};jsts.geomgraph.PlanarGraph.prototype.addEdges=function(edgesToAdd){for(var it=edgesToAdd.iterator();it.hasNext();){var e=it.next();this.edges.add(e);var de1=new jsts.geomgraph.DirectedEdge(e,true);var de2=new jsts.geomgraph.DirectedEdge(e,false);de1.setSym(de2);de2.setSym(de1);this.add(de1);this.add(de2);}};jsts.geomgraph.PlanarGraph.prototype.linkResultDirectedEdges=function(){for(var nodeit=this.nodes.iterator();nodeit.hasNext();){var node=nodeit.next();node.getEdges().linkResultDirectedEdges();}};jsts.geomgraph.PlanarGraph.prototype.findEdgeInSameDirection=function(p0,p1){var i=0,il=this.edges.size(),e,eCoord;for(i;i<il;i++){e=this.edges.get(i);eCoord=e.getCoordinates();if(this.matchInSameDirection(p0,p1,eCoord[0],eCoord[1])){return e;}
if(this.matchInSameDirection(p0,p1,eCoord[eCoord.length-1],eCoord[eCoord.length-2])){return e;}}
return null;};jsts.geomgraph.PlanarGraph.prototype.matchInSameDirection=function(p0,p1,ep0,ep1){if(!p0.equals(ep0)){return false;}
if(jsts.algorithm.CGAlgorithms.computeOrientation(p0,p1,ep1)===jsts.algorithm.CGAlgorithms.COLLINEAR&&jsts.geomgraph.Quadrant.quadrant(p0,p1)===jsts.geomgraph.Quadrant.quadrant(ep0,ep1)){return true;}
return false;};jsts.geomgraph.PlanarGraph.prototype.findEdgeEnd=function(e){for(var i=this.getEdgeEnds().iterator();i.hasNext();){var ee=i.next();if(ee.getEdge()===e){return ee;}}
return null;};})();jsts.algorithm.LineIntersector=function(){this.inputLines=[[],[]];this.intPt=[null,null];this.pa=this.intPt[0];this.pb=this.intPt[1];this.result=jsts.algorithm.LineIntersector.NO_INTERSECTION;};jsts.algorithm.LineIntersector.NO_INTERSECTION=0;jsts.algorithm.LineIntersector.POINT_INTERSECTION=1;jsts.algorithm.LineIntersector.COLLINEAR_INTERSECTION=2;jsts.algorithm.LineIntersector.prototype.setPrecisionModel=function(precisionModel){this.precisionModel=precisionModel;};jsts.algorithm.LineIntersector.prototype.getEndpoint=function(segmentIndex,ptIndex){return this.inputLines[segmentIndex][ptIndex];};jsts.algorithm.LineIntersector.computeEdgeDistance=function(p,p0,p1){var dx=Math.abs(p1.x-p0.x);var dy=Math.abs(p1.y-p0.y);var dist=-1.0;if(p.equals(p0)){dist=0.0;}else if(p.equals(p1)){if(dx>dy){dist=dx;}else{dist=dy;}}else{var pdx=Math.abs(p.x-p0.x);var pdy=Math.abs(p.y-p0.y);if(dx>dy){dist=pdx;}else{dist=pdy;}
if(dist===0.0&&!p.equals(p0)){dist=Math.max(pdx,pdy);}}
if(dist===0.0&&!p.equals(p0)){throw new jsts.error.IllegalArgumentError('Bad distance calculation');}
return dist;};jsts.algorithm.LineIntersector.nonRobustComputeEdgeDistance=function(p,p1,p2){var dx=p.x-p1.x;var dy=p.y-p1.y;var dist=Math.sqrt(dx*dx+dy*dy);if(!(dist===0.0&&!p.equals(p1))){throw new jsts.error.IllegalArgumentError('Invalid distance calculation');}
return dist;};jsts.algorithm.LineIntersector.prototype.result=null;jsts.algorithm.LineIntersector.prototype.inputLines=null;jsts.algorithm.LineIntersector.prototype.intPt=null;jsts.algorithm.LineIntersector.prototype.intLineIndex=null;jsts.algorithm.LineIntersector.prototype._isProper=null;jsts.algorithm.LineIntersector.prototype.pa=null;jsts.algorithm.LineIntersector.prototype.pb=null;jsts.algorithm.LineIntersector.prototype.precisionModel=null;jsts.algorithm.LineIntersector.prototype.computeIntersection=function(p,p1,p2){throw new jsts.error.AbstractMethodInvocationError();};jsts.algorithm.LineIntersector.prototype.isCollinear=function(){return this.result===jsts.algorithm.LineIntersector.COLLINEAR_INTERSECTION;};jsts.algorithm.LineIntersector.prototype.computeIntersection=function(p1,p2,p3,p4){this.inputLines[0][0]=p1;this.inputLines[0][1]=p2;this.inputLines[1][0]=p3;this.inputLines[1][1]=p4;this.result=this.computeIntersect(p1,p2,p3,p4);};jsts.algorithm.LineIntersector.prototype.computeIntersect=function(p1,p2,q1,q2){throw new jsts.error.AbstractMethodInvocationError();};jsts.algorithm.LineIntersector.prototype.isEndPoint=function(){return this.hasIntersection()&&!this._isProper;};jsts.algorithm.LineIntersector.prototype.hasIntersection=function(){return this.result!==jsts.algorithm.LineIntersector.NO_INTERSECTION;};jsts.algorithm.LineIntersector.prototype.getIntersectionNum=function(){return this.result;};jsts.algorithm.LineIntersector.prototype.getIntersection=function(intIndex){return this.intPt[intIndex];};jsts.algorithm.LineIntersector.prototype.computeIntLineIndex=function(){if(this.intLineIndex===null){this.intLineIndex=[[],[]];this.computeIntLineIndex(0);this.computeIntLineIndex(1);}};jsts.algorithm.LineIntersector.prototype.isIntersection=function(pt){var i;for(i=0;i<this.result;i++){if(this.intPt[i].equals2D(pt)){return true;}}
return false;};jsts.algorithm.LineIntersector.prototype.isInteriorIntersection=function(){if(arguments.length===1){return this.isInteriorIntersection2.apply(this,arguments);}
if(this.isInteriorIntersection(0)){return true;}
if(this.isInteriorIntersection(1)){return true;}
return false;};jsts.algorithm.LineIntersector.prototype.isInteriorIntersection2=function(inputLineIndex){var i;for(i=0;i<this.result;i++){if(!(this.intPt[i].equals2D(this.inputLines[inputLineIndex][0])||this.intPt[i].equals2D(this.inputLines[inputLineIndex][1]))){return true;}}
return false;};jsts.algorithm.LineIntersector.prototype.isProper=function(){return this.hasIntersection()&&this._isProper;};jsts.algorithm.LineIntersector.prototype.getIntersectionAlongSegment=function(segmentIndex,intIndex){this.computeIntLineIndex();return this.intPt[intLineIndex[segmentIndex][intIndex]];};jsts.algorithm.LineIntersector.prototype.getIndexAlongSegment=function(segmentIndex,intIndex){this.computeIntLineIndex();return this.intLineIndex[segmentIndex][intIndex];};jsts.algorithm.LineIntersector.prototype.computeIntLineIndex=function(segmentIndex){var dist0=this.getEdgeDistance(segmentIndex,0);var dist1=this.getEdgeDistance(segmentIndex,1);if(dist0>dist1){this.intLineIndex[segmentIndex][0]=0;this.intLineIndex[segmentIndex][1]=1;}else{this.intLineIndex[segmentIndex][0]=1;this.intLineIndex[segmentIndex][1]=0;}};jsts.algorithm.LineIntersector.prototype.getEdgeDistance=function(segmentIndex,intIndex){var dist=jsts.algorithm.LineIntersector.computeEdgeDistance(this.intPt[intIndex],this.inputLines[segmentIndex][0],this.inputLines[segmentIndex][1]);return dist;};jsts.algorithm.RobustLineIntersector=function(){jsts.algorithm.RobustLineIntersector.prototype.constructor.call(this);};jsts.algorithm.RobustLineIntersector.prototype=new jsts.algorithm.LineIntersector();jsts.algorithm.RobustLineIntersector.prototype.computeIntersection=function(p,p1,p2){if(arguments.length===4){jsts.algorithm.LineIntersector.prototype.computeIntersection.apply(this,arguments);return;}
this._isProper=false;if(jsts.geom.Envelope.intersects(p1,p2,p)){if((jsts.algorithm.CGAlgorithms.orientationIndex(p1,p2,p)===0)&&(jsts.algorithm.CGAlgorithms.orientationIndex(p2,p1,p)===0)){this._isProper=true;if(p.equals(p1)||p.equals(p2)){this._isProper=false;}
this.result=jsts.algorithm.LineIntersector.POINT_INTERSECTION;return;}}
this.result=jsts.algorithm.LineIntersector.NO_INTERSECTION;};jsts.algorithm.RobustLineIntersector.prototype.computeIntersect=function(p1,p2,q1,q2){this._isProper=false;if(!jsts.geom.Envelope.intersects(p1,p2,q1,q2)){return jsts.algorithm.LineIntersector.NO_INTERSECTION;}
var Pq1=jsts.algorithm.CGAlgorithms.orientationIndex(p1,p2,q1);var Pq2=jsts.algorithm.CGAlgorithms.orientationIndex(p1,p2,q2);if((Pq1>0&&Pq2>0)||(Pq1<0&&Pq2<0)){return jsts.algorithm.LineIntersector.NO_INTERSECTION;}
var Qp1=jsts.algorithm.CGAlgorithms.orientationIndex(q1,q2,p1);var Qp2=jsts.algorithm.CGAlgorithms.orientationIndex(q1,q2,p2);if((Qp1>0&&Qp2>0)||(Qp1<0&&Qp2<0)){return jsts.algorithm.LineIntersector.NO_INTERSECTION;}
var collinear=Pq1===0&&Pq2===0&&Qp1===0&&Qp2===0;if(collinear){return this.computeCollinearIntersection(p1,p2,q1,q2);}
if(Pq1===0||Pq2===0||Qp1===0||Qp2===0){this._isProper=false;if(p1.equals2D(q1)||p1.equals2D(q2)){this.intPt[0]=p1;}else if(p2.equals2D(q1)||p2.equals2D(q2)){this.intPt[0]=p2;}
else if(Pq1===0){this.intPt[0]=new jsts.geom.Coordinate(q1);}else if(Pq2===0){this.intPt[0]=new jsts.geom.Coordinate(q2);}else if(Qp1===0){this.intPt[0]=new jsts.geom.Coordinate(p1);}else if(Qp2===0){this.intPt[0]=new jsts.geom.Coordinate(p2);}}else{this._isProper=true;this.intPt[0]=this.intersection(p1,p2,q1,q2);}
return jsts.algorithm.LineIntersector.POINT_INTERSECTION;};jsts.algorithm.RobustLineIntersector.prototype.computeCollinearIntersection=function(p1,p2,q1,q2){var p1q1p2=jsts.geom.Envelope.intersects(p1,p2,q1);var p1q2p2=jsts.geom.Envelope.intersects(p1,p2,q2);var q1p1q2=jsts.geom.Envelope.intersects(q1,q2,p1);var q1p2q2=jsts.geom.Envelope.intersects(q1,q2,p2);if(p1q1p2&&p1q2p2){this.intPt[0]=q1;this.intPt[1]=q2;return jsts.algorithm.LineIntersector.COLLINEAR_INTERSECTION;}
if(q1p1q2&&q1p2q2){this.intPt[0]=p1;this.intPt[1]=p2;return jsts.algorithm.LineIntersector.COLLINEAR_INTERSECTION;}
if(p1q1p2&&q1p1q2){this.intPt[0]=q1;this.intPt[1]=p1;return q1.equals(p1)&&!p1q2p2&&!q1p2q2?jsts.algorithm.LineIntersector.POINT_INTERSECTION:jsts.algorithm.LineIntersector.COLLINEAR_INTERSECTION;}
if(p1q1p2&&q1p2q2){this.intPt[0]=q1;this.intPt[1]=p2;return q1.equals(p2)&&!p1q2p2&&!q1p1q2?jsts.algorithm.LineIntersector.POINT_INTERSECTION:jsts.algorithm.LineIntersector.COLLINEAR_INTERSECTION;}
if(p1q2p2&&q1p1q2){this.intPt[0]=q2;this.intPt[1]=p1;return q2.equals(p1)&&!p1q1p2&&!q1p2q2?jsts.algorithm.LineIntersector.POINT_INTERSECTION:jsts.algorithm.LineIntersector.COLLINEAR_INTERSECTION;}
if(p1q2p2&&q1p2q2){this.intPt[0]=q2;this.intPt[1]=p2;return q2.equals(p2)&&!p1q1p2&&!q1p1q2?jsts.algorithm.LineIntersector.POINT_INTERSECTION:jsts.algorithm.LineIntersector.COLLINEAR_INTERSECTION;}
return jsts.algorithm.LineIntersector.NO_INTERSECTION;};jsts.algorithm.RobustLineIntersector.prototype.intersection=function(p1,p2,q1,q2){var intPt=this.intersectionWithNormalization(p1,p2,q1,q2);if(!this.isInSegmentEnvelopes(intPt)){intPt=jsts.algorithm.CentralEndpointIntersector.getIntersection(p1,p2,q1,q2);}
if(this.precisionModel!==null){this.precisionModel.makePrecise(intPt);}
return intPt;};jsts.algorithm.RobustLineIntersector.prototype.intersectionWithNormalization=function(p1,p2,q1,q2){var n1=new jsts.geom.Coordinate(p1);var n2=new jsts.geom.Coordinate(p2);var n3=new jsts.geom.Coordinate(q1);var n4=new jsts.geom.Coordinate(q2);var normPt=new jsts.geom.Coordinate();this.normalizeToEnvCentre(n1,n2,n3,n4,normPt);var intPt=this.safeHCoordinateIntersection(n1,n2,n3,n4);intPt.x+=normPt.x;intPt.y+=normPt.y;return intPt;};jsts.algorithm.RobustLineIntersector.prototype.safeHCoordinateIntersection=function(p1,p2,q1,q2){var intPt=null;try{intPt=jsts.algorithm.HCoordinate.intersection(p1,p2,q1,q2);}catch(e){if(e instanceof jsts.error.NotRepresentableError){intPt=jsts.algorithm.CentralEndpointIntersector.getIntersection(p1,p2,q1,q2);}else{throw e;}}
return intPt;};jsts.algorithm.RobustLineIntersector.prototype.normalizeToMinimum=function(n1,n2,n3,n4,normPt){normPt.x=this.smallestInAbsValue(n1.x,n2.x,n3.x,n4.x);normPt.y=this.smallestInAbsValue(n1.y,n2.y,n3.y,n4.y);n1.x-=normPt.x;n1.y-=normPt.y;n2.x-=normPt.x;n2.y-=normPt.y;n3.x-=normPt.x;n3.y-=normPt.y;n4.x-=normPt.x;n4.y-=normPt.y;};jsts.algorithm.RobustLineIntersector.prototype.normalizeToEnvCentre=function(n00,n01,n10,n11,normPt){var minX0=n00.x<n01.x?n00.x:n01.x;var minY0=n00.y<n01.y?n00.y:n01.y;var maxX0=n00.x>n01.x?n00.x:n01.x;var maxY0=n00.y>n01.y?n00.y:n01.y;var minX1=n10.x<n11.x?n10.x:n11.x;var minY1=n10.y<n11.y?n10.y:n11.y;var maxX1=n10.x>n11.x?n10.x:n11.x;var maxY1=n10.y>n11.y?n10.y:n11.y;var intMinX=minX0>minX1?minX0:minX1;var intMaxX=maxX0<maxX1?maxX0:maxX1;var intMinY=minY0>minY1?minY0:minY1;var intMaxY=maxY0<maxY1?maxY0:maxY1;var intMidX=(intMinX+intMaxX)/2.0;var intMidY=(intMinY+intMaxY)/2.0;normPt.x=intMidX;normPt.y=intMidY;n00.x-=normPt.x;n00.y-=normPt.y;n01.x-=normPt.x;n01.y-=normPt.y;n10.x-=normPt.x;n10.y-=normPt.y;n11.x-=normPt.x;n11.y-=normPt.y;};jsts.algorithm.RobustLineIntersector.prototype.smallestInAbsValue=function(x1,x2,x3,x4){var x=x1;var xabs=Math.abs(x);if(Math.abs(x2)<xabs){x=x2;xabs=Math.abs(x2);}
if(Math.abs(x3)<xabs){x=x3;xabs=Math.abs(x3);}
if(Math.abs(x4)<xabs){x=x4;}
return x;};jsts.algorithm.RobustLineIntersector.prototype.isInSegmentEnvelopes=function(intPt){var env0=new jsts.geom.Envelope(this.inputLines[0][0],this.inputLines[0][1]);var env1=new jsts.geom.Envelope(this.inputLines[1][0],this.inputLines[1][1]);return env0.contains(intPt)&&env1.contains(intPt);};jsts.noding.SegmentIntersector=function(){};jsts.noding.SegmentIntersector.prototype.processIntersections=jsts.abstractFunc;jsts.noding.SegmentIntersector.prototype.isDone=jsts.abstractFunc;(function(){var SegmentIntersector=jsts.noding.SegmentIntersector;var ArrayList=javascript.util.ArrayList;jsts.noding.InteriorIntersectionFinder=function(li){this.li=li;this.intersections=new ArrayList();this.interiorIntersection=null;};jsts.noding.InteriorIntersectionFinder.prototype=new SegmentIntersector();jsts.noding.InteriorIntersectionFinder.constructor=jsts.noding.InteriorIntersectionFinder;jsts.noding.InteriorIntersectionFinder.prototype.findAllIntersections=false;jsts.noding.InteriorIntersectionFinder.prototype.isCheckEndSegmentsOnly=false;jsts.noding.InteriorIntersectionFinder.prototype.li=null;jsts.noding.InteriorIntersectionFinder.prototype.interiorIntersection=null;jsts.noding.InteriorIntersectionFinder.prototype.intSegments=null;jsts.noding.InteriorIntersectionFinder.prototype.intersections=null;jsts.noding.InteriorIntersectionFinder.prototype.setFindAllIntersections=function(findAllIntersections){this.findAllIntersections=findAllIntersections;};jsts.noding.InteriorIntersectionFinder.prototype.getIntersections=function(){return intersections;};jsts.noding.InteriorIntersectionFinder.prototype.setCheckEndSegmentsOnly=function(isCheckEndSegmentsOnly){this.isCheckEndSegmentsOnly=isCheckEndSegmentsOnly;}
jsts.noding.InteriorIntersectionFinder.prototype.hasIntersection=function(){return this.interiorIntersection!=null;};jsts.noding.InteriorIntersectionFinder.prototype.getInteriorIntersection=function(){return this.interiorIntersection;};jsts.noding.InteriorIntersectionFinder.prototype.getIntersectionSegments=function(){return this.intSegments;};jsts.noding.InteriorIntersectionFinder.prototype.processIntersections=function(e0,segIndex0,e1,segIndex1){if(this.hasIntersection())
return;if(e0==e1&&segIndex0==segIndex1)
return;if(this.isCheckEndSegmentsOnly){var isEndSegPresent=this.isEndSegment(e0,segIndex0)||isEndSegment(e1,segIndex1);if(!isEndSegPresent)
return;}
var p00=e0.getCoordinates()[segIndex0];var p01=e0.getCoordinates()[segIndex0+1];var p10=e1.getCoordinates()[segIndex1];var p11=e1.getCoordinates()[segIndex1+1];this.li.computeIntersection(p00,p01,p10,p11);if(this.li.hasIntersection()){if(this.li.isInteriorIntersection()){this.intSegments=[];this.intSegments[0]=p00;this.intSegments[1]=p01;this.intSegments[2]=p10;this.intSegments[3]=p11;this.interiorIntersection=this.li.getIntersection(0);this.intersections.add(this.interiorIntersection);}}};jsts.noding.InteriorIntersectionFinder.prototype.isEndSegment=function(segStr,index){if(index==0)
return true;if(index>=segStr.size()-2)
return true;return false;};jsts.noding.InteriorIntersectionFinder.prototype.isDone=function(){if(this.findAllIntersections)
return false;return this.interiorIntersection!=null;};})();(function(){jsts.noding.Noder=function(){};jsts.noding.Noder.prototype.computeNodes=jsts.abstractFunc;jsts.noding.Noder.prototype.getNodedSubstrings=jsts.abstractFunc;})();(function(){var Noder=jsts.noding.Noder;jsts.noding.SinglePassNoder=function(){};jsts.noding.SinglePassNoder.prototype=new Noder();jsts.noding.SinglePassNoder.constructor=jsts.noding.SinglePassNoder;jsts.noding.SinglePassNoder.prototype.segInt=null;jsts.noding.SinglePassNoder.prototype.setSegmentIntersector=function(segInt){this.segInt=segInt;};})();jsts.index.SpatialIndex=function(){};jsts.index.SpatialIndex.prototype.insert=function(itemEnv,item){throw new jsts.error.AbstractMethodInvocationError();};jsts.index.SpatialIndex.prototype.query=function(searchEnv,visitor){throw new jsts.error.AbstractMethodInvocationError();};jsts.index.SpatialIndex.prototype.remove=function(itemEnv,item){throw new jsts.error.AbstractMethodInvocationError();};jsts.index.strtree.AbstractSTRtree=function(nodeCapacity){if(nodeCapacity===undefined)
return;this.itemBoundables=[];jsts.util.Assert.isTrue(nodeCapacity>1,'Node capacity must be greater than 1');this.nodeCapacity=nodeCapacity;};jsts.index.strtree.AbstractSTRtree.IntersectsOp=function(){};jsts.index.strtree.AbstractSTRtree.IntersectsOp.prototype.intersects=function(aBounds,bBounds){throw new jsts.error.AbstractMethodInvocationError();};jsts.index.strtree.AbstractSTRtree.prototype.root=null;jsts.index.strtree.AbstractSTRtree.prototype.built=false;jsts.index.strtree.AbstractSTRtree.prototype.itemBoundables=null;jsts.index.strtree.AbstractSTRtree.prototype.nodeCapacity=null;jsts.index.strtree.AbstractSTRtree.prototype.build=function(){jsts.util.Assert.isTrue(!this.built);this.root=this.itemBoundables.length===0?this.createNode(0):this.createHigherLevels(this.itemBoundables,-1);this.built=true;};jsts.index.strtree.AbstractSTRtree.prototype.createNode=function(level){throw new jsts.error.AbstractMethodInvocationError();};jsts.index.strtree.AbstractSTRtree.prototype.createParentBoundables=function(childBoundables,newLevel){jsts.util.Assert.isTrue(!(childBoundables.length===0));var parentBoundables=[];parentBoundables.push(this.createNode(newLevel));var sortedChildBoundables=[];for(var i=0;i<childBoundables.length;i++){sortedChildBoundables.push(childBoundables[i]);}
sortedChildBoundables.sort(this.getComparator());for(var i=0;i<sortedChildBoundables.length;i++){var childBoundable=sortedChildBoundables[i];if(this.lastNode(parentBoundables).getChildBoundables().length===this.getNodeCapacity()){parentBoundables.push(this.createNode(newLevel));}
this.lastNode(parentBoundables).addChildBoundable(childBoundable);}
return parentBoundables;};jsts.index.strtree.AbstractSTRtree.prototype.lastNode=function(nodes){return nodes[nodes.length-1];};jsts.index.strtree.AbstractSTRtree.prototype.compareDoubles=function(a,b){return a>b?1:a<b?-1:0;};jsts.index.strtree.AbstractSTRtree.prototype.createHigherLevels=function(boundablesOfALevel,level){jsts.util.Assert.isTrue(!(boundablesOfALevel.length===0));var parentBoundables=this.createParentBoundables(boundablesOfALevel,level+1);if(parentBoundables.length===1){return parentBoundables[0];}
return this.createHigherLevels(parentBoundables,level+1);};jsts.index.strtree.AbstractSTRtree.prototype.getRoot=function(){if(!this.built)
this.build();return this.root;};jsts.index.strtree.AbstractSTRtree.prototype.getNodeCapacity=function(){return this.nodeCapacity;};jsts.index.strtree.AbstractSTRtree.prototype.size=function(){if(arguments.length===1){return this.size2(arguments[0]);}
if(!this.built){this.build();}
if(this.itemBoundables.length===0){return 0;}
return this.size2(root);};jsts.index.strtree.AbstractSTRtree.prototype.size2=function(node){var size=0;var childBoundables=node.getChildBoundables();for(var i=0;i<childBoundables.length;i++){var childBoundable=childBoundables[i];if(childBoundable instanceof jsts.index.strtree.AbstractNode){size+=this.size(childBoundable);}else if(childBoundable instanceof jsts.index.strtree.ItemBoundable){size+=1;}}
return size;};jsts.index.strtree.AbstractSTRtree.prototype.depth=function(){if(arguments.length===1){return this.depth2(arguments[0]);}
if(!this.built){this.build();}
if(this.itemBoundables.length===0){return 0;}
return this.depth2(root);};jsts.index.strtree.AbstractSTRtree.prototype.depth2=function(){var maxChildDepth=0;var childBoundables=node.getChildBoundables();for(var i=0;i<childBoundables.length;i++){var childBoundable=childBoundables[i];if(childBoundable instanceof jsts.index.strtree.AbstractNode){var childDepth=this.depth(childBoundable);if(childDepth>maxChildDepth)
maxChildDepth=childDepth;}}
return maxChildDepth+1;};jsts.index.strtree.AbstractSTRtree.prototype.insert=function(bounds,item){jsts.util.Assert.isTrue(!this.built,'Cannot insert items into an STR packed R-tree after it has been built.');this.itemBoundables.push(new jsts.index.strtree.ItemBoundable(bounds,item));};jsts.index.strtree.AbstractSTRtree.prototype.query=function(searchBounds){if(arguments.length>1){this.query2.apply(this,arguments);}
if(!this.built){this.build();}
var matches=[];if(this.itemBoundables.length===0){jsts.util.Assert.isTrue(this.root.getBounds()===null);return matches;}
if(this.getIntersectsOp().intersects(this.root.getBounds(),searchBounds)){this.query3(searchBounds,this.root,matches);}
return matches;};jsts.index.strtree.AbstractSTRtree.prototype.query2=function(searchBounds,visitor){if(arguments.length>2){this.query3.apply(this,arguments);}
if(!this.built){this.build();}
if(this.itemBoundables.length===0){jsts.util.Assert.isTrue(this.root.getBounds()===null);}
if(this.getIntersectsOp().intersects(this.root.getBounds(),searchBounds)){this.query4(searchBounds,this.root,visitor);}};jsts.index.strtree.AbstractSTRtree.prototype.query3=function(searchBounds,node,matches){if(!(arguments[2]instanceof Array)){this.query4.apply(this,arguments);}
var childBoundables=node.getChildBoundables();for(var i=0;i<childBoundables.length;i++){var childBoundable=childBoundables[i];if(!this.getIntersectsOp().intersects(childBoundable.getBounds(),searchBounds)){continue;}
if(childBoundable instanceof jsts.index.strtree.AbstractNode){this.query3(searchBounds,childBoundable,matches);}else if(childBoundable instanceof jsts.index.strtree.ItemBoundable){matches.push(childBoundable.getItem());}else{jsts.util.Assert.shouldNeverReachHere();}}};jsts.index.strtree.AbstractSTRtree.prototype.query4=function(searchBounds,node,visitor){var childBoundables=node.getChildBoundables();for(var i=0;i<childBoundables.length;i++){var childBoundable=childBoundables[i];if(!this.getIntersectsOp().intersects(childBoundable.getBounds(),searchBounds)){continue;}
if(childBoundable instanceof jsts.index.strtree.AbstractNode){this.query4(searchBounds,childBoundable,visitor);}else if(childBoundable instanceof jsts.index.strtree.ItemBoundable){visitor.visitItem(childBoundable.getItem());}else{jsts.util.Assert.shouldNeverReachHere();}}};jsts.index.strtree.AbstractSTRtree.prototype.getIntersectsOp=function(){throw new jsts.error.AbstractMethodInvocationError();};jsts.index.strtree.AbstractSTRtree.prototype.itemsTree=function(){if(arguments.length===1){return this.itemsTree2.apply(this,arguments);}
if(!this.built){this.build();}
var valuesTree=this.itemsTree2(this.root);if(valuesTree===null)
return[];return valuesTree;};jsts.index.strtree.AbstractSTRtree.prototype.itemsTree2=function(node){var valuesTreeForNode=[];var childBoundables=node.getChildBoundables();for(var i=0;i<childBoundables.length;i++){var childBoundable=childBoundables[i];if(childBoundable instanceof jsts.index.strtree.AbstractNode){var valuesTreeForChild=this.itemsTree(childBoundable);if(valuesTreeForChild!=null)
valuesTreeForNode.push(valuesTreeForChild);}else if(childBoundable instanceof jsts.index.strtree.ItemBoundable){valuesTreeForNode.push(childBoundable.getItem());}else{jsts.util.Assert.shouldNeverReachHere();}}
if(valuesTreeForNode.length<=0)
return null;return valuesTreeForNode;};jsts.index.strtree.AbstractSTRtree.prototype.remove=function(searchBounds,item){if(!this.built){this.build();}
if(this.itemBoundables.length===0){jsts.util.Assert.isTrue(this.root.getBounds()==null);}
if(this.getIntersectsOp().intersects(this.root.getBounds(),searchBounds)){return this.remove2(searchBounds,this.root,item);}
return false;};jsts.index.strtree.AbstractSTRtree.prototype.remove2=function(searchBounds,node,item){var found=this.removeItem(node,item);if(found)
return true;var childToPrune=null;var childBoundables=node.getChildBoundables();for(var i=0;i<childBoundables.length;i++){var childBoundable=childBoundables[i];if(!this.getIntersectsOp().intersects(childBoundable.getBounds(),searchBounds)){continue;}
if(childBoundable instanceof jsts.index.strtree.AbstractNode){found=this.remove(searchBounds,childBoundable,item);if(found){childToPrune=childBoundable;break;}}}
if(childToPrune!=null){if(childToPrune.getChildBoundables().length===0){childBoundables.splice(childBoundables.indexOf(childToPrune),1);}}
return found;};jsts.index.strtree.AbstractSTRtree.prototype.removeItem=function(node,item){var childToRemove=null;var childBoundables=node.getChildBoundables();for(var i=0;i<childBoundables.length;i++){var childBoundable=childBoundables[i];if(childBoundable instanceof jsts.index.strtree.ItemBoundable){if(childBoundable.getItem()===item)
childToRemove=childBoundable;}}
if(childToRemove!==null){childBoundables.splice(childBoundables.indexOf(childToRemove),1);return true;}
return false;};jsts.index.strtree.AbstractSTRtree.prototype.boundablesAtLevel=function(level){if(arguments.length>1){this.boundablesAtLevel2.apply(this,arguments);return;}
var boundables=[];this.boundablesAtLevel2(level,this.root,boundables);return boundables;};jsts.index.strtree.AbstractSTRtree.prototype.boundablesAtLevel2=function(level,top,boundables){jsts.util.Assert.isTrue(level>-2);if(top.getLevel()===level){boundables.add(top);return;}
var childBoundables=node.getChildBoundables();for(var i=0;i<childBoundables.length;i++){var boundable=childBoundables[i];if(boundable instanceof jsts.index.strtree.AbstractNode){this.boundablesAtLevel(level,boundable,boundables);}else{jsts.util.Assert.isTrue(boundable instanceof jsts.index.strtree.ItemBoundable);if(level===-1){boundables.add(boundable);}}}
return;};jsts.index.strtree.AbstractSTRtree.prototype.getComparator=function(){throw new jsts.error.AbstractMethodInvocationError();};jsts.index.strtree.STRtree=function(nodeCapacity){nodeCapacity=nodeCapacity||jsts.index.strtree.STRtree.DEFAULT_NODE_CAPACITY;jsts.index.strtree.AbstractSTRtree.call(this,nodeCapacity);};jsts.index.strtree.STRtree.prototype=new jsts.index.strtree.AbstractSTRtree();jsts.index.strtree.STRtree.constructor=jsts.index.strtree.STRtree;jsts.index.strtree.STRtree.prototype.xComparator=function(o1,o2){return jsts.index.strtree.AbstractSTRtree.prototype.compareDoubles(jsts.index.strtree.STRtree.prototype.centreX(o1.getBounds()),jsts.index.strtree.STRtree.prototype.centreX(o2.getBounds()));};jsts.index.strtree.STRtree.prototype.yComparator=function(o1,o2){return jsts.index.strtree.AbstractSTRtree.prototype.compareDoubles(jsts.index.strtree.STRtree.prototype.centreY(o1.getBounds()),jsts.index.strtree.STRtree.prototype.centreY(o2.getBounds()));};jsts.index.strtree.STRtree.prototype.centreX=function(e){return jsts.index.strtree.STRtree.prototype.avg(e.getMinX(),e.getMaxX());};jsts.index.strtree.STRtree.prototype.centreY=function(e){return jsts.index.strtree.STRtree.prototype.avg(e.getMinY(),e.getMaxY());};jsts.index.strtree.STRtree.prototype.avg=function(a,b){return(a+b)/2.0;};jsts.index.strtree.STRtree.prototype.intersectsOp={intersects:function(aBounds,bBounds){return aBounds.intersects(bBounds);}};jsts.index.strtree.STRtree.prototype.createParentBoundables=function(childBoundables,newLevel){jsts.util.Assert.isTrue(!(childBoundables.length===0));var minLeafCount=Math.ceil(childBoundables.length/this.getNodeCapacity());var sortedChildBoundables=[];for(var i=0;i<childBoundables.length;i++){sortedChildBoundables.push(childBoundables[i]);}
sortedChildBoundables.sort(this.xComparator);var verticalSlices=this.verticalSlices(sortedChildBoundables,Math.ceil(Math.sqrt(minLeafCount)));return this.createParentBoundablesFromVerticalSlices(verticalSlices,newLevel);};jsts.index.strtree.STRtree.prototype.createParentBoundablesFromVerticalSlices=function(verticalSlices,newLevel){jsts.util.Assert.isTrue(verticalSlices.length>0);var parentBoundables=[];for(var i=0;i<verticalSlices.length;i++){parentBoundables=parentBoundables.concat(this.createParentBoundablesFromVerticalSlice(verticalSlices[i],newLevel));}
return parentBoundables;};jsts.index.strtree.STRtree.prototype.createParentBoundablesFromVerticalSlice=function(childBoundables,newLevel){return jsts.index.strtree.AbstractSTRtree.prototype.createParentBoundables.call(this,childBoundables,newLevel);};jsts.index.strtree.STRtree.prototype.verticalSlices=function(childBoundables,sliceCount){var sliceCapacity=Math.ceil(childBoundables.length/sliceCount);var slices=[];var i=0,boundablesAddedToSlice,childBoundable;for(var j=0;j<sliceCount;j++){slices[j]=[];boundablesAddedToSlice=0;while(i<childBoundables.length&&boundablesAddedToSlice<sliceCapacity){childBoundable=childBoundables[i++];slices[j].push(childBoundable);boundablesAddedToSlice++;}}
return slices;};jsts.index.strtree.STRtree.DEFAULT_NODE_CAPACITY=10;jsts.index.strtree.STRtree.prototype.createNode=function(level){var abstractNode=new jsts.index.strtree.AbstractNode(level);abstractNode.computeBounds=function(){var bounds=null;var childBoundables=this.getChildBoundables();for(var i=0;i<childBoundables.length;i++){var childBoundable=childBoundables[i];if(bounds===null){bounds=new jsts.geom.Envelope(childBoundable.getBounds());}else{bounds.expandToInclude(childBoundable.getBounds());}}
return bounds;};return abstractNode;};jsts.index.strtree.STRtree.prototype.getIntersectsOp=function(){return this.intersectsOp;};jsts.index.strtree.STRtree.prototype.insert=function(itemEnv,item){if(itemEnv.isNull()){return;}
jsts.index.strtree.AbstractSTRtree.prototype.insert.call(this,itemEnv,item);};jsts.index.strtree.STRtree.prototype.query=function(searchEnv,visitor){return jsts.index.strtree.AbstractSTRtree.prototype.query.apply(this,arguments);};jsts.index.strtree.STRtree.prototype.remove=function(itemEnv,item){return jsts.index.strtree.AbstractSTRtree.prototype.remove.call(this,itemEnv,item);};jsts.index.strtree.STRtree.prototype.size=function(){return jsts.index.strtree.AbstractSTRtree.prototype.size.call(this);};jsts.index.strtree.STRtree.prototype.depth=function(){return jsts.index.strtree.AbstractSTRtree.prototype.depth.call(this);};jsts.index.strtree.STRtree.prototype.getComparator=function(){return this.yComparator;};jsts.index.strtree.STRtree.prototype.nearestNeighbour=function(itemDist){var bp=new jsts.index.strtree.BoundablePair(this.getRoot(),this.getRoot(),itemDist);return this.nearestNeighbour4(bp);};jsts.index.strtree.STRtree.prototype.nearestNeighbour2=function(env,item,itemDist){var bnd=new jsts.index.strtree.ItemBoundable(env,item);var bp=new jsts.index.strtree.BoundablePair(this.getRoot(),bnd,itemDist);return this.nearestNeighbour4(bp)[0];};jsts.index.strtree.STRtree.prototype.nearestNeighbour3=function(tree,itemDist){var bp=new jsts.index.strtree.BoundablePair(this.getRoot(),tree.getRoot(),itemDist);return this.nearestNeighbour4(bp);};jsts.index.strtree.STRtree.prototype.nearestNeighbour4=function(initBndPair){return this.nearestNeighbour5(initBndPair,Double.POSITIVE_INFINITY);};jsts.index.strtree.STRtree.prototype.nearestNeighbour5=function(initBndPair,maxDistance){var distanceLowerBound=maxDistance;var minPair=null;var priQ=[];priQ.push(initBndPair);while(!priQ.isEmpty()&&distanceLowerBound>0.0){var bndPair=priQ.pop();var currentDistance=bndPair.getDistance();if(currentDistance>=distanceLowerBound)
break;if(bndPair.isLeaves()){distanceLowerBound=currentDistance;minPair=bndPair;}else{bndPair.expandToQueue(priQ,distanceLowerBound);}}
return[minPair.getBoundable(0).getItem(),minPair.getBoundable(1).getItem()];};jsts.noding.SegmentString=function(){};jsts.noding.SegmentString.prototype.getData=jsts.abstractFunc;jsts.noding.SegmentString.prototype.setData=jsts.abstractFunc;jsts.noding.SegmentString.prototype.size=jsts.abstractFunc;jsts.noding.SegmentString.prototype.getCoordinate=jsts.abstractFunc;jsts.noding.SegmentString.prototype.getCoordinates=jsts.abstractFunc;jsts.noding.SegmentString.prototype.isClosed=jsts.abstractFunc;jsts.noding.NodableSegmentString=function(){};jsts.noding.NodableSegmentString.prototype=new jsts.noding.SegmentString();jsts.noding.NodableSegmentString.prototype.addIntersection=jsts.abstractFunc;jsts.noding.NodedSegmentString=function(pts,data){this.nodeList=new jsts.noding.SegmentNodeList(this);this.pts=pts;this.data=data;};jsts.noding.NodedSegmentString.prototype=new jsts.noding.NodableSegmentString();jsts.noding.NodedSegmentString.constructor=jsts.noding.NodedSegmentString;jsts.noding.NodedSegmentString.getNodedSubstrings=function(segStrings){if(arguments.length===2){jsts.noding.NodedSegmentString.getNodedSubstrings2.apply(this,arguments);return;}
var resultEdgelist=new javascript.util.ArrayList();jsts.noding.NodedSegmentString.getNodedSubstrings2(segStrings,resultEdgelist);return resultEdgelist;};jsts.noding.NodedSegmentString.getNodedSubstrings2=function(segStrings,resultEdgelist){for(var i=segStrings.iterator();i.hasNext();){var ss=i.next();ss.getNodeList().addSplitEdges(resultEdgelist);}};jsts.noding.NodedSegmentString.prototype.nodeList=null;jsts.noding.NodedSegmentString.prototype.pts=null;jsts.noding.NodedSegmentString.prototype.data=null;jsts.noding.NodedSegmentString.prototype.getData=function(){return this.data;};jsts.noding.NodedSegmentString.prototype.setData=function(data){this.data=data;};jsts.noding.NodedSegmentString.prototype.getNodeList=function(){return this.nodeList;};jsts.noding.NodedSegmentString.prototype.size=function(){return this.pts.length;};jsts.noding.NodedSegmentString.prototype.getCoordinate=function(i){return this.pts[i];};jsts.noding.NodedSegmentString.prototype.getCoordinates=function(){return this.pts;};jsts.noding.NodedSegmentString.prototype.isClosed=function(){return this.pts[0].equals(this.pts[this.pts.length-1]);};jsts.noding.NodedSegmentString.prototype.getSegmentOctant=function(index){if(index===this.pts.length-1)
return-1;return this.safeOctant(this.getCoordinate(index),this.getCoordinate(index+1));};jsts.noding.NodedSegmentString.prototype.safeOctant=function(p0,p1){if(p0.equals2D(p1))
return 0;return jsts.noding.Octant.octant(p0,p1);};jsts.noding.NodedSegmentString.prototype.addIntersections=function(li,segmentIndex,geomIndex){for(var i=0;i<li.getIntersectionNum();i++){this.addIntersection(li,segmentIndex,geomIndex,i);}};jsts.noding.NodedSegmentString.prototype.addIntersection=function(li,segmentIndex,geomIndex,intIndex){if(li instanceof jsts.geom.Coordinate){this.addIntersection2.apply(this,arguments);return;}
var intPt=new jsts.geom.Coordinate(li.getIntersection(intIndex));this.addIntersection2(intPt,segmentIndex);};jsts.noding.NodedSegmentString.prototype.addIntersection2=function(intPt,segmentIndex){this.addIntersectionNode(intPt,segmentIndex);};jsts.noding.NodedSegmentString.prototype.addIntersectionNode=function(intPt,segmentIndex){var normalizedSegmentIndex=segmentIndex;var nextSegIndex=normalizedSegmentIndex+1;if(nextSegIndex<this.pts.length){var nextPt=this.pts[nextSegIndex];if(intPt.equals2D(nextPt)){normalizedSegmentIndex=nextSegIndex;}}
var ei=this.nodeList.add(intPt,normalizedSegmentIndex);return ei;};jsts.noding.NodedSegmentString.prototype.toString=function(){var geometryFactory=new jsts.geom.GeometryFactory();return new jsts.io.WKTWriter().write(geometryFactory.createLineString(this.pts));};jsts.index.chain.MonotoneChainBuilder=function(){};jsts.index.chain.MonotoneChainBuilder.toIntArray=function(list){var array=[];for(var i=0;i<list.length;i++){array[i]=list[i];}
return array;};jsts.index.chain.MonotoneChainBuilder.getChains=function(pts){if(arguments.length===2){return jsts.index.chain.MonotoneChainBuilder.getChains2.apply(this,arguments);}
return jsts.index.chain.MonotoneChainBuilder.getChains2(pts,null);};jsts.index.chain.MonotoneChainBuilder.getChains2=function(pts,context){var mcList=[];var startIndex=jsts.index.chain.MonotoneChainBuilder.getChainStartIndices(pts);for(var i=0;i<startIndex.length-1;i++){var mc=new jsts.index.chain.MonotoneChain(pts,startIndex[i],startIndex[i+1],context);mcList.push(mc);}
return mcList;};jsts.index.chain.MonotoneChainBuilder.getChainStartIndices=function(pts){var start=0;var startIndexList=[];startIndexList.push(start);do{var last=jsts.index.chain.MonotoneChainBuilder.findChainEnd(pts,start);startIndexList.push(last);start=last;}while(start<pts.length-1);var startIndex=jsts.index.chain.MonotoneChainBuilder.toIntArray(startIndexList);return startIndex;};jsts.index.chain.MonotoneChainBuilder.findChainEnd=function(pts,start){var safeStart=start;while(safeStart<pts.length-1&&pts[safeStart].equals2D(pts[safeStart+1])){safeStart++;}
if(safeStart>=pts.length-1){return pts.length-1;}
var chainQuad=jsts.geomgraph.Quadrant.quadrant(pts[safeStart],pts[safeStart+1]);var last=start+1;while(last<pts.length){if(!pts[last-1].equals2D(pts[last])){var quad=jsts.geomgraph.Quadrant.quadrant(pts[last-1],pts[last]);if(quad!==chainQuad)
break;}
last++;}
return last-1;};jsts.geom.LineSegment=function(p0,p1){if(p0===undefined){this.p0=new jsts.geom.Coordinate();this.p1=new jsts.geom.Coordinate();return;}
this.p0=p0;this.p1=p1;};jsts.geom.LineSegment.prototype.p0=null;jsts.geom.LineSegment.prototype.p1=null;jsts.geom.LineSegment.prototype.getLength=function(){return this.p0.distance(p1);};jsts.geom.LineSegment.prototype.isHorizontal=function(){return this.p0.y===this.p1.y;};jsts.geom.LineSegment.prototype.isVertical=function(){return this.p0.x===this.p1.x;};jsts.geom.LineSegment.prototype.reverse=function()
{var temp=this.p0;this.p0=this.p1;this.p1=temp;};jsts.geom.LineSegment.prototype.projectionFactor=function(p){if(p.equals(this.p0))
return 0.0;if(p.equals(this.p1))
return 1.0;var dx=this.p1.x-this.p0.x;var dy=this.p1.y-this.p0.y;var len2=dx*dx+dy*dy;var r=((p.x-this.p0.x)*dx+(p.y-this.p0.y)*dy)/len2;return r;};jsts.geom.LineSegment.prototype.closestPoint=function(p){var factor=this.projectionFactor(p);if(factor>0&&factor<1){return this.project(p);}
var dist0=this.p0.distance(p);var dist1=this.p1.distance(p);if(dist0<dist1)
return this.p0;return this.p1;};jsts.geom.LineSegment.prototype.closestPoints=function(line){var intPt=this.intersection(line);if(intPt!==null){return[intPt,intPt];}
var closestPt=[];var minDistance=Number.MAX_VALUE;var dist;var close00=this.closestPoint(line.p0);minDistance=close00.distance(line.p0);closestPt[0]=close00;closestPt[1]=line.p0;var close01=this.closestPoint(line.p1);dist=close01.distance(line.p1);if(dist<minDistance){minDistance=dist;closestPt[0]=close01;closestPt[1]=line.p1;}
var close10=line.closestPoint(this.p0);dist=close10.distance(this.p0);if(dist<minDistance){minDistance=dist;closestPt[0]=this.p0;closestPt[1]=close10;}
var close11=line.closestPoint(this.p1);dist=close11.distance(this.p1);if(dist<minDistance){minDistance=dist;closestPt[0]=this.p1;closestPt[1]=close11;}
return closestPt;};jsts.geom.LineSegment.prototype.intersection=function(line){var li=new jsts.algorithm.RobustLineIntersector();li.computeIntersection(this.p0,this.p1,line.p0,line.p1);if(li.hasIntersection())
return li.getIntersection(0);return null;};jsts.geom.LineSegment.prototype.project=function(p){if(p.equals(this.p0)||p.equals(this.p1))
return new jsts.geom.Coordinate(p);var r=this.projectionFactor(p);var coord=new jsts.geom.Coordinate();coord.x=this.p0.x+r*(this.p1.x-this.p0.x);coord.y=this.p0.y+r*(this.p1.y-this.p0.y);return coord;};jsts.geom.LineSegment.prototype.setCoordinates=function(ls){if(ls instanceof jsts.geom.Coordinate){this.setCoordinates2.apply(this,arguments);return;}
this.setCoordinates2(ls.p0,ls.p1);};jsts.geom.LineSegment.prototype.setCoordinates2=function(p0,p1){this.p0.x=p0.x;this.p0.y=p0.y;this.p1.x=p1.x;this.p1.y=p1.y;};jsts.geom.LineSegment.prototype.distance=function(p)
{return jsts.algorithm.CGAlgorithms.distancePointLine(p,this.p0,this.p1);};jsts.index.chain.MonotoneChainOverlapAction=function(){this.tempEnv1=new jsts.geom.Envelope();this.tempEnv2=new jsts.geom.Envelope();this.overlapSeg1=new jsts.geom.LineSegment();this.overlapSeg2=new jsts.geom.LineSegment();};jsts.index.chain.MonotoneChainOverlapAction.prototype.tempEnv1=null;jsts.index.chain.MonotoneChainOverlapAction.prototype.tempEnv2=null;jsts.index.chain.MonotoneChainOverlapAction.prototype.overlapSeg1=null;jsts.index.chain.MonotoneChainOverlapAction.prototype.overlapSeg2=null;jsts.index.chain.MonotoneChainOverlapAction.prototype.overlap=function(mc1,start1,mc2,start2){this.mc1.getLineSegment(start1,this.overlapSeg1);this.mc2.getLineSegment(start2,this.overlapSeg2);this.overlap2(this.overlapSeg1,this.overlapSeg2);};jsts.index.chain.MonotoneChainOverlapAction.prototype.overlap2=function(seg1,seg2){};(function(){var MonotoneChainOverlapAction=jsts.index.chain.MonotoneChainOverlapAction;var SinglePassNoder=jsts.noding.SinglePassNoder;var STRtree=jsts.index.strtree.STRtree;var NodedSegmentString=jsts.noding.NodedSegmentString;var MonotoneChainBuilder=jsts.index.chain.MonotoneChainBuilder;var SegmentOverlapAction=function(si){this.si=si;};SegmentOverlapAction.prototype=new MonotoneChainOverlapAction();SegmentOverlapAction.constructor=SegmentOverlapAction;SegmentOverlapAction.prototype.si=null;SegmentOverlapAction.prototype.overlap=function(mc1,start1,mc2,start2){var ss1=mc1.getContext();var ss2=mc2.getContext();this.si.processIntersections(ss1,start1,ss2,start2);};jsts.noding.MCIndexNoder=function(){this.monoChains=[];this.index=new STRtree();};jsts.noding.MCIndexNoder.prototype=new SinglePassNoder();jsts.noding.MCIndexNoder.constructor=jsts.noding.MCIndexNoder;jsts.noding.MCIndexNoder.prototype.monoChains=null;jsts.noding.MCIndexNoder.prototype.index=null;jsts.noding.MCIndexNoder.prototype.idCounter=0;jsts.noding.MCIndexNoder.prototype.nodedSegStrings=null;jsts.noding.MCIndexNoder.prototype.nOverlaps=0;jsts.noding.MCIndexNoder.prototype.getMonotoneChains=function(){return this.monoChains;};jsts.noding.MCIndexNoder.prototype.getIndex=function(){return this.index;};jsts.noding.MCIndexNoder.prototype.getNodedSubstrings=function(){return NodedSegmentString.getNodedSubstrings(this.nodedSegStrings);};jsts.noding.MCIndexNoder.prototype.computeNodes=function(inputSegStrings){this.nodedSegStrings=inputSegStrings;for(var i=inputSegStrings.iterator();i.hasNext();){this.add(i.next());}
this.intersectChains();};jsts.noding.MCIndexNoder.prototype.intersectChains=function(){var overlapAction=new SegmentOverlapAction(this.segInt);for(var i=0;i<this.monoChains.length;i++){var queryChain=this.monoChains[i];var overlapChains=this.index.query(queryChain.getEnvelope());for(var j=0;j<overlapChains.length;j++){var testChain=overlapChains[j];if(testChain.getId()>queryChain.getId()){queryChain.computeOverlaps(testChain,overlapAction);this.nOverlaps++;}
if(this.segInt.isDone())
return;}}};jsts.noding.MCIndexNoder.prototype.add=function(segStr){var segChains=MonotoneChainBuilder.getChains(segStr.getCoordinates(),segStr);for(var i=0;i<segChains.length;i++){var mc=segChains[i];mc.setId(this.idCounter++);this.index.insert(mc.getEnvelope(),mc);this.monoChains.push(mc);}};})();(function(){var RobustLineIntersector=jsts.algorithm.RobustLineIntersector;var InteriorIntersectionFinder=jsts.noding.InteriorIntersectionFinder;var MCIndexNoder=jsts.noding.MCIndexNoder;jsts.noding.FastNodingValidator=function(segStrings){this.li=new RobustLineIntersector();this.segStrings=segStrings;};jsts.noding.FastNodingValidator.prototype.li=null;jsts.noding.FastNodingValidator.prototype.segStrings=null;jsts.noding.FastNodingValidator.prototype.findAllIntersections=false;jsts.noding.FastNodingValidator.prototype.segInt=null;jsts.noding.FastNodingValidator.prototype._isValid=true;jsts.noding.FastNodingValidator.prototype.setFindAllIntersections=function(findAllIntersections){this.findAllIntersections=findAllIntersections;};jsts.noding.FastNodingValidator.prototype.getIntersections=function(){return segInt.getIntersections();};jsts.noding.FastNodingValidator.prototype.isValid=function(){this.execute();return this._isValid;};jsts.noding.FastNodingValidator.prototype.getErrorMessage=function(){if(this._isValid)
return'no intersections found';var intSegs=this.segInt.getIntersectionSegments();return'found non-noded intersection between '+
jsts.io.WKTWriter.toLineString(intSegs[0],intSegs[1])+' and '+
jsts.io.WKTWriter.toLineString(intSegs[2],intSegs[3]);};jsts.noding.FastNodingValidator.prototype.checkValid=function(){this.execute();if(!this._isValid)
throw new jsts.error.TopologyError(this.getErrorMessage(),this.segInt.getInteriorIntersection());};jsts.noding.FastNodingValidator.prototype.execute=function(){if(this.segInt!=null)
return;this.checkInteriorIntersections();};jsts.noding.FastNodingValidator.prototype.checkInteriorIntersections=function(){this._isValid=true;this.segInt=new InteriorIntersectionFinder(this.li);this.segInt.setFindAllIntersections(this.findAllIntersections);var noder=new MCIndexNoder();noder.setSegmentIntersector(this.segInt);noder.computeNodes(this.segStrings);if(this.segInt.hasIntersection()){this._isValid=false;return;}};})();(function(){jsts.noding.BasicSegmentString=function(pts,data){this.pts=pts;this.data=data;};jsts.noding.BasicSegmentString.prototype=new jsts.noding.SegmentString();jsts.noding.BasicSegmentString.prototype.pts=null;jsts.noding.BasicSegmentString.prototype.data=null;jsts.noding.BasicSegmentString.prototype.getData=function(){return this.data;}
jsts.noding.BasicSegmentString.prototype.setData=function(data){this.data=data;};jsts.noding.BasicSegmentString.prototype.size=function(){return this.pts.length;};jsts.noding.BasicSegmentString.prototype.getCoordinate=function(i){return this.pts[i];};jsts.noding.BasicSegmentString.prototype.getCoordinates=function(){return this.pts;};jsts.noding.BasicSegmentString.prototype.isClosed=function(){return this.pts[0].equals(this.pts[this.pts.length-1]);};jsts.noding.BasicSegmentString.prototype.getSegmentOctant=function(index){if(index==this.pts.length-1)
return-1;return jsts.noding.Octant.octant(this.getCoordinate(index),this.getCoordinate(index+1));};})();(function(){var FastNodingValidator=jsts.noding.FastNodingValidator;var BasicSegmentString=jsts.noding.BasicSegmentString;var ArrayList=javascript.util.ArrayList;jsts.geomgraph.EdgeNodingValidator=function(edges){this.nv=new FastNodingValidator(jsts.geomgraph.EdgeNodingValidator.toSegmentStrings(edges));};jsts.geomgraph.EdgeNodingValidator.checkValid=function(edges){var validator=new jsts.geomgraph.EdgeNodingValidator(edges);validator.checkValid();};jsts.geomgraph.EdgeNodingValidator.toSegmentStrings=function(edges){var segStrings=new ArrayList();for(var i=edges.iterator();i.hasNext();){var e=i.next();segStrings.add(new BasicSegmentString(e.getCoordinates(),e));}
return segStrings;};jsts.geomgraph.EdgeNodingValidator.prototype.nv=null;jsts.geomgraph.EdgeNodingValidator.prototype.checkValid=function(){this.nv.checkValid();};})();jsts.operation.GeometryGraphOperation=function(g0,g1,boundaryNodeRule){this.li=new jsts.algorithm.RobustLineIntersector();this.arg=[];if(g0===undefined){return;}
if(g1===undefined){this.setComputationPrecision(g0.getPrecisionModel());this.arg[0]=new jsts.geomgraph.GeometryGraph(0,g0);return;}
boundaryNodeRule=boundaryNodeRule||jsts.algorithm.BoundaryNodeRule.OGC_SFS_BOUNDARY_RULE;if(g0.getPrecisionModel().compareTo(g1.getPrecisionModel())>=0)
this.setComputationPrecision(g0.getPrecisionModel());else
this.setComputationPrecision(g1.getPrecisionModel());this.arg[0]=new jsts.geomgraph.GeometryGraph(0,g0,boundaryNodeRule);this.arg[1]=new jsts.geomgraph.GeometryGraph(1,g1,boundaryNodeRule);};jsts.operation.GeometryGraphOperation.prototype.li=null;jsts.operation.GeometryGraphOperation.prototype.resultPrecisionModel=null;jsts.operation.GeometryGraphOperation.prototype.arg=null;jsts.operation.GeometryGraphOperation.prototype.getArgGeometry=function(i){return arg[i].getGeometry();};jsts.operation.GeometryGraphOperation.prototype.setComputationPrecision=function(pm){this.resultPrecisionModel=pm;this.li.setPrecisionModel(this.resultPrecisionModel);};jsts.operation.overlay.PolygonBuilder=function(geometryFactory){this.shellList=[];this.geometryFactory=geometryFactory;};jsts.operation.overlay.PolygonBuilder.prototype.geometryFactory=null;jsts.operation.overlay.PolygonBuilder.prototype.shellList=null;jsts.operation.overlay.PolygonBuilder.prototype.add=function(graph){if(arguments.length===2){this.add2.apply(this,arguments);return;}
this.add2(graph.getEdgeEnds(),graph.getNodes());};jsts.operation.overlay.PolygonBuilder.prototype.add2=function(dirEdges,nodes){jsts.geomgraph.PlanarGraph.linkResultDirectedEdges(nodes);var maxEdgeRings=this.buildMaximalEdgeRings(dirEdges);var freeHoleList=[];var edgeRings=this.buildMinimalEdgeRings(maxEdgeRings,this.shellList,freeHoleList);this.sortShellsAndHoles(edgeRings,this.shellList,freeHoleList);this.placeFreeHoles(this.shellList,freeHoleList);};jsts.operation.overlay.PolygonBuilder.prototype.getPolygons=function(){var resultPolyList=this.computePolygons(this.shellList);return resultPolyList;};jsts.operation.overlay.PolygonBuilder.prototype.buildMaximalEdgeRings=function(dirEdges){var maxEdgeRings=[];for(var it=dirEdges.iterator();it.hasNext();){var de=it.next();if(de.isInResult()&&de.getLabel().isArea()){if(de.getEdgeRing()==null){var er=new jsts.operation.overlay.MaximalEdgeRing(de,this.geometryFactory);maxEdgeRings.push(er);er.setInResult();}}}
return maxEdgeRings;};jsts.operation.overlay.PolygonBuilder.prototype.buildMinimalEdgeRings=function(maxEdgeRings,shellList,freeHoleList){var edgeRings=[];for(var i=0;i<maxEdgeRings.length;i++){var er=maxEdgeRings[i];if(er.getMaxNodeDegree()>2){er.linkDirectedEdgesForMinimalEdgeRings();var minEdgeRings=er.buildMinimalRings();var shell=this.findShell(minEdgeRings);if(shell!==null){this.placePolygonHoles(shell,minEdgeRings);shellList.push(shell);}else{freeHoleList=freeHoleList.concat(minEdgeRings);}}else{edgeRings.push(er);}}
return edgeRings;};jsts.operation.overlay.PolygonBuilder.prototype.findShell=function(minEdgeRings){var shellCount=0;var shell=null;for(var i=0;i<minEdgeRings.length;i++){var er=minEdgeRings[i];if(!er.isHole()){shell=er;shellCount++;}}
jsts.util.Assert.isTrue(shellCount<=1,'found two shells in MinimalEdgeRing list');return shell;};jsts.operation.overlay.PolygonBuilder.prototype.placePolygonHoles=function(shell,minEdgeRings){for(var i=0;i<minEdgeRings.length;i++){var er=minEdgeRings[i];if(er.isHole()){er.setShell(shell);}}};jsts.operation.overlay.PolygonBuilder.prototype.sortShellsAndHoles=function(edgeRings,shellList,freeHoleList){for(var i=0;i<edgeRings.length;i++){var er=edgeRings[i];if(er.isHole()){freeHoleList.push(er);}else{shellList.push(er);}}};jsts.operation.overlay.PolygonBuilder.prototype.placeFreeHoles=function(shellList,freeHoleList){for(var i=0;i<freeHoleList.length;i++){var hole=freeHoleList[i];if(hole.getShell()==null){var shell=this.findEdgeRingContaining(hole,shellList);if(shell===null)
throw new jsts.error.TopologyError('unable to assign hole to a shell',hole.getCoordinate(0));hole.setShell(shell);}}};jsts.operation.overlay.PolygonBuilder.prototype.findEdgeRingContaining=function(testEr,shellList){var testRing=testEr.getLinearRing();var testEnv=testRing.getEnvelopeInternal();var testPt=testRing.getCoordinateN(0);var minShell=null;var minEnv=null;for(var i=0;i<shellList.length;i++){var tryShell=shellList[i];var tryRing=tryShell.getLinearRing();var tryEnv=tryRing.getEnvelopeInternal();if(minShell!==null)
minEnv=minShell.getLinearRing().getEnvelopeInternal();var isContained=false;if(tryEnv.contains(testEnv)&&jsts.algorithm.CGAlgorithms.isPointInRing(testPt,tryRing.getCoordinates()))
isContained=true;if(isContained){if(minShell==null||minEnv.contains(tryEnv)){minShell=tryShell;}}}
return minShell;};jsts.operation.overlay.PolygonBuilder.prototype.computePolygons=function(shellList){var resultPolyList=new javascript.util.ArrayList();for(var i=0;i<shellList.length;i++){var er=shellList[i];var poly=er.toPolygon(this.geometryFactory);resultPolyList.add(poly);}
return resultPolyList;};jsts.operation.overlay.PolygonBuilder.prototype.containsPoint=function(p){for(var i=0;i<this.shellList.length;i++){var er=this.shellList[i];if(er.containsPoint(p))
return true;}
return false;};(function(){var Assert=jsts.util.Assert;var ArrayList=javascript.util.ArrayList;var LineBuilder=function(op,geometryFactory,ptLocator){this.lineEdgesList=new ArrayList();this.resultLineList=new ArrayList();this.op=op;this.geometryFactory=geometryFactory;this.ptLocator=ptLocator;};LineBuilder.prototype.op=null;LineBuilder.prototype.geometryFactory=null;LineBuilder.prototype.ptLocator=null;LineBuilder.prototype.lineEdgesList=null;LineBuilder.prototype.resultLineList=null;LineBuilder.prototype.build=function(opCode){this.findCoveredLineEdges();this.collectLines(opCode);this.buildLines(opCode);return this.resultLineList;};LineBuilder.prototype.findCoveredLineEdges=function(){for(var nodeit=this.op.getGraph().getNodes().iterator();nodeit.hasNext();){var node=nodeit.next();node.getEdges().findCoveredLineEdges();}
for(var it=this.op.getGraph().getEdgeEnds().iterator();it.hasNext();){var de=it.next();var e=de.getEdge();if(de.isLineEdge()&&!e.isCoveredSet()){var isCovered=this.op.isCoveredByA(de.getCoordinate());e.setCovered(isCovered);}}};LineBuilder.prototype.collectLines=function(opCode){for(var it=this.op.getGraph().getEdgeEnds().iterator();it.hasNext();){var de=it.next();this.collectLineEdge(de,opCode,this.lineEdgesList);this.collectBoundaryTouchEdge(de,opCode,this.lineEdgesList);}};LineBuilder.prototype.collectLineEdge=function(de,opCode,edges){var label=de.getLabel();var e=de.getEdge();if(de.isLineEdge()){if(!de.isVisited()&&jsts.operation.overlay.OverlayOp.isResultOfOp(label,opCode)&&!e.isCovered()){edges.add(e);de.setVisitedEdge(true);}}};LineBuilder.prototype.collectBoundaryTouchEdge=function(de,opCode,edges){var label=de.getLabel();if(de.isLineEdge())
return;if(de.isVisited())
return;if(de.isInteriorAreaEdge())
return;if(de.getEdge().isInResult())
return;Assert.isTrue(!(de.isInResult()||de.getSym().isInResult())||!de.getEdge().isInResult());if(jsts.operation.overlay.OverlayOp.isResultOfOp(label,opCode)&&opCode===jsts.operation.overlay.OverlayOp.INTERSECTION){edges.add(de.getEdge());de.setVisitedEdge(true);}};LineBuilder.prototype.buildLines=function(opCode){for(var it=this.lineEdgesList.iterator();it.hasNext();){var e=it.next();var label=e.getLabel();var line=this.geometryFactory.createLineString(e.getCoordinates());this.resultLineList.add(line);e.setInResult(true);}};LineBuilder.prototype.labelIsolatedLines=function(edgesList){for(var it=edgesList.iterator();it.hasNext();){var e=it.next();var label=e.getLabel();if(e.isIsolated()){if(label.isNull(0))
this.labelIsolatedLine(e,0);else
this.labelIsolatedLine(e,1);}}};LineBuilder.prototype.labelIsolatedLine=function(e,targetIndex){var loc=ptLocator.locate(e.getCoordinate(),op.getArgGeometry(targetIndex));e.getLabel().setLocation(targetIndex,loc);};jsts.operation.overlay.LineBuilder=LineBuilder;})();(function(){var ArrayList=javascript.util.ArrayList;var PointBuilder=function(op,geometryFactory,ptLocator){this.resultPointList=new ArrayList();this.op=op;this.geometryFactory=geometryFactory;};PointBuilder.prototype.op=null;PointBuilder.prototype.geometryFactory=null;PointBuilder.prototype.resultPointList=null;PointBuilder.prototype.build=function(opCode){this.extractNonCoveredResultNodes(opCode);return this.resultPointList;};PointBuilder.prototype.extractNonCoveredResultNodes=function(opCode){for(var nodeit=this.op.getGraph().getNodes().iterator();nodeit.hasNext();){var n=nodeit.next();if(n.isInResult())
continue;if(n.isIncidentEdgeInResult())
continue;if(n.getEdges().getDegree()===0||opCode===jsts.operation.overlay.OverlayOp.INTERSECTION){var label=n.getLabel();if(jsts.operation.overlay.OverlayOp.isResultOfOp(label,opCode)){this.filterCoveredNodeToPoint(n);}}}};PointBuilder.prototype.filterCoveredNodeToPoint=function(n){var coord=n.getCoordinate();if(!this.op.isCoveredByLA(coord)){var pt=this.geometryFactory.createPoint(coord);this.resultPointList.add(pt);}};jsts.operation.overlay.PointBuilder=PointBuilder;})();(function(){var PointLocator=jsts.algorithm.PointLocator;var Location=jsts.geom.Location;var EdgeList=jsts.geomgraph.EdgeList;var Label=jsts.geomgraph.Label;var PlanarGraph=jsts.geomgraph.PlanarGraph;var Position=jsts.geomgraph.Position;var EdgeNodingValidator=jsts.geomgraph.EdgeNodingValidator;var GeometryGraphOperation=jsts.operation.GeometryGraphOperation;var OverlayNodeFactory=jsts.operation.overlay.OverlayNodeFactory;var PolygonBuilder=jsts.operation.overlay.PolygonBuilder;var LineBuilder=jsts.operation.overlay.LineBuilder;var PointBuilder=jsts.operation.overlay.PointBuilder;var Assert=jsts.util.Assert;var ArrayList=javascript.util.ArrayList;jsts.operation.overlay.OverlayOp=function(g0,g1){this.ptLocator=new PointLocator();this.edgeList=new EdgeList();this.resultPolyList=new ArrayList();this.resultLineList=new ArrayList();this.resultPointList=new ArrayList();GeometryGraphOperation.call(this,g0,g1);this.graph=new PlanarGraph(new OverlayNodeFactory());this.geomFact=g0.getFactory();};jsts.operation.overlay.OverlayOp.prototype=new GeometryGraphOperation();jsts.operation.overlay.OverlayOp.constructor=jsts.operation.overlay.OverlayOp;jsts.operation.overlay.OverlayOp.INTERSECTION=1;jsts.operation.overlay.OverlayOp.UNION=2;jsts.operation.overlay.OverlayOp.DIFFERENCE=3;jsts.operation.overlay.OverlayOp.SYMDIFFERENCE=4;jsts.operation.overlay.OverlayOp.overlayOp=function(geom0,geom1,opCode){var gov=new jsts.operation.overlay.OverlayOp(geom0,geom1);var geomOv=gov.getResultGeometry(opCode);return geomOv;}
jsts.operation.overlay.OverlayOp.isResultOfOp=function(label,opCode){if(arguments.length===3){return jsts.operation.overlay.OverlayOp.isResultOfOp2.apply(this,arguments);}
var loc0=label.getLocation(0);var loc1=label.getLocation(1);return jsts.operation.overlay.OverlayOp.isResultOfOp2(loc0,loc1,opCode);}
jsts.operation.overlay.OverlayOp.isResultOfOp2=function(loc0,loc1,opCode){if(loc0==Location.BOUNDARY)
loc0=Location.INTERIOR;if(loc1==Location.BOUNDARY)
loc1=Location.INTERIOR;switch(opCode){case jsts.operation.overlay.OverlayOp.INTERSECTION:return loc0==Location.INTERIOR&&loc1==Location.INTERIOR;case jsts.operation.overlay.OverlayOp.UNION:return loc0==Location.INTERIOR||loc1==Location.INTERIOR;case jsts.operation.overlay.OverlayOp.DIFFERENCE:return loc0==Location.INTERIOR&&loc1!=Location.INTERIOR;case jsts.operation.overlay.OverlayOp.SYMDIFFERENCE:return(loc0==Location.INTERIOR&&loc1!=Location.INTERIOR)||(loc0!=Location.INTERIOR&&loc1==Location.INTERIOR);}
return false;}
jsts.operation.overlay.OverlayOp.prototype.ptLocator=null;jsts.operation.overlay.OverlayOp.prototype.geomFact=null;jsts.operation.overlay.OverlayOp.prototype.resultGeom=null;jsts.operation.overlay.OverlayOp.prototype.graph=null;jsts.operation.overlay.OverlayOp.prototype.edgeList=null;jsts.operation.overlay.OverlayOp.prototype.resultPolyList=null;jsts.operation.overlay.OverlayOp.prototype.resultLineList=null;jsts.operation.overlay.OverlayOp.prototype.resultPointList=null;jsts.operation.overlay.OverlayOp.prototype.getResultGeometry=function(funcCode){this.computeOverlay(funcCode);return this.resultGeom;}
jsts.operation.overlay.OverlayOp.prototype.getGraph=function(){return this.graph;}
jsts.operation.overlay.OverlayOp.prototype.computeOverlay=function(opCode){this.copyPoints(0);this.copyPoints(1);this.arg[0].computeSelfNodes(this.li,false);this.arg[1].computeSelfNodes(this.li,false);this.arg[0].computeEdgeIntersections(this.arg[1],this.li,true);var baseSplitEdges=new ArrayList();this.arg[0].computeSplitEdges(baseSplitEdges);this.arg[1].computeSplitEdges(baseSplitEdges);var splitEdges=baseSplitEdges;this.insertUniqueEdges(baseSplitEdges);this.computeLabelsFromDepths();this.replaceCollapsedEdges();EdgeNodingValidator.checkValid(this.edgeList.getEdges());this.graph.addEdges(this.edgeList.getEdges());this.computeLabelling();this.labelIncompleteNodes();this.findResultAreaEdges(opCode);this.cancelDuplicateResultEdges();var polyBuilder=new PolygonBuilder(this.geomFact);polyBuilder.add(this.graph);this.resultPolyList=polyBuilder.getPolygons();var lineBuilder=new LineBuilder(this,this.geomFact,this.ptLocator);this.resultLineList=lineBuilder.build(opCode);var pointBuilder=new PointBuilder(this,this.geomFact,this.ptLocator);this.resultPointList=pointBuilder.build(opCode);this.resultGeom=this.computeGeometry(this.resultPointList,this.resultLineList,this.resultPolyList,opCode);}
jsts.operation.overlay.OverlayOp.prototype.insertUniqueEdges=function(edges){for(var i=edges.iterator();i.hasNext();){var e=i.next();this.insertUniqueEdge(e);}}
jsts.operation.overlay.OverlayOp.prototype.insertUniqueEdge=function(e){var existingEdge=this.edgeList.findEqualEdge(e);if(existingEdge!==null){var existingLabel=existingEdge.getLabel();var labelToMerge=e.getLabel();if(!existingEdge.isPointwiseEqual(e)){labelToMerge=new Label(e.getLabel());labelToMerge.flip();}
var depth=existingEdge.getDepth();if(depth.isNull()){depth.add(existingLabel);}
depth.add(labelToMerge);existingLabel.merge(labelToMerge);}else{this.edgeList.add(e);}};jsts.operation.overlay.OverlayOp.prototype.computeLabelsFromDepths=function(){for(var it=this.edgeList.iterator();it.hasNext();){var e=it.next();var lbl=e.getLabel();var depth=e.getDepth();if(!depth.isNull()){depth.normalize();for(var i=0;i<2;i++){if(!lbl.isNull(i)&&lbl.isArea()&&!depth.isNull(i)){if(depth.getDelta(i)==0){lbl.toLine(i);}else{Assert.isTrue(!depth.isNull(i,Position.LEFT),'depth of LEFT side has not been initialized');lbl.setLocation(i,Position.LEFT,depth.getLocation(i,Position.LEFT));Assert.isTrue(!depth.isNull(i,Position.RIGHT),'depth of RIGHT side has not been initialized');lbl.setLocation(i,Position.RIGHT,depth.getLocation(i,Position.RIGHT));}}}}}}
jsts.operation.overlay.OverlayOp.prototype.replaceCollapsedEdges=function(){var newEdges=new ArrayList();for(var it=this.edgeList.iterator();it.hasNext();){var e=it.next();if(e.isCollapsed()){it.remove();newEdges.add(e.getCollapsedEdge());}}
this.edgeList.addAll(newEdges);}
jsts.operation.overlay.OverlayOp.prototype.copyPoints=function(argIndex){for(var i=this.arg[argIndex].getNodeIterator();i.hasNext();){var graphNode=i.next();var newNode=this.graph.addNode(graphNode.getCoordinate());newNode.setLabel(argIndex,graphNode.getLabel().getLocation(argIndex));}}
jsts.operation.overlay.OverlayOp.prototype.computeLabelling=function(){for(var nodeit=this.graph.getNodes().iterator();nodeit.hasNext();){var node=nodeit.next();node.getEdges().computeLabelling(this.arg);}
this.mergeSymLabels();this.updateNodeLabelling();}
jsts.operation.overlay.OverlayOp.prototype.mergeSymLabels=function(){for(var nodeit=this.graph.getNodes().iterator();nodeit.hasNext();){var node=nodeit.next();node.getEdges().mergeSymLabels();}}
jsts.operation.overlay.OverlayOp.prototype.updateNodeLabelling=function(){for(var nodeit=this.graph.getNodes().iterator();nodeit.hasNext();){var node=nodeit.next();var lbl=node.getEdges().getLabel();node.getLabel().merge(lbl);}}
jsts.operation.overlay.OverlayOp.prototype.labelIncompleteNodes=function(){var nodeCount=0;for(var ni=this.graph.getNodes().iterator();ni.hasNext();){var n=ni.next();var label=n.getLabel();if(n.isIsolated()){nodeCount++;if(label.isNull(0))
this.labelIncompleteNode(n,0);else
this.labelIncompleteNode(n,1);}
n.getEdges().updateLabelling(label);}};jsts.operation.overlay.OverlayOp.prototype.labelIncompleteNode=function(n,targetIndex){var loc=this.ptLocator.locate(n.getCoordinate(),this.arg[targetIndex].getGeometry());n.getLabel().setLocation(targetIndex,loc);};jsts.operation.overlay.OverlayOp.prototype.findResultAreaEdges=function(opCode){for(var it=this.graph.getEdgeEnds().iterator();it.hasNext();){var de=it.next();var label=de.getLabel();if(label.isArea()&&!de.isInteriorAreaEdge()&&jsts.operation.overlay.OverlayOp.isResultOfOp(label.getLocation(0,Position.RIGHT),label.getLocation(1,Position.RIGHT),opCode)){de.setInResult(true);}}};jsts.operation.overlay.OverlayOp.prototype.cancelDuplicateResultEdges=function(){for(var it=this.graph.getEdgeEnds().iterator();it.hasNext();){var de=it.next();var sym=de.getSym();if(de.isInResult()&&sym.isInResult()){de.setInResult(false);sym.setInResult(false);}}};jsts.operation.overlay.OverlayOp.prototype.isCoveredByLA=function(coord){if(this.isCovered(coord,this.resultLineList))
return true;if(this.isCovered(coord,this.resultPolyList))
return true;return false;};jsts.operation.overlay.OverlayOp.prototype.isCoveredByA=function(coord){if(this.isCovered(coord,this.resultPolyList))
return true;return false;};jsts.operation.overlay.OverlayOp.prototype.isCovered=function(coord,geomList){for(var it=geomList.iterator();it.hasNext();){var geom=it.next();var loc=this.ptLocator.locate(coord,geom);if(loc!=Location.EXTERIOR)
return true;}
return false;};jsts.operation.overlay.OverlayOp.prototype.computeGeometry=function(resultPointList,resultLineList,resultPolyList,opcode){var geomList=new ArrayList();geomList.addAll(resultPointList);geomList.addAll(resultLineList);geomList.addAll(resultPolyList);return this.geomFact.buildGeometry(geomList);};jsts.operation.overlay.OverlayOp.prototype.createEmptyResult=function(opCode){var result=null;switch(resultDimension(opCode,this.arg[0].getGeometry(),this.arg[1].getGeometry())){case-1:result=geomFact.createGeometryCollection();break;case 0:result=geomFact.createPoint(null);break;case 1:result=geomFact.createLineString(null);break;case 2:result=geomFact.createPolygon(null,null);break;}
return result;};jsts.operation.overlay.OverlayOp.prototype.resultDimension=function(opCode,g0,g1){var dim0=g0.getDimension();var dim1=g1.getDimension();var resultDimension=-1;switch(opCode){case jsts.operation.overlay.OverlayOp.INTERSECTION:resultDimension=Math.min(dim0,dim1);break;case jsts.operation.overlay.OverlayOp.UNION:resultDimension=Math.max(dim0,dim1);break;case jsts.operation.overlay.OverlayOp.DIFFERENCE:resultDimension=dim0;break;case jsts.operation.overlay.OverlayOp.SYMDIFFERENCE:resultDimension=Math.max(dim0,dim1);break;}
return resultDimension;};})();(function(){var NodeBase=function(){this.items=new javascript.util.ArrayList();this.subnode=[null,null];};NodeBase.getSubnodeIndex=function(interval,centre){var subnodeIndex=-1;if(interval.min>=centre){subnodeIndex=1;}
if(interval.max<=centre){subnodeIndex=0;}
return subnodeIndex;};NodeBase.prototype.getItems=function(){return this.items;};NodeBase.prototype.add=function(item){this.items.add(item);};NodeBase.prototype.addAllItems=function(items){items.addAll(this.items);var i=0,il=2;for(i;i<il;i++){if(this.subnode[i]!==null){this.subnode[i].addAllItems(items);}}
return items;};NodeBase.prototype.addAllItemsFromOverlapping=function(interval,resultItems){if(interval!==null&&!this.isSearchMatch(interval)){return;}
resultItems.addAll(this.items);if(this.subnode[0]!==null){this.subnode[0].addAllItemsFromOverlapping(interval,resultItems);}
if(this.subnode[1]!==null){this.subnode[1].addAllItemsFromOverlapping(interval,resultItems);}};NodeBase.prototype.remove=function(itemInterval,item){if(!this.isSearchMatch(itemInterval)){return false;}
var found=false,i=0,il=2;for(i;i<il;i++){if(this.subnode[i]!==null){found=this.subnode[i].remove(itemInterval,item);if(found){if(this.subnode[i].isPrunable()){this.subnode[i]=null;}
break;}}}
if(found){return found;}
found=this.items.remove(item);return found;};NodeBase.prototype.isPrunable=function(){return!(this.hasChildren()||this.hasItems());};NodeBase.prototype.hasChildren=function(){var i=0,il=2;for(i;i<il;i++){if(this.subnode[i]!==null){return true;}}
return false;};NodeBase.prototype.hasItems=function(){return!this.items.isEmpty();};NodeBase.prototype.depth=function(){var maxSubDepth=0,i=0,il=2,sqd;for(i;i<il;i++){if(this.subnode[i]!==null){sqd=this.subnode[i].depth();if(sqd>maxSubDepth){maxSubDepth=sqd;}}}
return maxSubDepth+1;};NodeBase.prototype.size=function(){var subSize=0,i=0,il=2;for(i;i<il;i++){if(this.subnode[i]!==null){subSize+=this.subnode[i].size();}}
return subSize+this.items.size();};NodeBase.prototype.nodeSize=function(){var subSize=0,i=0,il=2;for(i;i<il;i++){if(this.subnode[i]!==null){subSize+=this.subnode[i].nodeSize();}}
return subSize+1;};jsts.index.bintree.NodeBase=NodeBase;})();(function(){var Interval=function(){this.min=0.0;this.max=0.0;if(arguments.length===1){var interval=arguments[0];this.init(interval.min,interval.max);}else if(arguments.length===2){this.init(arguments[0],arguments[1]);}};Interval.prototype.init=function(min,max){this.min=min;this.max=max;if(min>max){this.min=max;this.max=min;}};Interval.prototype.getMin=function(){return this.min;};Interval.prototype.getMax=function(){return this.max;};Interval.prototype.getWidth=function(){return(this.max-this.min);};Interval.prototype.expandToInclude=function(interval){if(interval.max>this.max){this.max=interval.max;}
if(interval.min<this.min){this.min=interval.min;}};Interval.prototype.overlaps=function(){if(arguments.length===1){return this.overlapsInterval.apply(this,arguments);}else{return this.overlapsMinMax.apply(this,arguments);}};Interval.prototype.overlapsInterval=function(interval){return this.overlaps(interval.min,interval.max);};Interval.prototype.overlapsMinMax=function(min,max){if(this.min>max||this.max<min){return false;}
return true;};Interval.prototype.contains=function(){var interval;if(arguments[0]instanceof jsts.index.bintree.Interval){interval=arguments[0];return this.containsMinMax(interval.min,interval.max);}else if(arguments.length===1){return this.containsPoint(arguments[0]);}else{return this.containsMinMax(arguments[0],arguments[1]);}};Interval.prototype.containsMinMax=function(min,max){return(min>=this.min&&max<=this.max);};Interval.prototype.containsPoint=function(p){return(p>=this.min&&p<=this.max);};jsts.index.bintree.Interval=Interval;})();jsts.index.DoubleBits=function(){};jsts.index.DoubleBits.powerOf2=function(exp){return Math.pow(2,exp);};jsts.index.DoubleBits.exponent=function(d){return jsts.index.DoubleBits.CVTFWD(64,d)-1023;};jsts.index.DoubleBits.CVTFWD=function(NumW,Qty){var Sign,Expo,Mant,Bin,nb01='';var Inf={32:{d:0x7F,c:0x80,b:0,a:0},64:{d:0x7FF0,c:0,b:0,a:0}};var ExW={32:8,64:11}[NumW],MtW=NumW-ExW-1;if(!Bin){Sign=Qty<0||1/Qty<0;if(!isFinite(Qty)){Bin=Inf[NumW];if(Sign){Bin.d+=1<<(NumW/4-1);}
Expo=Math.pow(2,ExW)-1;Mant=0;}}
if(!Bin){Expo={32:127,64:1023}[NumW];Mant=Math.abs(Qty);while(Mant>=2){Expo++;Mant/=2;}
while(Mant<1&&Expo>0){Expo--;Mant*=2;}
if(Expo<=0){Mant/=2;nb01='Zero or Denormal';}
if(NumW===32&&Expo>254){nb01='Too big for Single';Bin={d:Sign?0xFF:0x7F,c:0x80,b:0,a:0};Expo=Math.pow(2,ExW)-1;Mant=0;}}
return Expo;};(function(){var DoubleBits=jsts.index.DoubleBits;var Interval=jsts.index.bintree.Interval;var Key=function(interval){this.pt=0.0;this.level=0;this.computeKey(interval);};Key.computeLevel=function(interval){var dx=interval.getWidth(),level;level=DoubleBits.exponent(dx)+1;return level;};Key.prototype.getPoint=function(){return this.pt;};Key.prototype.getLevel=function(){return this.level;};Key.prototype.getInterval=function(){return this.interval;};Key.prototype.computeKey=function(itemInterval){this.level=Key.computeLevel(itemInterval);this.interval=new Interval();this.computeInterval(this.level,itemInterval);while(!this.interval.contains(itemInterval)){this.level+=1;this.computeInterval(this.level,itemInterval);}};Key.prototype.computeInterval=function(level,itemInterval){var size=DoubleBits.powerOf2(level);this.pt=Math.floor(itemInterval.getMin()/size)*size;this.interval.init(this.pt,this.pt+size);};jsts.index.bintree.Key=Key;})();(function(){var NodeBase=jsts.index.bintree.NodeBase;var Key=jsts.index.bintree.Key;var Interval=jsts.index.bintree.Interval;var Node=function(interval,level){this.items=new javascript.util.ArrayList();this.subnode=[null,null];this.interval=interval;this.level=level;this.centre=(interval.getMin()+interval.getMax())/2;};Node.prototype=new NodeBase();Node.constructor=Node;Node.createNode=function(itemInterval){var key,node;key=new Key(itemInterval);node=new Node(key.getInterval(),key.getLevel());return node;};Node.createExpanded=function(node,addInterval){var expandInt,largerNode;expandInt=new Interval(addInterval);if(node!==null){expandInt.expandToInclude(node.interval);}
largerNode=Node.createNode(expandInt);if(node!==null){largerNode.insert(node);}
return largerNode;};Node.prototype.getInterval=function(){return this.interval;};Node.prototype.isSearchMatch=function(itemInterval){return itemInterval.overlaps(this.interval);};Node.prototype.getNode=function(searchInterval){var subnodeIndex=NodeBase.getSubnodeIndex(searchInterval,this.centre),node;if(subnodeIndex!=-1){node=this.getSubnode(subnodeIndex);return node.getNode(searchInterval);}else{return this;}};Node.prototype.find=function(searchInterval){var subnodeIndex=NodeBase.getSubnodeIndex(searchInterval,this.centre),node;if(subnodeIndex===-1){return this;}
if(this.subnode[subnodeIndex]!==null){node=this.subnode[subnodeIndex];return node.find(searchInterval);}
return this;};Node.prototype.insert=function(node){var index=NodeBase.getSubnodeIndex(node.interval,this.centre),childNode;if(node.level===this.level-1){this.subnode[index]=node;}else{childNode=this.createSubnode(index);childNode.insert(node);this.subnode[index]=childNode;}};Node.prototype.getSubnode=function(index){if(this.subnode[index]===null){this.subnode[index]=this.createSubnode(index);}
return this.subnode[index];};Node.prototype.createSubnode=function(index){var min,max,subInt,node;min=0.0;max=0.0;switch(index){case 0:min=this.interval.getMin();max=this.centre;break;case 1:min=this.centre;max=this.interval.getMax();break;}
subInt=new Interval(min,max);node=new Node(subInt,this.level-1);return node;};jsts.index.bintree.Node=Node;})();(function(){var Node=jsts.index.bintree.Node;var NodeBase=jsts.index.bintree.NodeBase;var Root=function(){this.subnode=[null,null];this.items=new javascript.util.ArrayList();};Root.prototype=new jsts.index.bintree.NodeBase();Root.constructor=Root;Root.origin=0.0;Root.prototype.insert=function(itemInterval,item){var index=NodeBase.getSubnodeIndex(itemInterval,Root.origin),node,largerNode;if(index===-1){this.add(item);return;}
node=this.subnode[index];if(node===null||!node.getInterval().contains(itemInterval)){largerNode=Node.createExpanded(node,itemInterval);this.subnode[index]=largerNode;}
this.insertContained(this.subnode[index],itemInterval,item);};Root.prototype.insertContained=function(tree,itemInterval,item){var isZeroArea,node;isZeroArea=jsts.index.IntervalSize.isZeroWidth(itemInterval.getMin(),itemInterval.getMax());node=isZeroArea?tree.find(itemInterval):tree.getNode(itemInterval);node.add(item);};Root.prototype.isSearchMatch=function(interval){return true;};jsts.index.bintree.Root=Root;})();(function(){var Interval=jsts.index.bintree.Interval;var Root=jsts.index.bintree.Root;var Bintree=function(){this.root=new Root();this.minExtent=1.0;};Bintree.ensureExtent=function(itemInterval,minExtent){var min,max;min=itemInterval.getMin();max=itemInterval.getMax();if(min!==max){return itemInterval;}
if(min===max){min=min-(minExtent/2.0);max=min+(minExtent/2.0);}
return new Interval(min,max);};Bintree.prototype.depth=function(){if(this.root!==null){return this.root.depth();}
return 0;};Bintree.prototype.size=function(){if(this.root!==null){return this.root.size();}
return 0;};Bintree.prototype.nodeSize=function(){if(this.root!==null){return this.root.nodeSize();}
return 0;};Bintree.prototype.insert=function(itemInterval,item){this.collectStats(itemInterval);var insertInterval=Bintree.ensureExtent(itemInterval,this.minExtent);this.root.insert(insertInterval,item);};Bintree.prototype.remove=function(itemInterval,item){var insertInterval=Bintree.ensureExtent(itemInterval,this.minExtent);return this.root.remove(insertInterval,item);};Bintree.prototype.iterator=function(){var foundItems=new javascript.util.ArrayList();this.root.addAllItems(foundItems);return foundItems.iterator();};Bintree.prototype.query=function(){if(arguments.length===2){this.queryAndAdd(arguments[0],arguments[1]);}else{var x=arguments[0];if(!x instanceof Interval){x=new Interval(x,x);}
return this.queryInterval(x);}};Bintree.prototype.queryInterval=function(interval){var foundItems=new javascript.util.ArrayList();this.query(interval,foundItems);return foundItems;};Bintree.prototype.queryAndAdd=function(interval,foundItems){this.root.addAllItemsFromOverlapping(interval,foundItems);};Bintree.prototype.collectStats=function(interval){var del=interval.getWidth();if(del<this.minExtent&&del>0.0){this.minExtent=del;}};jsts.index.bintree.Bintree=Bintree;})();jsts.index.IntervalSize=function(){};jsts.index.IntervalSize.MIN_BINARY_EXPONENT=-50;jsts.index.IntervalSize.isZeroWidth=function(min,max){var width=max-min;if(width===0.0){return true;}
var maxAbs,scaledInterval,level;maxAbs=Math.max(Math.abs(min),Math.abs(max));scaledInterval=width/maxAbs;level=jsts.index.DoubleBits.exponent(scaledInterval);return level<=jsts.index.IntervalSize.MIN_BINARY_EXPONENT;};jsts.geomgraph.index.SimpleEdgeSetIntersector=function(){};jsts.geomgraph.index.SimpleEdgeSetIntersector.prototype=new jsts.geomgraph.index.EdgeSetIntersector();jsts.geomgraph.index.SimpleEdgeSetIntersector.prototype.nOverlaps=0;jsts.geomgraph.index.SimpleEdgeSetIntersector.prototype.computeIntersections=function(edges,si,testAllSegments){if(si instanceof javascript.util.List){this.computeIntersections2.apply(this,arguments);return;}
this.nOverlaps=0;for(var i0=edges.iterator();i0.hasNext();){var edge0=i0.next();for(var i1=edges.iterator();i1.hasNext();){var edge1=i1.next();if(testAllSegments||edge0!=edge1)
this.computeIntersects(edge0,edge1,si);}}};jsts.geomgraph.index.SimpleEdgeSetIntersector.prototype.computeIntersections2=function(edges0,edges1,si){this.nOverlaps=0;for(var i0=edges0.iterator();i0.hasNext();){var edge0=i0.next();for(var i1=edges1.iterator();i1.hasNext();){var edge1=i1.next();this.computeIntersects(edge0,edge1,si);}}};jsts.geomgraph.index.SimpleEdgeSetIntersector.prototype.computeIntersects=function(e0,e1,si){var pts0=e0.getCoordinates();var pts1=e1.getCoordinates();var i0,i1;for(i0=0;i0<pts0.length-1;i0++){for(i1=0;i1<pts1.length-1;i1++){si.addIntersections(e0,i0,e1,i1);}}};jsts.index.ArrayListVisitor=function(){this.items=[];};jsts.index.ArrayListVisitor.prototype.visitItem=function(item){this.items.push(item);};jsts.index.ArrayListVisitor.prototype.getItems=function(){return this.items;};(function(){var ArrayList=javascript.util.ArrayList;var GeometryTransformer=function(){};GeometryTransformer.prototype.inputGeom=null;GeometryTransformer.prototype.factory=null;GeometryTransformer.prototype.pruneEmptyGeometry=true;GeometryTransformer.prototype.preserveGeometryCollectionType=true;GeometryTransformer.prototype.preserveCollections=false;GeometryTransformer.prototype.reserveType=false;GeometryTransformer.prototype.getInputGeometry=function(){return this.inputGeom;};GeometryTransformer.prototype.transform=function(inputGeom){this.inputGeom=inputGeom;this.factory=inputGeom.getFactory();if(inputGeom instanceof jsts.geom.Point)
return this.transformPoint(inputGeom,null);if(inputGeom instanceof jsts.geom.MultiPoint)
return this.transformMultiPoint(inputGeom,null);if(inputGeom instanceof jsts.geom.LinearRing)
return this.transformLinearRing(inputGeom,null);if(inputGeom instanceof jsts.geom.LineString)
return this.transformLineString(inputGeom,null);if(inputGeom instanceof jsts.geom.MultiLineString)
return this.transformMultiLineString(inputGeom,null);if(inputGeom instanceof jsts.geom.Polygon)
return this.transformPolygon(inputGeom,null);if(inputGeom instanceof jsts.geom.MultiPolygon)
return this.transformMultiPolygon(inputGeom,null);if(inputGeom instanceof jsts.geom.GeometryCollection)
return this.transformGeometryCollection(inputGeom,null);throw new jsts.error.IllegalArgumentException('Unknown Geometry subtype: '+
inputGeom.getClass().getName());};GeometryTransformer.prototype.createCoordinateSequence=function(coords){return this.factory.getCoordinateSequenceFactory().create(coords);};GeometryTransformer.prototype.copy=function(seq){return seq.clone();};GeometryTransformer.prototype.transformCoordinates=function(coords,parent){return this.copy(coords);};GeometryTransformer.prototype.transformPoint=function(geom,parent){return this.factory.createPoint(this.transformCoordinates(geom.getCoordinateSequence(),geom));};GeometryTransformer.prototype.transformMultiPoint=function(geom,parent){var transGeomList=new ArrayList();for(var i=0;i<geom.getNumGeometries();i++){var transformGeom=this.transformPoint(geom.getGeometryN(i),geom);if(transformGeom==null)
continue;if(transformGeom.isEmpty())
continue;transGeomList.add(transformGeom);}
return this.factory.buildGeometry(transGeomList);};GeometryTransformer.prototype.transformLinearRing=function(geom,parent){var seq=this.transformCoordinates(geom.getCoordinateSequence(),geom);var seqSize=seq.length;if(seqSize>0&&seqSize<4&&!this.preserveType)
return this.factory.createLineString(seq);return this.factory.createLinearRing(seq);};GeometryTransformer.prototype.transformLineString=function(geom,parent){return this.factory.createLineString(this.transformCoordinates(geom.getCoordinateSequence(),geom));};GeometryTransformer.prototype.transformMultiLineString=function(geom,parent){var transGeomList=new ArrayList();for(var i=0;i<geom.getNumGeometries();i++){var transformGeom=this.transformLineString(geom.getGeometryN(i),geom);if(transformGeom==null)
continue;if(transformGeom.isEmpty())
continue;transGeomList.add(transformGeom);}
return this.factory.buildGeometry(transGeomList);};GeometryTransformer.prototype.transformPolygon=function(geom,parent){var isAllValidLinearRings=true;var shell=this.transformLinearRing(geom.getExteriorRing(),geom);if(shell==null||!(shell instanceof jsts.geom.LinearRing)||shell.isEmpty())
isAllValidLinearRings=false;var holes=new ArrayList();for(var i=0;i<geom.getNumInteriorRing();i++){var hole=this.transformLinearRing(geom.getInteriorRingN(i),geom);if(hole==null||hole.isEmpty()){continue;}
if(!(hole instanceof jsts.geom.LinearRing))
isAllValidLinearRings=false;holes.add(hole);}
if(isAllValidLinearRings)
return this.factory.createPolygon(shell,holes.toArray());else{var components=new ArrayList();if(shell!=null)
components.add(shell);components.addAll(holes);return this.factory.buildGeometry(components);}};GeometryTransformer.prototype.transformMultiPolygon=function(geom,parent){var transGeomList=new ArrayList();for(var i=0;i<geom.getNumGeometries();i++){var transformGeom=this.transformPolygon(geom.getGeometryN(i),geom);if(transformGeom==null)
continue;if(transformGeom.isEmpty())
continue;transGeomList.add(transformGeom);}
return this.factory.buildGeometry(transGeomList);};GeometryTransformer.prototype.transformGeometryCollection=function(geom,parent){var transGeomList=new ArrayList();for(var i=0;i<geom.getNumGeometries();i++){var transformGeom=this.transform(geom.getGeometryN(i));if(transformGeom==null)
continue;if(this.pruneEmptyGeometry&&transformGeom.isEmpty())
continue;transGeomList.add(transformGeom);}
if(this.preserveGeometryCollectionType)
return this.factory.createGeometryCollection(GeometryFactory.toGeometryArray(transGeomList));return this.factory.buildGeometry(transGeomList);};jsts.geom.util.GeometryTransformer=GeometryTransformer;})();(function(){var LineStringSnapper=jsts.operation.overlay.snap.LineStringSnapper;var PrecisionModel=jsts.geom.PrecisionModel;var TreeSet=javascript.util.TreeSet;var SnapTransformer=function(snapTolerance,snapPts,isSelfSnap){this.snapTolerance=snapTolerance;this.snapPts=snapPts;this.isSelfSnap=isSelfSnap||false;};SnapTransformer.prototype=new jsts.geom.util.GeometryTransformer();SnapTransformer.prototype.snapTolerance=null;SnapTransformer.prototype.snapPts=null;SnapTransformer.prototype.isSelfSnap=false;SnapTransformer.prototype.transformCoordinates=function(coords,parent){var srcPts=coords;var newPts=this.snapLine(srcPts,this.snapPts);return newPts;};SnapTransformer.prototype.snapLine=function(srcPts,snapPts){var snapper=new LineStringSnapper(srcPts,this.snapTolerance);snapper.setAllowSnappingToSourceVertices(this.isSelfSnap);return snapper.snapTo(snapPts);};var GeometrySnapper=function(srcGeom){this.srcGeom=srcGeom;};GeometrySnapper.SNAP_PRECISION_FACTOR=1e-9;GeometrySnapper.computeOverlaySnapTolerance=function(g){if(arguments.length===2){return GeometrySnapper.computeOverlaySnapTolerance2.apply(this,arguments);}
var snapTolerance=this.computeSizeBasedSnapTolerance(g);var pm=g.getPrecisionModel();if(pm.getType()==PrecisionModel.FIXED){var fixedSnapTol=(1/pm.getScale())*2/1.415;if(fixedSnapTol>snapTolerance)
snapTolerance=fixedSnapTol;}
return snapTolerance;};GeometrySnapper.computeSizeBasedSnapTolerance=function(g){var env=g.getEnvelopeInternal();var minDimension=Math.min(env.getHeight(),env.getWidth());var snapTol=minDimension*GeometrySnapper.SNAP_PRECISION_FACTOR;return snapTol;};GeometrySnapper.computeOverlaySnapTolerance2=function(g0,g1){return Math.min(this.computeOverlaySnapTolerance(g0),this.computeOverlaySnapTolerance(g1));};GeometrySnapper.snap=function(g0,g1,snapTolerance){var snapGeom=[];var snapper0=new GeometrySnapper(g0);snapGeom[0]=snapper0.snapTo(g1,snapTolerance);var snapper1=new GeometrySnapper(g1);snapGeom[1]=snapper1.snapTo(snapGeom[0],snapTolerance);return snapGeom;};GeometrySnapper.snapToSelf=function(g0,snapTolerance,cleanResult){var snapper0=new GeometrySnapper(g0);return snapper0.snapToSelf(snapTolerance,cleanResult);};GeometrySnapper.prototype.srcGeom=null;GeometrySnapper.prototype.snapTo=function(snapGeom,snapTolerance){var snapPts=this.extractTargetCoordinates(snapGeom);var snapTrans=new SnapTransformer(snapTolerance,snapPts);return snapTrans.transform(this.srcGeom);};GeometrySnapper.prototype.snapToSelf=function(snapTolerance,cleanResult){var snapPts=this.extractTargetCoordinates(srcGeom);var snapTrans=new SnapTransformer(snapTolerance,snapPts,true);var snappedGeom=snapTrans.transform(srcGeom);var result=snappedGeom;if(cleanResult&&result instanceof Polygonal){result=snappedGeom.buffer(0);}
return result;};GeometrySnapper.prototype.extractTargetCoordinates=function(g){var ptSet=new TreeSet();var pts=g.getCoordinates();for(var i=0;i<pts.length;i++){ptSet.add(pts[i]);}
return ptSet.toArray();};GeometrySnapper.prototype.computeSnapTolerance=function(ringPts){var minSegLen=this.computeMinimumSegmentLength(ringPts);var snapTol=minSegLen/10;return snapTol;};GeometrySnapper.prototype.computeMinimumSegmentLength=function(pts){var minSegLen=Number.MAX_VALUE;for(var i=0;i<pts.length-1;i++){var segLen=pts[i].distance(pts[i+1]);if(segLen<minSegLen)
minSegLen=segLen;}
return minSegLen;};jsts.operation.overlay.snap.GeometrySnapper=GeometrySnapper;})();(function(){var OverlayOp=jsts.operation.overlay.OverlayOp;var GeometrySnapper=jsts.operation.overlay.snap.GeometrySnapper;var SnapOverlayOp=function(g1,g2){this.geom=[];this.geom[0]=g1;this.geom[1]=g2;this.computeSnapTolerance();};SnapOverlayOp.overlayOp=function(g0,g1,opCode){var op=new SnapOverlayOp(g0,g1);return op.getResultGeometry(opCode);};SnapOverlayOp.intersection=function(g0,g1){return this.overlayOp(g0,g1,OverlayOp.INTERSECTION);};SnapOverlayOp.union=function(g0,g1){return this.overlayOp(g0,g1,OverlayOp.UNION);};SnapOverlayOp.difference=function(g0,g1){return overlayOp(g0,g1,OverlayOp.DIFFERENCE);};SnapOverlayOp.symDifference=function(g0,g1){return overlayOp(g0,g1,OverlayOp.SYMDIFFERENCE);};SnapOverlayOp.prototype.geom=null;SnapOverlayOp.prototype.snapTolerance=null;SnapOverlayOp.prototype.computeSnapTolerance=function(){this.snapTolerance=GeometrySnapper.computeOverlaySnapTolerance(this.geom[0],this.geom[1]);};SnapOverlayOp.prototype.getResultGeometry=function(opCode){var prepGeom=this.snap(this.geom);var result=OverlayOp.overlayOp(prepGeom[0],prepGeom[1],opCode);return this.prepareResult(result);};SnapOverlayOp.prototype.selfSnap=function(geom){var snapper0=new GeometrySnapper(geom);var snapGeom=snapper0.snapTo(geom,this.snapTolerance);return snapGeom;};SnapOverlayOp.prototype.snap=function(geom){var remGeom=geom;var snapGeom=GeometrySnapper.snap(remGeom[0],remGeom[1],this.snapTolerance);return snapGeom;};SnapOverlayOp.prototype.prepareResult=function(geom){return geom;};SnapOverlayOp.prototype.cbr=null;SnapOverlayOp.prototype.removeCommonBits=function(geom){this.cbr=new jsts.precision.CommonBitsRemover();this.cbr.add(this.geom[0]);this.cbr.add(this.geom[1]);var remGeom=[];remGeom[0]=cbr.removeCommonBits(this.geom[0].clone());remGeom[1]=cbr.removeCommonBits(this.geom[1].clone());return remGeom;};jsts.operation.overlay.snap.SnapOverlayOp=SnapOverlayOp;})();jsts.noding.Octant=function(){throw jsts.error.AbstractMethodInvocationError();};jsts.noding.Octant.octant=function(dx,dy){if(dx instanceof jsts.geom.Coordinate){return jsts.noding.Octant.octant2.apply(this,arguments);}
if(dx===0.0&&dy===0.0)
throw new jsts.error.IllegalArgumentError('Cannot compute the octant for point ( '+dx+', '+dy+' )');var adx=Math.abs(dx);var ady=Math.abs(dy);if(dx>=0){if(dy>=0){if(adx>=ady)
return 0;else
return 1;}
else{if(adx>=ady)
return 7;else
return 6;}}
else{if(dy>=0){if(adx>=ady)
return 3;else
return 2;}
else{if(adx>=ady)
return 4;else
return 5;}}};jsts.noding.Octant.octant2=function(p0,p1){var dx=p1.x-p0.x;var dy=p1.y-p0.y;if(dx===0.0&&dy===0.0)
throw new jsts.error.IllegalArgumentError('Cannot compute the octant for two identical points '+p0);return jsts.noding.Octant.octant(dx,dy);};jsts.operation.union.UnionInteracting=function(g0,g1){this.g0=g0;this.g1=g1;this.geomFactory=g0.getFactory();this.interacts0=[];this.interacts1=[];};jsts.operation.union.UnionInteracting.union=function(g0,g1){var uue=new jsts.operation.union.UnionInteracting(g0,g1);return uue.union();};jsts.operation.union.UnionInteracting.prototype.geomFactory=null;jsts.operation.union.UnionInteracting.prototype.g0=null;jsts.operation.union.UnionInteracting.prototype.g1=null;jsts.operation.union.UnionInteracting.prototype.interacts0=null;jsts.operation.union.UnionInteracting.prototype.interacts1=null;jsts.operation.union.UnionInteracting.prototype.union=function(){this.computeInteracting();var int0=this.extractElements(this.g0,this.interacts0,true);var int1=this.extractElements(this.g1,this.interacts1,true);if(int0.isEmpty()||int1.isEmpty()){}
var union=in0.union(int1);var disjoint0=this.extractElements(this.g0,this.interacts0,false);var disjoint1=this.extractElements(this.g1,this.interacts1,false);var overallUnion=jsts.geom.util.GeometryCombiner.combine(union,disjoint0,disjoint1);return overallUnion;};jsts.operation.union.UnionInteracting.prototype.bufferUnion=function(g0,g1){var factory=g0.getFactory();var gColl=factory.createGeometryCollection([g0,g1]);var unionAll=gColl.buffer(0.0);return unionAll;};jsts.operation.union.UnionInteracting.prototype.computeInteracting=function(elem0){if(!elem0){for(var i=0,l=this.g0.getNumGeometries();i<l;i++){var elem=this.g0.getGeometryN(i);this.interacts0[i]=this.computeInteracting(elem);}}
else{var interactsWithAny=false;for(var i=0,l=g1.getNumGeometries();i<l;i++){var elem1=this.g1.getGeometryN(i);var interacts=elem1.getEnvelopeInternal().intersects(elem0.getEnvelopeInternal());if(interacts){this.interacts1[i]=true;interactsWithAny=true;}}
return interactsWithAny;}};jsts.operation.union.UnionInteracting.prototype.extractElements=function(geom,interacts,isInteracting){var extractedGeoms=[];for(var i=0,l=geom.getNumGeometries();i<l;i++){var elem=geom.getGeometryN(i);if(interacts[i]===isInteracting){extractedGeoms.push(elem);}}
return this.geomFactory.buildGeometry(extractedGeoms);};jsts.operation.union.PointGeometryUnion=function(pointGeom,otherGeom){this.pointGeom=pointGeom;this.otherGeom=otherGeom;this.geomFact=otherGeom.getFactory();};jsts.operation.union.PointGeometryUnion.union=function(pointGeom,otherGeom){var unioner=new jsts.operation.union.PointGeometryUnion(pointGeom,otherGeom);return unioner.union();};jsts.operation.union.PointGeometryUnion.prototype.pointGeom=null;jsts.operation.union.PointGeometryUnion.prototype.otherGeom=null;jsts.operation.union.PointGeometryUnion.prototype.geomFact=null;jsts.operation.union.PointGeometryUnion.prototype.union=function(){var locator=new jsts.algorithm.PointLocator();var exteriorCoords=[];for(var i=0,l=this.pointGeom.getNumGeometries();i<l;i++){var point=this.pointGeom.getGeometryN(i);var coord=point.getCoordinate();var loc=locator.locate(coord,this.otherGeom);if(loc===jsts.geom.Location.EXTERIOR){var include=true;for(var j=exteriorCoords.length;i--;){if(exteriorCoords[j].equals(coord)){include=false;break;}}
if(include){exteriorCoords.push(coord);}}}
exteriorCoords.sort(function(x,y){return x.compareTo(y);});if(exteriorCoords.length===0){return this.otherGeom;}
var ptComp=null;var coords=jsts.geom.CoordinateArrays.toCoordinateArray(exteriorCoords);if(coords.length===1){ptComp=this.geomFact.createPoint(coords[0]);}
else{ptComp=this.geomFact.createMultiPoint(coords);}
return jsts.geom.util.GeometryCombiner.combine(ptComp,this.otherGeom);};jsts.noding.IntersectionFinderAdder=function(li){this.li=li;this.interiorIntersections=new javascript.util.ArrayList();};jsts.noding.IntersectionFinderAdder.prototype=new jsts.noding.SegmentIntersector();jsts.noding.IntersectionFinderAdder.constructor=jsts.noding.IntersectionFinderAdder;jsts.noding.IntersectionFinderAdder.prototype.li=null;jsts.noding.IntersectionFinderAdder.prototype.interiorIntersections=null;jsts.noding.IntersectionFinderAdder.prototype.getInteriorIntersections=function(){return this.interiorIntersections;};jsts.noding.IntersectionFinderAdder.prototype.processIntersections=function(e0,segIndex0,e1,segIndex1){if(e0===e1&&segIndex0===segIndex1)
return;var p00=e0.getCoordinates()[segIndex0];var p01=e0.getCoordinates()[segIndex0+1];var p10=e1.getCoordinates()[segIndex1];var p11=e1.getCoordinates()[segIndex1+1];this.li.computeIntersection(p00,p01,p10,p11);if(this.li.hasIntersection()){if(this.li.isInteriorIntersection()){for(var intIndex=0;intIndex<this.li.getIntersectionNum();intIndex++){this.interiorIntersections.add(this.li.getIntersection(intIndex));}
e0.addIntersections(this.li,segIndex0,0);e1.addIntersections(this.li,segIndex1,1);}}};jsts.noding.IntersectionFinderAdder.prototype.isDone=function(){return false;};jsts.noding.snapround.MCIndexSnapRounder=function(pm){this.pm=pm;this.li=new jsts.algorithm.RobustLineIntersector();this.li.setPrecisionModel(pm);this.scaleFactor=pm.getScale();};jsts.noding.snapround.MCIndexSnapRounder.prototype=new jsts.noding.Noder();jsts.noding.snapround.MCIndexSnapRounder.constructor=jsts.noding.snapround.MCIndexSnapRounder;jsts.noding.snapround.MCIndexSnapRounder.prototype.pm=null;jsts.noding.snapround.MCIndexSnapRounder.prototype.li=null;jsts.noding.snapround.MCIndexSnapRounder.prototype.scaleFactor=null;jsts.noding.snapround.MCIndexSnapRounder.prototype.noder=null;jsts.noding.snapround.MCIndexSnapRounder.prototype.pointSnapper=null;jsts.noding.snapround.MCIndexSnapRounder.prototype.nodedSegStrings=null;jsts.noding.snapround.MCIndexSnapRounder.prototype.getNodedSubstrings=function(){return jsts.noding.NodedSegmentString.getNodedSubstrings(this.nodedSegStrings);};jsts.noding.snapround.MCIndexSnapRounder.prototype.computeNodes=function(inputSegmentStrings){this.nodedSegStrings=inputSegmentStrings;this.noder=new jsts.noding.MCIndexNoder();this.pointSnapper=new jsts.noding.snapround.MCIndexPointSnapper(this.noder.getIndex());this.snapRound(inputSegmentStrings,this.li);};jsts.noding.snapround.MCIndexSnapRounder.prototype.snapRound=function(segStrings,li){var intersections=this.findInteriorIntersections(segStrings,li);this.computeIntersectionSnaps(intersections);this.computeVertexSnaps(segStrings);};jsts.noding.snapround.MCIndexSnapRounder.prototype.findInteriorIntersections=function(segStrings,li){var intFinderAdder=new jsts.noding.IntersectionFinderAdder(li);this.noder.setSegmentIntersector(intFinderAdder);this.noder.computeNodes(segStrings);return intFinderAdder.getInteriorIntersections();};jsts.noding.snapround.MCIndexSnapRounder.prototype.computeIntersectionSnaps=function(snapPts){for(var it=snapPts.iterator();it.hasNext();){var snapPt=it.next();var hotPixel=new jsts.noding.snapround.HotPixel(snapPt,this.scaleFactor,this.li);this.pointSnapper.snap(hotPixel);}};jsts.noding.snapround.MCIndexSnapRounder.prototype.computeVertexSnaps=function(edges){if(edges instanceof jsts.noding.NodedSegmentString){this.computeVertexSnaps2.apply(this,arguments);return;}
for(var i0=edges.iterator();i0.hasNext();){var edge0=i0.next();this.computeVertexSnaps(edge0);}};jsts.noding.snapround.MCIndexSnapRounder.prototype.computeVertexSnaps2=function(e){var pts0=e.getCoordinates();for(var i=0;i<pts0.length-1;i++){var hotPixel=new jsts.noding.snapround.HotPixel(pts0[i],this.scaleFactor,this.li);var isNodeAdded=this.pointSnapper.snap(hotPixel,e,i);if(isNodeAdded){e.addIntersection(pts0[i],i);}}};jsts.operation.valid.ConnectedInteriorTester=function(geomGraph){this.geomGraph=geomGraph;this.geometryFactory=new jsts.geom.GeometryFactory();this.disconnectedRingcoord=null;};jsts.operation.valid.ConnectedInteriorTester.findDifferentPoint=function(coord,pt){var i=0,il=coord.length;for(i;i<il;i++){if(!coord[i].equals(pt))
return coord[i];}
return null;};jsts.operation.valid.ConnectedInteriorTester.prototype.getCoordinate=function(){return this.disconnectedRingcoord;};jsts.operation.valid.ConnectedInteriorTester.prototype.isInteriorsConnected=function(){var splitEdges=new javascript.util.ArrayList();this.geomGraph.computeSplitEdges(splitEdges);var graph=new jsts.geomgraph.PlanarGraph(new jsts.operation.overlay.OverlayNodeFactory());graph.addEdges(splitEdges);this.setInteriorEdgesInResult(graph);graph.linkResultDirectedEdges();var edgeRings=this.buildEdgeRings(graph.getEdgeEnds());this.visitShellInteriors(this.geomGraph.getGeometry(),graph);return!this.hasUnvisitedShellEdge(edgeRings);};jsts.operation.valid.ConnectedInteriorTester.prototype.setInteriorEdgesInResult=function(graph){var it=graph.getEdgeEnds().iterator(),de;while(it.hasNext()){de=it.next();if(de.getLabel().getLocation(0,jsts.geomgraph.Position.RIGHT)==jsts.geom.Location.INTERIOR){de.setInResult(true);}}};jsts.operation.valid.ConnectedInteriorTester.prototype.buildEdgeRings=function(dirEdges){var edgeRings=new javascript.util.ArrayList();for(var it=dirEdges.iterator();it.hasNext();){var de=it.next();if(de.isInResult()&&de.getEdgeRing()==null){var er=new jsts.operation.overlay.MaximalEdgeRing(de,this.geometryFactory);er.linkDirectedEdgesForMinimalEdgeRings();var minEdgeRings=er.buildMinimalRings();var i=0,il=minEdgeRings.length;for(i;i<il;i++){edgeRings.add(minEdgeRings[i]);}}}
return edgeRings;};jsts.operation.valid.ConnectedInteriorTester.prototype.visitShellInteriors=function(g,graph){if(g instanceof jsts.geom.Polygon){var p=g;this.visitInteriorRing(p.getExteriorRing(),graph);}
if(g instanceof jsts.geom.MultiPolygon){var mp=g;for(var i=0;i<mp.getNumGeometries();i++){var p=mp.getGeometryN(i);this.visitInteriorRing(p.getExteriorRing(),graph);}}};jsts.operation.valid.ConnectedInteriorTester.prototype.visitInteriorRing=function(ring,graph){var pts=ring.getCoordinates();var pt0=pts[0];var pt1=jsts.operation.valid.ConnectedInteriorTester.findDifferentPoint(pts,pt0);var e=graph.findEdgeInSameDirection(pt0,pt1);var de=graph.findEdgeEnd(e);var intDe=null;if(de.getLabel().getLocation(0,jsts.geomgraph.Position.RIGHT)==jsts.geom.Location.INTERIOR){intDe=de;}else if(de.getSym().getLabel().getLocation(0,jsts.geomgraph.Position.RIGHT)==jsts.geom.Location.INTERIOR){intDe=de.getSym();}
this.visitLinkedDirectedEdges(intDe);};jsts.operation.valid.ConnectedInteriorTester.prototype.visitLinkedDirectedEdges=function(start){var startDe=start;var de=start;do{de.setVisited(true);de=de.getNext();}while(de!=startDe);};jsts.operation.valid.ConnectedInteriorTester.prototype.hasUnvisitedShellEdge=function(edgeRings){for(var i=0;i<edgeRings.size();i++){var er=edgeRings.get(i);if(er.isHole()){continue;}
var edges=er.getEdges();var de=edges[0];if(de.getLabel().getLocation(0,jsts.geomgraph.Position.RIGHT)!=jsts.geom.Location.INTERIOR){continue;}
for(var j=0;j<edges.length;j++){de=edges[j];if(!de.isVisited()){disconnectedRingcoord=de.getCoordinate();return true;}}}
return false;};jsts.index.chain.MonotoneChainSelectAction=function(){this.tempEnv1=new jsts.geom.Envelope();this.selectedSegment=new jsts.geom.LineSegment();};jsts.index.chain.MonotoneChainSelectAction.prototype.tempEnv1=null;jsts.index.chain.MonotoneChainSelectAction.prototype.selectedSegment=null;jsts.index.chain.MonotoneChainSelectAction.prototype.select=function(mc,start){mc.getLineSegment(start,this.selectedSegment);this.select2(this.selectedSegment);};jsts.index.chain.MonotoneChainSelectAction.prototype.select2=function(seg){};jsts.algorithm.MCPointInRing=function(ring){this.ring=ring;this.tree=null;this.crossings=0;this.interval=new jsts.index.bintree.Interval();this.buildIndex();};jsts.algorithm.MCPointInRing.MCSelecter=function(p,parent){this.parent=parent;this.p=p;};jsts.algorithm.MCPointInRing.MCSelecter.prototype=new jsts.index.chain.MonotoneChainSelectAction;jsts.algorithm.MCPointInRing.MCSelecter.prototype.constructor=jsts.algorithm.MCPointInRing.MCSelecter;jsts.algorithm.MCPointInRing.MCSelecter.prototype.select2=function(ls){this.parent.testLineSegment.apply(this.parent,[this.p,ls]);};jsts.algorithm.MCPointInRing.prototype.buildIndex=function(){this.tree=new jsts.index.bintree.Bintree();var pts=jsts.geom.CoordinateArrays.removeRepeatedPoints(this.ring.getCoordinates());var mcList=jsts.index.chain.MonotoneChainBuilder.getChains(pts);for(var i=0;i<mcList.length;i++){var mc=mcList[i];var mcEnv=mc.getEnvelope();this.interval.min=mcEnv.getMinY();this.interval.max=mcEnv.getMaxY();this.tree.insert(this.interval,mc);}};jsts.algorithm.MCPointInRing.prototype.isInside=function(pt){this.crossings=0;var rayEnv=new jsts.geom.Envelope(-Number.MAX_VALUE,Number.MAX_VALUE,pt.y,pt.y);this.interval.min=pt.y;this.interval.max=pt.y;var segs=this.tree.query(this.interval);var mcSelecter=new jsts.algorithm.MCPointInRing.MCSelecter(pt,this);for(var i=segs.iterator();i.hasNext();){var mc=i.next();this.testMonotoneChain(rayEnv,mcSelecter,mc);}
if((this.crossings%2)==1){return true;}
return false;};jsts.algorithm.MCPointInRing.prototype.testMonotoneChain=function(rayEnv,mcSelecter,mc){mc.select(rayEnv,mcSelecter);};jsts.algorithm.MCPointInRing.prototype.testLineSegment=function(p,seg){var xInt,x1,y1,x2,y2,p1,p2;p1=seg.p0;p2=seg.p1;x1=p1.x-p.x;y1=p1.y-p.y;x2=p2.x-p.x;y2=p2.y-p.y;if(((y1>0)&&(y2<=0))||((y2>0)&&(y1<=0))){xInt=jsts.algorithm.RobustDeterminant.signOfDet2x2(x1,y1,x2,y2)/(y2-y1);if(0.0<xInt){this.crossings++;}}};jsts.operation.valid.TopologyValidationError=function(errorType,pt){this.errorType=errorType;this.pt=null;if(pt!=null){this.pt=pt.clone();}};jsts.operation.valid.TopologyValidationError.HOLE_OUTSIDE_SHELL=2;jsts.operation.valid.TopologyValidationError.NESTED_HOLES=3;jsts.operation.valid.TopologyValidationError.DISCONNECTED_INTERIOR=4;jsts.operation.valid.TopologyValidationError.SELF_INTERSECTION=5;jsts.operation.valid.TopologyValidationError.RING_SELF_INTERSECTION=6;jsts.operation.valid.TopologyValidationError.NESTED_SHELLS=7;jsts.operation.valid.TopologyValidationError.DUPLICATE_RINGS=8;jsts.operation.valid.TopologyValidationError.TOO_FEW_POINTS=9;jsts.operation.valid.TopologyValidationError.INVALID_COORDINATE=10;jsts.operation.valid.TopologyValidationError.RING_NOT_CLOSED=11;jsts.operation.valid.TopologyValidationError.prototype.errMsg=['Topology Validation Error','Repeated Point','Hole lies outside shell','Holes are nested','Interior is disconnected','Self-intersection','Ring Self-intersection','Nested shells','Duplicate Rings','Too few distinct points in geometry component','Invalid Coordinate','Ring is not closed'];jsts.operation.valid.TopologyValidationError.prototype.getCoordinate=function(){return this.pt;};jsts.operation.valid.TopologyValidationError.prototype.getErrorType=function(){return this.errorType;};jsts.operation.valid.TopologyValidationError.prototype.getMessage=function(){return this.errMsg[this.errorType];};jsts.operation.valid.TopologyValidationError.prototype.toString=function(){var locStr='';if(this.pt!=null){locStr=' at or near point '+this.pt;return this.getMessage()+locStr;}
return locStr;};(function(){var Geometry=jsts.geom.Geometry;var TreeSet=javascript.util.TreeSet;var Arrays=javascript.util.Arrays;jsts.geom.GeometryCollection=function(geometries,factory){this.geometries=geometries||[];this.factory=factory;};jsts.geom.GeometryCollection.prototype=new Geometry();jsts.geom.GeometryCollection.constructor=jsts.geom.GeometryCollection;jsts.geom.GeometryCollection.prototype.isEmpty=function(){for(var i=0,len=this.geometries.length;i<len;i++){var geometry=this.getGeometryN(i);if(!geometry.isEmpty()){return false;}}
return true;};jsts.geom.Geometry.prototype.getArea=function(){var area=0.0;for(var i=0,len=this.geometries.length;i<len;i++){area+=this.getGeometryN(i).getArea();}
return area;};jsts.geom.Geometry.prototype.getLength=function(){var length=0.0;for(var i=0,len=this.geometries.length;i<len;i++){length+=this.getGeometryN(i).getLength();}
return length;};jsts.geom.GeometryCollection.prototype.getCoordinate=function(){if(this.isEmpty())
return null;return this.getGeometryN(0).getCoordinate();};jsts.geom.GeometryCollection.prototype.getCoordinates=function(){var coordinates=[];var k=-1;for(var i=0,len=this.geometries.length;i<len;i++){var geometry=this.getGeometryN(i);var childCoordinates=geometry.getCoordinates();for(var j=0;j<childCoordinates.length;j++){k++;coordinates[k]=childCoordinates[j];}}
return coordinates;};jsts.geom.GeometryCollection.prototype.getNumGeometries=function(){return this.geometries.length;};jsts.geom.GeometryCollection.prototype.getGeometryN=function(n){var geometry=this.geometries[n];if(geometry instanceof jsts.geom.Coordinate){geometry=new jsts.geom.Point(geometry);}
return geometry;};jsts.geom.GeometryCollection.prototype.equalsExact=function(other,tolerance){if(!this.isEquivalentClass(other)){return false;}
if(this.geometries.length!==other.geometries.length){return false;}
for(var i=0,len=this.geometries.length;i<len;i++){var geometry=this.getGeometryN(i);if(!geometry.equalsExact(other.getGeometryN(i),tolerance)){return false;}}
return true;};jsts.geom.GeometryCollection.prototype.clone=function(){var geometries=[];for(var i=0,len=this.geometries.length;i<len;i++){geometries.push(this.geometries[i].clone());}
return this.factory.createGeometryCollection(geometries);};jsts.geom.GeometryCollection.prototype.normalize=function(){for(var i=0,len=this.geometries.length;i<len;i++){this.getGeometryN(i).normalize();}
this.geometries.sort();};jsts.geom.GeometryCollection.prototype.compareToSameClass=function(o){var theseElements=new TreeSet(Arrays.asList(this.geometries));var otherElements=new TreeSet(Arrays.asList(o.geometries));return this.compare(theseElements,otherElements);};jsts.geom.GeometryCollection.prototype.apply=function(filter){if(filter instanceof jsts.geom.GeometryFilter||filter instanceof jsts.geom.GeometryComponentFilter){filter.filter(this);for(var i=0,len=this.geometries.length;i<len;i++){this.getGeometryN(i).apply(filter);}}else if(filter instanceof jsts.geom.CoordinateFilter){for(var i=0,len=this.geometries.length;i<len;i++){this.getGeometryN(i).apply(filter);}}else if(filter instanceof jsts.geom.CoordinateSequenceFilter){this.apply2.apply(this,arguments);}};jsts.geom.GeometryCollection.prototype.apply2=function(filter){if(this.geometries.length==0)
return;for(var i=0;i<this.geometries.length;i++){this.geometries[i].apply(filter);if(filter.isDone()){break;}}
if(filter.isGeometryChanged()){}};jsts.geom.GeometryCollection.prototype.getDimension=function(){var dimension=jsts.geom.Dimension.FALSE;for(var i=0,len=this.geometries.length;i<len;i++){var geometry=this.getGeometryN(i);dimension=Math.max(dimension,geometry.getDimension());}
return dimension;};jsts.geom.GeometryCollection.prototype.computeEnvelopeInternal=function(){var envelope=new jsts.geom.Envelope();for(var i=0,len=this.geometries.length;i<len;i++){var geometry=this.getGeometryN(i);envelope.expandToInclude(geometry.getEnvelopeInternal());}
return envelope;};jsts.geom.GeometryCollection.prototype.CLASS_NAME='jsts.geom.GeometryCollection';})();(function(){jsts.geom.MultiPolygon=function(geometries,factory){this.geometries=geometries||[];this.factory=factory;};jsts.geom.MultiPolygon.prototype=new jsts.geom.GeometryCollection();jsts.geom.MultiPolygon.constructor=jsts.geom.MultiPolygon;jsts.geom.MultiPolygon.prototype.getBoundary=function(){if(this.isEmpty()){return this.getFactory().createMultiLineString(null);}
var allRings=[];for(var i=0;i<this.geometries.length;i++){var polygon=this.geometries[i];var rings=polygon.getBoundary();for(var j=0;j<rings.getNumGeometries();j++){allRings.push(rings.getGeometryN(j));}}
return this.getFactory().createMultiLineString(allRings);};jsts.geom.MultiPolygon.prototype.equalsExact=function(other,tolerance){if(!this.isEquivalentClass(other)){return false;}
return jsts.geom.GeometryCollection.prototype.equalsExact.call(this,other,tolerance);};jsts.geom.MultiPolygon.prototype.CLASS_NAME='jsts.geom.MultiPolygon';})();jsts.geom.CoordinateSequenceFilter=function(){};jsts.geom.CoordinateSequenceFilter.prototype.filter=jsts.abstractFunc;jsts.geom.CoordinateSequenceFilter.prototype.isDone=jsts.abstractFunc;jsts.geom.CoordinateSequenceFilter.prototype.isGeometryChanged=jsts.abstractFunc;jsts.noding.snapround.HotPixel=function(pt,scaleFactor,li){this.corner=[];this.originalPt=pt;this.pt=pt;this.scaleFactor=scaleFactor;this.li=li;if(this.scaleFactor!==1.0){this.pt=new jsts.geom.Coordinate(this.scale(pt.x),this.scale(pt.y));this.p0Scaled=new jsts.geom.Coordinate();this.p1Scaled=new jsts.geom.Coordinate();}
this.initCorners(this.pt);};jsts.noding.snapround.HotPixel.prototype.li=null;jsts.noding.snapround.HotPixel.prototype.pt=null;jsts.noding.snapround.HotPixel.prototype.originalPt=null;jsts.noding.snapround.HotPixel.prototype.ptScaled=null;jsts.noding.snapround.HotPixel.prototype.p0Scaled=null;jsts.noding.snapround.HotPixel.prototype.p1Scaled=null;jsts.noding.snapround.HotPixel.prototype.scaleFactor=undefined;jsts.noding.snapround.HotPixel.prototype.minx=undefined;jsts.noding.snapround.HotPixel.prototype.maxx=undefined;jsts.noding.snapround.HotPixel.prototype.miny=undefined;jsts.noding.snapround.HotPixel.prototype.maxy=undefined;jsts.noding.snapround.HotPixel.prototype.corner=null;jsts.noding.snapround.HotPixel.prototype.safeEnv=null;jsts.noding.snapround.HotPixel.prototype.getCoordinate=function(){return this.originalPt;};jsts.noding.snapround.HotPixel.SAFE_ENV_EXPANSION_FACTOR=0.75;jsts.noding.snapround.HotPixel.prototype.getSafeEnvelope=function(){if(this.safeEnv===null){var safeTolerance=jsts.noding.snapround.HotPixel.SAFE_ENV_EXPANSION_FACTOR/this.scaleFactor;this.safeEnv=new jsts.geom.Envelope(this.originalPt.x-safeTolerance,this.originalPt.x+safeTolerance,this.originalPt.y-safeTolerance,this.originalPt.y+safeTolerance);}
return this.safeEnv;};jsts.noding.snapround.HotPixel.prototype.initCorners=function(pt){var tolerance=0.5;this.minx=pt.x-tolerance;this.maxx=pt.x+tolerance;this.miny=pt.y-tolerance;this.maxy=pt.y+tolerance;this.corner[0]=new jsts.geom.Coordinate(this.maxx,this.maxy);this.corner[1]=new jsts.geom.Coordinate(this.minx,this.maxy);this.corner[2]=new jsts.geom.Coordinate(this.minx,this.miny);this.corner[3]=new jsts.geom.Coordinate(this.maxx,this.miny);};jsts.noding.snapround.HotPixel.prototype.scale=function(val){return Math.round(val*this.scaleFactor);};jsts.noding.snapround.HotPixel.prototype.intersects=function(p0,p1){if(this.scaleFactor===1.0)
return this.intersectsScaled(p0,p1);this.copyScaled(p0,this.p0Scaled);this.copyScaled(p1,this.p1Scaled);return this.intersectsScaled(this.p0Scaled,this.p1Scaled);};jsts.noding.snapround.HotPixel.prototype.copyScaled=function(p,pScaled){pScaled.x=this.scale(p.x);pScaled.y=this.scale(p.y);};jsts.noding.snapround.HotPixel.prototype.intersectsScaled=function(p0,p1){var segMinx=Math.min(p0.x,p1.x);var segMaxx=Math.max(p0.x,p1.x);var segMiny=Math.min(p0.y,p1.y);var segMaxy=Math.max(p0.y,p1.y);var isOutsidePixelEnv=this.maxx<segMinx||this.minx>segMaxx||this.maxy<segMiny||this.miny>segMaxy;if(isOutsidePixelEnv)
return false;var intersects=this.intersectsToleranceSquare(p0,p1);jsts.util.Assert.isTrue(!(isOutsidePixelEnv&&intersects),'Found bad envelope test');return intersects;};jsts.noding.snapround.HotPixel.prototype.intersectsToleranceSquare=function(p0,p1){var intersectsLeft=false;var intersectsBottom=false;this.li.computeIntersection(p0,p1,this.corner[0],this.corner[1]);if(this.li.isProper())
return true;this.li.computeIntersection(p0,p1,this.corner[1],this.corner[2]);if(this.li.isProper())
return true;if(this.li.hasIntersection())
intersectsLeft=true;this.li.computeIntersection(p0,p1,this.corner[2],this.corner[3]);if(this.li.isProper())
return true;if(this.li.hasIntersection())
intersectsBottom=true;this.li.computeIntersection(p0,p1,this.corner[3],this.corner[0]);if(this.li.isProper())
return true;if(intersectsLeft&&intersectsBottom)
return true;if(p0.equals(this.pt))
return true;if(p1.equals(this.pt))
return true;return false;};jsts.noding.snapround.HotPixel.prototype.intersectsPixelClosure=function(p0,p1){this.li.computeIntersection(p0,p1,this.corner[0],this.corner[1]);if(this.li.hasIntersection())
return true;this.li.computeIntersection(p0,p1,this.corner[1],this.corner[2]);if(this.li.hasIntersection())
return true;this.li.computeIntersection(p0,p1,this.corner[2],this.corner[3]);if(this.li.hasIntersection())
return true;this.li.computeIntersection(p0,p1,this.corner[3],this.corner[0]);if(this.li.hasIntersection())
return true;return false;};jsts.noding.snapround.HotPixel.prototype.addSnappedNode=function(segStr,segIndex){var p0=segStr.getCoordinate(segIndex);var p1=segStr.getCoordinate(segIndex+1);if(this.intersects(p0,p1)){segStr.addIntersection(this.getCoordinate(),segIndex);return true;}
return false;};jsts.operation.buffer.BufferInputLineSimplifier=function(inputLine){this.inputLine=inputLine;};jsts.operation.buffer.BufferInputLineSimplifier.simplify=function(inputLine,distanceTol){var simp=new jsts.operation.buffer.BufferInputLineSimplifier(inputLine);return simp.simplify(distanceTol);};jsts.operation.buffer.BufferInputLineSimplifier.INIT=0;jsts.operation.buffer.BufferInputLineSimplifier.DELETE=1;jsts.operation.buffer.BufferInputLineSimplifier.KEEP=1;jsts.operation.buffer.BufferInputLineSimplifier.prototype.inputLine=null;jsts.operation.buffer.BufferInputLineSimplifier.prototype.distanceTol=null;jsts.operation.buffer.BufferInputLineSimplifier.prototype.isDeleted=null;jsts.operation.buffer.BufferInputLineSimplifier.prototype.angleOrientation=jsts.algorithm.CGAlgorithms.COUNTERCLOCKWISE;jsts.operation.buffer.BufferInputLineSimplifier.prototype.simplify=function(distanceTol){this.distanceTol=Math.abs(distanceTol);if(distanceTol<0)
this.angleOrientation=jsts.algorithm.CGAlgorithms.CLOCKWISE;this.isDeleted=[];this.isDeleted.length=this.inputLine.length;var isChanged=false;do{isChanged=this.deleteShallowConcavities();}while(isChanged);return this.collapseLine();};jsts.operation.buffer.BufferInputLineSimplifier.prototype.deleteShallowConcavities=function(){var index=1;var maxIndex=this.inputLine.length-1;var midIndex=this.findNextNonDeletedIndex(index);var lastIndex=this.findNextNonDeletedIndex(midIndex);var isChanged=false;while(lastIndex<this.inputLine.length){var isMiddleVertexDeleted=false;if(this.isDeletable(index,midIndex,lastIndex,this.distanceTol)){this.isDeleted[midIndex]=jsts.operation.buffer.BufferInputLineSimplifier.DELETE;isMiddleVertexDeleted=true;isChanged=true;}
if(isMiddleVertexDeleted)
index=lastIndex;else
index=midIndex;midIndex=this.findNextNonDeletedIndex(index);lastIndex=this.findNextNonDeletedIndex(midIndex);}
return isChanged;};jsts.operation.buffer.BufferInputLineSimplifier.prototype.findNextNonDeletedIndex=function(index){var next=index+1;while(next<this.inputLine.length&&this.isDeleted[next]===jsts.operation.buffer.BufferInputLineSimplifier.DELETE)
next++;return next;};jsts.operation.buffer.BufferInputLineSimplifier.prototype.collapseLine=function(){var coordList=[];for(var i=0;i<this.inputLine.length;i++){if(this.isDeleted[i]!==jsts.operation.buffer.BufferInputLineSimplifier.DELETE)
coordList.push(this.inputLine[i]);}
return coordList;};jsts.operation.buffer.BufferInputLineSimplifier.prototype.isDeletable=function(i0,i1,i2,distanceTol){var p0=this.inputLine[i0];var p1=this.inputLine[i1];var p2=this.inputLine[i2];if(!this.isConcave(p0,p1,p2))
return false;if(!this.isShallow(p0,p1,p2,distanceTol))
return false;return this.isShallowSampled(p0,p1,i0,i2,distanceTol);};jsts.operation.buffer.BufferInputLineSimplifier.prototype.isShallowConcavity=function(p0,p1,p2,distanceTol){var orientation=jsts.algorithm.CGAlgorithms.computeOrientation(p0,p1,p2);var isAngleToSimplify=(orientation===this.angleOrientation);if(!isAngleToSimplify)
return false;var dist=jsts.algorithm.CGAlgorithms.distancePointLine(p1,p0,p2);return dist<distanceTol;};jsts.operation.buffer.BufferInputLineSimplifier.NUM_PTS_TO_CHECK=10;jsts.operation.buffer.BufferInputLineSimplifier.prototype.isShallowSampled=function(p0,p2,i0,i2,distanceTol){var inc=parseInt((i2-i0)/jsts.operation.buffer.BufferInputLineSimplifier.NUM_PTS_TO_CHECK);if(inc<=0)
inc=1;for(var i=i0;i<i2;i+=inc){if(!this.isShallow(p0,p2,this.inputLine[i],distanceTol))
return false;}
return true;};jsts.operation.buffer.BufferInputLineSimplifier.prototype.isShallow=function(p0,p1,p2,distanceTol){var dist=jsts.algorithm.CGAlgorithms.distancePointLine(p1,p0,p2);return dist<distanceTol;};jsts.operation.buffer.BufferInputLineSimplifier.prototype.isConcave=function(p0,p1,p2){var orientation=jsts.algorithm.CGAlgorithms.computeOrientation(p0,p1,p2);var isConcave=(orientation===this.angleOrientation);return isConcave;};jsts.geom.CoordinateList=function(coord,allowRepeated){javascript.util.ArrayList.apply(this,arguments);allowRepeated=(allowRepeated===undefined)?true:allowRepeated;if(coord!==undefined){this.add(coord,allowRepeated);}};jsts.geom.CoordinateList.prototype=new javascript.util.ArrayList();jsts.geom.CoordinateList.prototype.add=function(){if(arguments.length>1){return this.addCoordinates.apply(this,arguments);}else{return javascript.util.ArrayList.prototype.add.apply(this,arguments);}};jsts.geom.CoordinateList.prototype.addCoordinates=function(coord,allowRepeated,direction){if(coord instanceof jsts.geom.Coordinate){return this.addCoordinate.apply(this,arguments);}else if(typeof coord==='number'){return this.insertCoordinate.apply(this,arguments);}
direction=direction||true;if(direction){for(var i=0;i<coord.length;i++){this.addCoordinate(coord[i],allowRepeated);}}else{for(var i=coord.length-1;i>=0;i--){this.addCoordinate(coord[i],allowRepeated);}}
return true;};jsts.geom.CoordinateList.prototype.addCoordinate=function(coord,allowRepeated){if(!allowRepeated){if(this.size()>=1){var last=this.get(this.size()-1);if(last.equals2D(coord))return;}}
this.add(coord);};jsts.geom.CoordinateList.prototype.insertCoordinate=function(index,coord,allowRepeated){if(!allowRepeated){var before=index>0?index-1:-1;if(before!==-1&&this.get(before).equals2D(coord)){return;}
var after=index<this.size()-1?index+1:-1;if(after!==-1&&this.get(after).equals2D(coord)){return;}}
this.array.splice(index,0,coord);};jsts.geom.CoordinateList.prototype.closeRing=function(){if(this.size()>0){this.addCoordinate(new jsts.geom.Coordinate(this.get(0)),false);}};jsts.geom.CoordinateList.prototype.toArray=function(){var i,il,arr;i=0,il=this.size(),arr=[];for(i;i<il;i++){arr[i]=this.get(i);}
return arr;};jsts.geom.CoordinateList.prototype.toCoordinateArray=function(){return this.toArray();};jsts.operation.overlay.MaximalEdgeRing=function(start,geometryFactory){jsts.geomgraph.EdgeRing.call(this,start,geometryFactory);};jsts.operation.overlay.MaximalEdgeRing.prototype=new jsts.geomgraph.EdgeRing();jsts.operation.overlay.MaximalEdgeRing.constructor=jsts.operation.overlay.MaximalEdgeRing;jsts.operation.overlay.MaximalEdgeRing.prototype.getNext=function(de)
{return de.getNext();};jsts.operation.overlay.MaximalEdgeRing.prototype.setEdgeRing=function(de,er)
{de.setEdgeRing(er);};jsts.operation.overlay.MaximalEdgeRing.prototype.linkDirectedEdgesForMinimalEdgeRings=function()
{var de=this.startDe;do{var node=de.getNode();node.getEdges().linkMinimalDirectedEdges(this);de=de.getNext();}while(de!=this.startDe);};jsts.operation.overlay.MaximalEdgeRing.prototype.buildMinimalRings=function()
{var minEdgeRings=[];var de=this.startDe;do{if(de.getMinEdgeRing()===null){var minEr=new jsts.operation.overlay.MinimalEdgeRing(de,this.geometryFactory);minEdgeRings.push(minEr);}
de=de.getNext();}while(de!=this.startDe);return minEdgeRings;};jsts.algorithm.CentroidPoint=function(){this.centSum=new jsts.geom.Coordinate();};jsts.algorithm.CentroidPoint.prototype.ptCount=0;jsts.algorithm.CentroidPoint.prototype.centSum=null;jsts.algorithm.CentroidPoint.prototype.add=function(geom){if(geom instanceof jsts.geom.Point){this.add2(geom.getCoordinate());}else if(geom instanceof jsts.geom.GeometryCollection||geom instanceof jsts.geom.MultiPoint||geom instanceof jsts.geom.MultiLineString||geom instanceof jsts.geom.MultiPolygon){var gc=geom;for(var i=0;i<gc.getNumGeometries();i++){this.add(gc.getGeometryN(i));}}};jsts.algorithm.CentroidPoint.prototype.add2=function(pt){this.ptCount+=1;this.centSum.x+=pt.x;this.centSum.y+=pt.y;};jsts.algorithm.CentroidPoint.prototype.getCentroid=function(){var cent=new jsts.geom.Coordinate();cent.x=this.centSum.x/this.ptCount;cent.y=this.centSum.y/this.ptCount;return cent;};jsts.operation.distance.ConnectedElementLocationFilter=function(locations){this.locations=locations;};jsts.operation.distance.ConnectedElementLocationFilter.prototype=new jsts.geom.GeometryFilter();jsts.operation.distance.ConnectedElementLocationFilter.prototype.locations=null;jsts.operation.distance.ConnectedElementLocationFilter.getLocations=function(geom){var locations=[];geom.apply(new jsts.operation.distance.ConnectedElementLocationFilter(locations));return locations;};jsts.operation.distance.ConnectedElementLocationFilter.prototype.filter=function(geom){if(geom instanceof jsts.geom.Point||geom instanceof jsts.geom.LineString||geom instanceof jsts.geom.Polygon)
this.locations.push(new jsts.operation.distance.GeometryLocation(geom,0,geom.getCoordinate()));};(function(){var ArrayList=javascript.util.ArrayList;jsts.operation.relate.EdgeEndBuilder=function(){};jsts.operation.relate.EdgeEndBuilder.prototype.computeEdgeEnds=function(edges){if(arguments.length==2){this.computeEdgeEnds2.apply(this,arguments);return;}
var l=new ArrayList();for(var i=edges;i.hasNext();){var e=i.next();this.computeEdgeEnds2(e,l);}
return l;};jsts.operation.relate.EdgeEndBuilder.prototype.computeEdgeEnds2=function(edge,l){var eiList=edge.getEdgeIntersectionList();eiList.addEndpoints();var it=eiList.iterator();var eiPrev=null;var eiCurr=null;if(!it.hasNext())
return;var eiNext=it.next();do{eiPrev=eiCurr;eiCurr=eiNext;eiNext=null;if(it.hasNext())
eiNext=it.next();if(eiCurr!==null){this.createEdgeEndForPrev(edge,l,eiCurr,eiPrev);this.createEdgeEndForNext(edge,l,eiCurr,eiNext);}}while(eiCurr!==null);};jsts.operation.relate.EdgeEndBuilder.prototype.createEdgeEndForPrev=function(edge,l,eiCurr,eiPrev){var iPrev=eiCurr.segmentIndex;if(eiCurr.dist===0.0){if(iPrev===0)
return;iPrev--;}
var pPrev=edge.getCoordinate(iPrev);if(eiPrev!==null&&eiPrev.segmentIndex>=iPrev)
pPrev=eiPrev.coord;var label=new jsts.geomgraph.Label(edge.getLabel());label.flip();var e=new jsts.geomgraph.EdgeEnd(edge,eiCurr.coord,pPrev,label);l.add(e);};jsts.operation.relate.EdgeEndBuilder.prototype.createEdgeEndForNext=function(edge,l,eiCurr,eiNext){var iNext=eiCurr.segmentIndex+1;if(iNext>=edge.getNumPoints()&&eiNext===null)
return;var pNext=edge.getCoordinate(iNext);if(eiNext!==null&&eiNext.segmentIndex===eiCurr.segmentIndex)
pNext=eiNext.coord;var e=new jsts.geomgraph.EdgeEnd(edge,eiCurr.coord,pNext,new jsts.geomgraph.Label(edge.getLabel()));l.add(e);};})();(function(){jsts.io.GeoJSONParser=function(geometryFactory){this.geometryFactory=geometryFactory||new jsts.geom.GeometryFactory();this.geometryTypes=['Point','MultiPoint','LineString','MultiLineString','Polygon','MultiPolygon'];};jsts.io.GeoJSONParser.prototype.read=function(json){var obj;if(typeof json==='string'){obj=JSON.parse(json);}else{obj=json;}
var type=obj.type;if(!this.parse[type]){throw new Error('Unknown GeoJSON type: '+obj.type);}
if(this.geometryTypes.indexOf(type)!=-1){return this.parse[type].apply(this,[obj.coordinates]);}else if(type==='GeometryCollection'){return this.parse[type].apply(this,[obj.geometries]);}
return this.parse[type].apply(this,[obj]);};jsts.io.GeoJSONParser.prototype.parse={'Feature':function(obj){var feature={};for(var key in obj){feature[key]=obj[key];}
if(obj.geometry){var type=obj.geometry.type;if(!this.parse[type]){throw new Error('Unknown GeoJSON type: '+obj.type);}
feature.geometry=this.read(obj.geometry);}
if(obj.bbox){feature.bbox=this.parse.bbox.apply(this,[obj.bbox]);}
return feature;},'FeatureCollection':function(obj){var featureCollection={};if(obj.features){featureCollection.features=[];for(var i=0;i<obj.features.length;++i){featureCollection.features.push(this.read(obj.features[i]));}}
if(obj.bbox){featureCollection.bbox=this.parse.bbox.apply(this,[obj.bbox]);}
return featureCollection;},'coordinates':function(array){var coordinates=[];for(var i=0;i<array.length;++i){var sub=array[i];coordinates.push(new jsts.geom.Coordinate(sub[0],sub[1]));}
return coordinates;},'bbox':function(array){return this.geometryFactory.createLinearRing([new jsts.geom.Coordinate(array[0],array[1]),new jsts.geom.Coordinate(array[2],array[1]),new jsts.geom.Coordinate(array[2],array[3]),new jsts.geom.Coordinate(array[0],array[3]),new jsts.geom.Coordinate(array[0],array[1])]);},'Point':function(array){var coordinate=new jsts.geom.Coordinate(array[0],array[1]);return this.geometryFactory.createPoint(coordinate);},'MultiPoint':function(array){var points=[];for(var i=0;i<array.length;++i){points.push(this.parse.Point.apply(this,[array[i]]));}
return this.geometryFactory.createMultiPoint(points);},'LineString':function(array){var coordinates=this.parse.coordinates.apply(this,[array]);return this.geometryFactory.createLineString(coordinates);},'MultiLineString':function(array){var lineStrings=[];for(var i=0;i<array.length;++i){lineStrings.push(this.parse.LineString.apply(this,[array[i]]));}
return this.geometryFactory.createMultiLineString(lineStrings);},'Polygon':function(array){var shellCoordinates=this.parse.coordinates.apply(this,[array[0]]);var shell=this.geometryFactory.createLinearRing(shellCoordinates);var holes=[];for(var i=1;i<array.length;++i){var hole=array[i];var coordinates=this.parse.coordinates.apply(this,[hole]);var linearRing=this.geometryFactory.createLinearRing(coordinates);holes.push(linearRing);}
return this.geometryFactory.createPolygon(shell,holes);},'MultiPolygon':function(array){var polygons=[];for(var i=0;i<array.length;++i){var polygon=array[i];polygons.push(this.parse.Polygon.apply(this,[polygon]));}
return this.geometryFactory.createMultiPolygon(polygons);},'GeometryCollection':function(array){var geometries=[];for(var i=0;i<array.length;++i){var geometry=array[i];geometries.push(this.read(geometry));}
return this.geometryFactory.createGeometryCollection(geometries);}};jsts.io.GeoJSONParser.prototype.write=function(geometry){var type=geometry.CLASS_NAME.slice(10);if(!this.extract[type]){throw new Error('Geometry is not supported');}
return this.extract[type].apply(this,[geometry]);};jsts.io.GeoJSONParser.prototype.extract={'coordinate':function(coordinate){return[coordinate.x,coordinate.y];},'Point':function(point){var array=this.extract.coordinate.apply(this,[point.coordinate]);return{type:'Point',coordinates:array};},'MultiPoint':function(multipoint){var array=[];for(var i=0;i<multipoint.geometries.length;++i){var point=multipoint.geometries[i];var geoJson=this.extract.Point.apply(this,[point]);array.push(geoJson.coordinates);}
return{type:'MultiPoint',coordinates:array};},'LineString':function(linestring){var array=[];for(var i=0;i<linestring.points.length;++i){var coordinate=linestring.points[i];array.push(this.extract.coordinate.apply(this,[coordinate]));}
return{type:'LineString',coordinates:array};},'MultiLineString':function(multilinestring){var array=[];for(var i=0;i<multilinestring.geometries.length;++i){var linestring=multilinestring.geometries[i];var geoJson=this.extract.LineString.apply(this,[linestring]);array.push(geoJson.coordinates);}
return{type:'MultiLineString',coordinates:array};},'Polygon':function(polygon){var array=[];var shellGeoJson=this.extract.LineString.apply(this,[polygon.shell]);array.push(shellGeoJson.coordinates);for(var i=0;i<polygon.holes.length;++i){var hole=polygon.holes[i];var holeGeoJson=this.extract.LineString.apply(this,[hole]);array.push(holeGeoJson.coordinates);}
return{type:'Polygon',coordinates:array};},'MultiPolygon':function(multipolygon){var array=[];for(var i=0;i<multipolygon.geometries.length;++i){var polygon=multipolygon.geometries[i];var geoJson=this.extract.Polygon.apply(this,[polygon]);array.push(geoJson.coordinates);}
return{type:'MultiPolygon',coordinates:array};},'GeometryCollection':function(collection){var array=[];for(var i=0;i<collection.geometries.length;++i){var geometry=collection.geometries[i];var type=geometry.CLASS_NAME.slice(10);array.push(this.extract[type].apply(this,[geometry]));}
return{type:'GeometryCollection',geometries:array};}};})();jsts.geomgraph.Edge=function(pts,label){this.pts=pts;this.label=label;this.eiList=new jsts.geomgraph.EdgeIntersectionList(this);this.depth=new jsts.geomgraph.Depth();};jsts.geomgraph.Edge.prototype=new jsts.geomgraph.GraphComponent();jsts.geomgraph.Edge.constructor=jsts.geomgraph.Edge;jsts.geomgraph.Edge.updateIM=function(label,im){im.setAtLeastIfValid(label.getLocation(0,jsts.geomgraph.Position.ON),label.getLocation(1,jsts.geomgraph.Position.ON),1);if(label.isArea()){im.setAtLeastIfValid(label.getLocation(0,jsts.geomgraph.Position.LEFT),label.getLocation(1,jsts.geomgraph.Position.LEFT),2);im.setAtLeastIfValid(label.getLocation(0,jsts.geomgraph.Position.RIGHT),label.getLocation(1,jsts.geomgraph.Position.RIGHT),2);}};jsts.geomgraph.Edge.prototype.pts=null;jsts.geomgraph.Edge.prototype.env=null;jsts.geomgraph.Edge.prototype.name=null;jsts.geomgraph.Edge.prototype.mce=null;jsts.geomgraph.Edge.prototype._isIsolated=true;jsts.geomgraph.Edge.prototype.depth=null;jsts.geomgraph.Edge.prototype.depthDelta=0;jsts.geomgraph.Edge.prototype.eiList=null;jsts.geomgraph.Edge.prototype.getNumPoints=function(){return this.pts.length;};jsts.geomgraph.Edge.prototype.getEnvelope=function(){if(this.env===null){this.env=new jsts.geom.Envelope();for(var i=0;i<this.pts.length;i++){this.env.expandToInclude(pts[i]);}}
return env;};jsts.geomgraph.Edge.prototype.getDepth=function(){return this.depth;};jsts.geomgraph.Edge.prototype.getDepthDelta=function(){return this.depthDelta;};jsts.geomgraph.Edge.prototype.setDepthDelta=function(depthDelta){this.depthDelta=depthDelta;};jsts.geomgraph.Edge.prototype.getCoordinates=function(){return this.pts;};jsts.geomgraph.Edge.prototype.getCoordinate=function(i){if(i===undefined){if(this.pts.length>0){return this.pts[0];}else{return null;}}
return this.pts[i];};jsts.geomgraph.Edge.prototype.isClosed=function(){return this.pts[0].equals(this.pts[this.pts.length-1]);};jsts.geomgraph.Edge.prototype.setIsolated=function(isIsolated){this._isIsolated=isIsolated;};jsts.geomgraph.Edge.prototype.isIsolated=function(){return this._isIsolated;};jsts.geomgraph.Edge.prototype.addIntersections=function(li,segmentIndex,geomIndex){for(var i=0;i<li.getIntersectionNum();i++){this.addIntersection(li,segmentIndex,geomIndex,i);}};jsts.geomgraph.Edge.prototype.addIntersection=function(li,segmentIndex,geomIndex,intIndex){var intPt=new jsts.geom.Coordinate(li.getIntersection(intIndex));var normalizedSegmentIndex=segmentIndex;var dist=li.getEdgeDistance(geomIndex,intIndex);var nextSegIndex=normalizedSegmentIndex+1;if(nextSegIndex<this.pts.length){var nextPt=this.pts[nextSegIndex];if(intPt.equals2D(nextPt)){normalizedSegmentIndex=nextSegIndex;dist=0.0;}}
var ei=this.eiList.add(intPt,normalizedSegmentIndex,dist);};jsts.geomgraph.Edge.prototype.getMaximumSegmentIndex=function(){return this.pts.length-1;};jsts.geomgraph.Edge.prototype.getEdgeIntersectionList=function(){return this.eiList;};jsts.geomgraph.Edge.prototype.isClosed=function()
{return this.pts[0].equals(this.pts[this.pts.length-1]);};jsts.geomgraph.Edge.prototype.isCollapsed=function()
{if(!this.label.isArea())return false;if(this.pts.length!=3)return false;if(this.pts[0].equals(this.pts[2]))return true;return false;};jsts.geomgraph.Edge.prototype.getCollapsedEdge=function()
{var newPts=[];newPts[0]=this.pts[0];newPts[1]=this.pts[1];var newe=new jsts.geomgraph.Edge(newPts,jsts.geomgraph.Label.toLineLabel(this.label));return newe;};jsts.geomgraph.Edge.prototype.computeIM=function(im){jsts.geomgraph.Edge.updateIM(this.label,im);};jsts.geomgraph.Edge.prototype.isPointwiseEqual=function(e)
{if(this.pts.length!=e.pts.length)return false;for(var i=0;i<this.pts.length;i++){if(!this.pts[i].equals2D(e.pts[i])){return false;}}
return true;};jsts.operation.valid.IsValidOp=function(parentGeometry){this.parentGeometry=parentGeometry;this.isSelfTouchingRingFormingHoleValid=false;this.validErr=null;};jsts.operation.valid.IsValidOp.isValid=function(arg){if(arguments[0]instanceof jsts.geom.Coordinate){if(isNaN(arg.x)){return false;}
if(!isFinite(arg.x)&&!isNaN(arg.x)){return false;}
if(isNaN(arg.y)){return false;}
if(!isFinite(arg.y)&&!isNaN(arg.y)){return false;}
return true;}else{var isValidOp=new jsts.operation.valid.IsValidOp(arg);return isValidOp.isValid();}};jsts.operation.valid.IsValidOp.findPtNotNode=function(testCoords,searchRing,graph){var searchEdge=graph.findEdge(searchRing);var eiList=searchEdge.getEdgeIntersectionList();for(var i=0;i<testCoords.length;i++){var pt=testCoords[i];if(!eiList.isIntersection(pt)){return pt;}}
return null;};jsts.operation.valid.IsValidOp.prototype.setSelfTouchingRingFormingHoleValid=function(isValid){this.isSelfTouchingRingFormingHoleValid=isValid;};jsts.operation.valid.IsValidOp.prototype.isValid=function(){this.checkValid(this.parentGeometry);return this.validErr==null;};jsts.operation.valid.IsValidOp.prototype.getValidationError=function(){this.checkValid(this.parentGeometry);return this.validErr;};jsts.operation.valid.IsValidOp.prototype.checkValid=function(g){this.validErr=null;if(g.isEmpty()){return;}
if(g instanceof jsts.geom.Point){this.checkValidPoint(g);}else if(g instanceof jsts.geom.MultiPoint){this.checkValidMultiPoint(g);}else if(g instanceof jsts.geom.LinearRing){this.checkValidLinearRing(g);}else if(g instanceof jsts.geom.LineString){this.checkValidLineString(g);}else if(g instanceof jsts.geom.Polygon){this.checkValidPolygon(g);}else if(g instanceof jsts.geom.MultiPolygon){this.checkValidMultiPolygon(g);}else if(g instanceof jsts.geom.GeometryCollection){this.checkValidGeometryCollection(g);}else{throw g.constructor;}};jsts.operation.valid.IsValidOp.prototype.checkValidPoint=function(g){this.checkInvalidCoordinates(g.getCoordinates());};jsts.operation.valid.IsValidOp.prototype.checkValidMultiPoint=function(g){this.checkInvalidCoordinates(g.getCoordinates());};jsts.operation.valid.IsValidOp.prototype.checkValidLineString=function(g){this.checkInvalidCoordinates(g.getCoordinates());if(this.validErr!=null){return;}
var graph=new jsts.geomgraph.GeometryGraph(0,g);this.checkTooFewPoints(graph);};jsts.operation.valid.IsValidOp.prototype.checkValidLinearRing=function(g){this.checkInvalidCoordinates(g.getCoordinates());if(this.validErr!=null){return;}
this.checkClosedRing(g);if(this.validErr!=null){return;}
var graph=new jsts.geomgraph.GeometryGraph(0,g);this.checkTooFewPoints(graph);if(this.validErr!=null){return;}
var li=new jsts.algorithm.RobustLineIntersector();graph.computeSelfNodes(li,true);this.checkNoSelfIntersectingRings(graph);};jsts.operation.valid.IsValidOp.prototype.checkValidPolygon=function(g){this.checkInvalidCoordinates(g);if(this.validErr!=null){return;}
this.checkClosedRings(g);if(this.validErr!=null){return;}
var graph=new jsts.geomgraph.GeometryGraph(0,g);this.checkTooFewPoints(graph);if(this.validErr!=null){return;}
this.checkConsistentArea(graph);if(this.validErr!=null){return;}
if(!this.isSelfTouchingRingFormingHoleValid){this.checkNoSelfIntersectingRings(graph);if(this.validErr!=null){return;}}
this.checkHolesInShell(g,graph);if(this.validErr!=null){return;}
this.checkHolesNotNested(g,graph);if(this.validErr!=null){return;}
this.checkConnectedInteriors(graph);};jsts.operation.valid.IsValidOp.prototype.checkValidMultiPolygon=function(g){var il=g.getNumGeometries();for(var i=0;i<il;i++){var p=g.getGeometryN(i);this.checkInvalidCoordinates(p);if(this.validErr!=null){return;}
this.checkClosedRings(p);if(this.validErr!=null){return;}}
var graph=new jsts.geomgraph.GeometryGraph(0,g);this.checkTooFewPoints(graph);if(this.validErr!=null){return;}
this.checkConsistentArea(graph);if(this.validErr!=null){return;}
if(!this.isSelfTouchingRingFormingHoleValid){this.checkNoSelfIntersectingRings(graph);if(this.validErr!=null){return;}}
for(var i=0;i<g.getNumGeometries();i++){var p=g.getGeometryN(i);this.checkHolesInShell(p,graph);if(this.validErr!=null){return;}}
for(var i=0;i<g.getNumGeometries();i++){var p=g.getGeometryN(i);this.checkHolesNotNested(p,graph);if(this.validErr!=null){return;}}
this.checkShellsNotNested(g,graph);if(this.validErr!=null){return;}
this.checkConnectedInteriors(graph);};jsts.operation.valid.IsValidOp.prototype.checkValidGeometryCollection=function(gc){for(var i=0;i<gc.getNumGeometries();i++){var g=gc.getGeometryN(i);this.checkValid(g);if(this.validErr!=null){return;}}};jsts.operation.valid.IsValidOp.prototype.checkInvalidCoordinates=function(arg){if(arg instanceof jsts.geom.Polygon){var poly=arg;this.checkInvalidCoordinates(poly.getExteriorRing().getCoordinates());if(this.validErr!=null){return;}
for(var i=0;i<poly.getNumInteriorRing();i++){this.checkInvalidCoordinates(poly.getInteriorRingN(i).getCoordinates());if(this.validErr!=null){return;}}}else{var coords=arg;for(var i=0;i<coords.length;i++){if(!jsts.operation.valid.IsValidOp.isValid(coords[i])){this.validErr=new jsts.operation.valid.TopologyValidationError(jsts.operation.valid.TopologyValidationError.INVALID_COORDINATE,coords[i]);return;}}}};jsts.operation.valid.IsValidOp.prototype.checkClosedRings=function(poly){this.checkClosedRing(poly.getExteriorRing());if(this.validErr!=null){return;}
for(var i=0;i<poly.getNumInteriorRing();i++){this.checkClosedRing(poly.getInteriorRingN(i));if(this.validErr!=null){return;}}};jsts.operation.valid.IsValidOp.prototype.checkClosedRing=function(ring){if(!ring.isClosed()){var pt=null;if(ring.getNumPoints()>=1){pt=ring.getCoordinateN(0);}
this.validErr=new jsts.operation.valid.TopologyValidationError(jsts.operation.valid.TopologyValidationError.RING_NOT_CLOSED,pt);}};jsts.operation.valid.IsValidOp.prototype.checkTooFewPoints=function(graph){if(graph.hasTooFewPoints){this.validErr=new jsts.operation.valid.TopologyValidationError(jsts.operation.valid.TopologyValidationError.TOO_FEW_POINTS,graph.getInvalidPoint());return;}};jsts.operation.valid.IsValidOp.prototype.checkConsistentArea=function(graph){var cat=new jsts.operation.valid.ConsistentAreaTester(graph);var isValidArea=cat.isNodeConsistentArea();if(!isValidArea){this.validErr=new jsts.operation.valid.TopologyValidationError(jsts.operation.valid.TopologyValidationError.SELF_INTERSECTION,cat.getInvalidPoint());return;}
if(cat.hasDuplicateRings()){this.validErr=new jsts.operation.valid.TopologyValidationError(jsts.operation.valid.TopologyValidationError.DUPLICATE_RINGS,cat.getInvalidPoint());}};jsts.operation.valid.IsValidOp.prototype.checkNoSelfIntersectingRings=function(graph){for(var i=graph.getEdgeIterator();i.hasNext();){var e=i.next();this.checkNoSelfIntersectingRing(e.getEdgeIntersectionList());if(this.validErr!=null){return;}}};jsts.operation.valid.IsValidOp.prototype.checkNoSelfIntersectingRing=function(eiList){var nodeSet=[];var isFirst=true;for(var i=eiList.iterator();i.hasNext();){var ei=i.next();if(isFirst){isFirst=false;continue;}
if(nodeSet.indexOf(ei.coord)>=0){this.validErr=new jsts.operation.valid.TopologyValidationError(jsts.operation.valid.TopologyValidationError.RING_SELF_INTERSECTION,ei.coord);return;}else{nodeSet.push(ei.coord);}}};jsts.operation.valid.IsValidOp.prototype.checkHolesInShell=function(p,graph){var shell=p.getExteriorRing();var pir=new jsts.algorithm.MCPointInRing(shell);for(var i=0;i<p.getNumInteriorRing();i++){var hole=p.getInteriorRingN(i);var holePt=jsts.operation.valid.IsValidOp.findPtNotNode(hole.getCoordinates(),shell,graph);if(holePt==null){return;}
var outside=!pir.isInside(holePt);if(outside){this.validErr=new jsts.operation.valid.TopologyValidationError(jsts.operation.valid.TopologyValidationError.HOLE_OUTSIDE_SHELL,holePt);return;}}};jsts.operation.valid.IsValidOp.prototype.checkHolesNotNested=function(p,graph){var nestedTester=new jsts.operation.valid.IndexedNestedRingTester(graph);for(var i=0;i<p.getNumInteriorRing();i++){var innerHole=p.getInteriorRingN(i);nestedTester.add(innerHole);}
var isNonNested=nestedTester.isNonNested();if(!isNonNested){this.validErr=new jsts.operation.valid.TopologyValidationError(jsts.operation.valid.TopologyValidationError.NESTED_HOLES,nestedTester.getNestedPoint());}};jsts.operation.valid.IsValidOp.prototype.checkShellsNotNested=function(mp,graph){for(var i=0;i<mp.getNumGeometries();i++){var p=mp.getGeometryN(i);var shell=p.getExteriorRing();for(var j=0;j<mp.getNumGeometries();j++){if(i==j){continue;}
var p2=mp.getGeometryN(j);this.checkShellNotNested(shell,p2,graph);if(this.validErr!=null){return;}}}};jsts.operation.valid.IsValidOp.prototype.checkShellNotNested=function(shell,p,graph){var shellPts=shell.getCoordinates();var polyShell=p.getExteriorRing();var polyPts=polyShell.getCoordinates();var shellPt=jsts.operation.valid.IsValidOp.findPtNotNode(shellPts,polyShell,graph);if(shellPt==null){return;}
var insidePolyShell=jsts.algorithm.CGAlgorithms.isPointInRing(shellPt,polyPts);if(!insidePolyShell){return;}
if(p.getNumInteriorRing()<=0){this.validErr=new jsts.operation.valid.TopologyValidationError(jsts.operation.valid.TopologyValidationError.NESTED_SHELLS,shellPt);return;}
var badNestedPt=null;for(var i=0;i<p.getNumInteriorRing();i++){var hole=p.getInteriorRingN(i);badNestedPt=this.checkShellInsideHole(shell,hole,graph);if(badNestedPt==null){return;}}
this.validErr=new jsts.operation.valid.TopologyValidationError(jsts.operation.valid.TopologyValidationError.NESTED_SHELLS,badNestedPt);};jsts.operation.valid.IsValidOp.prototype.checkShellInsideHole=function(shell,hole,graph){var shellPts=shell.getCoordinates();var holePts=hole.getCoordinates();var shellPt=jsts.operation.valid.IsValidOp.findPtNotNode(shellPts,hole,graph);if(shellPt!=null){var insideHole=jsts.algorithm.CGAlgorithms.isPointInRing(shellPt,holePts);if(!insideHole){return shellPt;}}
var holePt=jsts.operation.valid.IsValidOp.findPtNotNode(holePts,shell,graph);if(holePt!=null){var insideShell=jsts.algorithm.CGAlgorithms.isPointInRing(holePt,shellPts);if(insideShell){return holePt;}
return null;}
jsts.util.Assert.shouldNeverReachHere('points in shell and hole appear to be equal');return null;};jsts.operation.valid.IsValidOp.prototype.checkConnectedInteriors=function(graph){var cit=new jsts.operation.valid.ConnectedInteriorTester(graph);if(!cit.isInteriorsConnected()){this.validErr=new jsts.operation.valid.TopologyValidationError(jsts.operation.valid.TopologyValidationError.DISCONNECTED_INTERIOR,cit.getCoordinate());}};jsts.algorithm.RobustDeterminant=function(){};jsts.algorithm.RobustDeterminant.signOfDet2x2=function(x1,y1,x2,y2){var sign,swap,k,count;count=0;sign=1;if((x1===0.0)||(y2===0.0)){if((y1===0.0)||(x2===0.0)){return 0;}
else if(y1>0){if(x2>0){return-sign;}
else{return sign;}}
else{if(x2>0){return sign;}
else{return-sign;}}}
if((y1===0.0)||(x2===0.0)){if(y2>0){if(x1>0){return sign;}
else{return-sign;}}
else{if(x1>0){return-sign;}
else{return sign;}}}
if(0.0<y1){if(0.0<y2){if(y1>y2){sign=-sign;swap=x1;x1=x2;x2=swap;swap=y1;y1=y2;y2=swap;}}
else{if(y1<=-y2){sign=-sign;x2=-x2;y2=-y2;}
else{swap=x1;x1=-x2;x2=swap;swap=y1;y1=-y2;y2=swap;}}}
else{if(0.0<y2){if(-y1<=y2){sign=-sign;x1=-x1;y1=-y1;}
else{swap=-x1;x1=x2;x2=swap;swap=-y1;y1=y2;y2=swap;}}
else{if(y1>=y2){x1=-x1;y1=-y1;x2=-x2;y2=-y2;}
else{sign=-sign;swap=-x1;x1=-x2;x2=swap;swap=-y1;y1=-y2;y2=swap;}}}
if(0.0<x1){if(0.0<x2){if(x1>x2){return sign;}}
else{return sign;}}
else{if(0.0<x2){return-sign;}
else{if(x1>=x2){sign=-sign;x1=-x1;x2=-x2;}
else{return-sign;}}}
while(true){count=count+1;k=Math.floor(x2/x1);x2=x2-k*x1;y2=y2-k*y1;if(y2<0.0){return-sign;}
if(y2>y1){return sign;}
if(x1>x2+x2){if(y1<y2+y2){return sign;}}
else{if(y1>y2+y2){return-sign;}
else{x2=x1-x2;y2=y1-y2;sign=-sign;}}
if(y2===0.0){if(x2===0.0){return 0;}
else{return-sign;}}
if(x2===0.0){return sign;}
k=Math.floor(x1/x2);x1=x1-k*x2;y1=y1-k*y2;if(y1<0.0){return sign;}
if(y1>y2){return-sign;}
if(x2>x1+x1){if(y2<y1+y1){return-sign;}}
else{if(y2>y1+y1){return sign;}
else{x1=x2-x1;y1=y2-y1;sign=-sign;}}
if(y1===0.0){if(x1===0.0){return 0;}
else{return sign;}}
if(x1===0.0){return-sign;}}};jsts.algorithm.RobustDeterminant.orientationIndex=function(p1,p2,q){var dx1=p2.x-p1.x;var dy1=p2.y-p1.y;var dx2=q.x-p2.x;var dy2=q.y-p2.y;return jsts.algorithm.RobustDeterminant.signOfDet2x2(dx1,dy1,dx2,dy2);};jsts.index.quadtree.NodeBase=function(){this.subnode=new Array(4);this.subnode[0]=null;this.subnode[1]=null;this.subnode[2]=null;this.subnode[3]=null;this.items=[];};jsts.index.quadtree.NodeBase.prototype.getSubnodeIndex=function(env,centre){var subnodeIndex=-1;if(env.getMinX()>=centre.x){if(env.getMinY()>=centre.y){subnodeIndex=3;}
if(env.getMaxY()<=centre.y){subnodeIndex=1;}}
if(env.getMaxX()<=centre.x){if(env.getMinY()>=centre.y){subnodeIndex=2;}
if(env.getMaxY()<=centre.y){subnodeIndex=0;}}
return subnodeIndex;};jsts.index.quadtree.NodeBase.prototype.getItems=function(){return this.items;};jsts.index.quadtree.NodeBase.prototype.hasItems=function(){return(this.items.length>0);};jsts.index.quadtree.NodeBase.prototype.add=function(item){this.items.push(item);};jsts.index.quadtree.NodeBase.prototype.remove=function(itemEnv,item){if(!this.isSearchMatch(itemEnv)){return false;}
var found=false,i=0;for(i;i<4;i++){if(this.subnode[i]!==null){found=this.subnode[i].remove(itemEnv,item);if(found){if(this.subnode[i].isPrunable()){this.subnode[i]=null;}
break;}}}
if(found){return found;}
if(this.items.indexOf(item)!==-1){for(var i=this.items.length-1;i>=0;i--){if(this.items[i]===item){this.items.splice(i,1);}}
found=true;}
return found;};jsts.index.quadtree.NodeBase.prototype.isPrunable=function(){return!(this.hasChildren()||this.hasItems());};jsts.index.quadtree.NodeBase.prototype.hasChildren=function(){var i=0;for(i;i<4;i++){if(this.subnode[i]!==null){return true;}}
return false;};jsts.index.quadtree.NodeBase.prototype.isEmpty=function(){var isEmpty=true;if(this.items.length>0){isEmpty=false;}
var i=0;for(i;i<4;i++){if(this.subnode[i]!==null){if(!this.subnode[i].isEmpty()){isEmpty=false;}}}
return isEmpty;};jsts.index.quadtree.NodeBase.prototype.addAllItems=function(resultItems){resultItems=resultItems.concat(this.items);var i=0;for(i;i<4;i++){if(this.subnode[i]!==null){resultItems=this.subnode[i].addAllItems(resultItems);}}
return resultItems;};jsts.index.quadtree.NodeBase.prototype.addAllItemsFromOverlapping=function(searchEnv,resultItems){if(!this.isSearchMatch(searchEnv)){return;}
resultItems=resultItems.concat(this.items);var i=0;for(i;i<4;i++){if(this.subnode[i]!==null){resultItems=this.subnode[i].addAllItemsFromOverlapping(searchEnv,resultItems);}}};jsts.index.quadtree.NodeBase.prototype.visit=function(searchEnv,visitor){if(!this.isSearchMatch(searchEnv)){return;}
this.visitItems(searchEnv,visitor);var i=0;for(i;i<4;i++){if(this.subnode[i]!==null){this.subnode[i].visit(searchEnv,visitor);}}};jsts.index.quadtree.NodeBase.prototype.visitItems=function(env,visitor){var i=0,il=this.items.length;for(i;i<il;i++){visitor.visitItem(this.items[i]);}};jsts.index.quadtree.NodeBase.prototype.depth=function(){var maxSubDepth=0,i=0,sqd;for(i;i<4;i++){if(this.subnode[i]!==null){sqd=this.subnode[i].depth();if(sqd>maxSubDepth){maxSubDepth=sqd;}}}
return maxSubDepth+1;};jsts.index.quadtree.NodeBase.prototype.size=function(){var subSize=0,i=0;for(i;i<4;i++){if(this.subnode[i]!==null){subSize+=this.subnode[i].size();}}
return subSize+this.items.length;};jsts.index.quadtree.NodeBase.prototype.getNodeCount=function(){var subSize=0,i=0;for(i;i<4;i++){if(this.subnode[i]!==null){subSize+=this.subnode[i].size();}}
return subSize+1;};jsts.index.quadtree.Node=function(env,level){jsts.index.quadtree.NodeBase.prototype.constructor.apply(this,arguments);this.env=env;this.level=level;this.centre=new jsts.geom.Coordinate();this.centre.x=(env.getMinX()+env.getMaxX())/2;this.centre.y=(env.getMinY()+env.getMaxY())/2;};jsts.index.quadtree.Node.prototype=new jsts.index.quadtree.NodeBase();jsts.index.quadtree.Node.createNode=function(env){var key,node;key=new jsts.index.quadtree.Key(env);node=new jsts.index.quadtree.Node(key.getEnvelope(),key.getLevel());return node;};jsts.index.quadtree.Node.createExpanded=function(node,addEnv){var expandEnv=new jsts.geom.Envelope(addEnv),largerNode;if(node!==null){expandEnv.expandToInclude(node.env);}
largerNode=jsts.index.quadtree.Node.createNode(expandEnv);if(node!==null){largerNode.insertNode(node);}
return largerNode;};jsts.index.quadtree.Node.prototype.getEnvelope=function(){return this.env;};jsts.index.quadtree.Node.prototype.isSearchMatch=function(searchEnv){return this.env.intersects(searchEnv);};jsts.index.quadtree.Node.prototype.getNode=function(searchEnv){var subnodeIndex=this.getSubnodeIndex(searchEnv,this.centre),node;if(subnodeIndex!==-1){node=this.getSubnode(subnodeIndex);return node.getNode(searchEnv);}else{return this;}};jsts.index.quadtree.Node.prototype.find=function(searchEnv){var subnodeIndex=this.getSubnodeIndex(searchEnv,this.centre),node;if(subnodeIndex===-1){return this;}
if(this.subnode[subnodeIndex]!==null){node=this.subnode[subnodeIndex];return node.find(searchEnv);}
return this;};jsts.index.quadtree.Node.prototype.insertNode=function(node){var index=this.getSubnodeIndex(node.env,this.centre),childNode;if(node.level===this.level-1){this.subnode[index]=node;}else{childNode=this.createSubnode(index);childNode.insertNode(node);this.subnode[index]=childNode;}};jsts.index.quadtree.Node.prototype.getSubnode=function(index){if(this.subnode[index]===null){this.subnode[index]=this.createSubnode(index);}
return this.subnode[index];};jsts.index.quadtree.Node.prototype.createSubnode=function(index){var minx=0.0,maxx=0.0,miny=0.0,maxy=0.0,sqEnv,node;switch(index){case 0:minx=this.env.getMinX();maxx=this.centre.x;miny=this.env.getMinY();maxy=this.centre.y;break;case 1:minx=this.centre.x;maxx=this.env.getMaxX();miny=this.env.getMinY();maxy=this.centre.y;break;case 2:minx=this.env.getMinX();maxx=this.centre.x;miny=this.centre.y;maxy=this.env.getMaxY();break;case 3:minx=this.centre.x;maxx=this.env.getMaxX();miny=this.centre.y;maxy=this.env.getMaxY();break;}
sqEnv=new jsts.geom.Envelope(minx,maxx,miny,maxy);node=new jsts.index.quadtree.Node(sqEnv,this.level-1);return node;};(function(){jsts.triangulate.quadedge.QuadEdge=function(){this.rot=null;this.vertex=null;this.next=null;this.data=null;};var QuadEdge=jsts.triangulate.quadedge.QuadEdge;jsts.triangulate.quadedge.QuadEdge.makeEdge=function(o,d){var q0,q1,q2,q3,base;q0=new QuadEdge();q1=new QuadEdge();q2=new QuadEdge();q3=new QuadEdge();q0.rot=q1;q1.rot=q2;q2.rot=q3;q3.rot=q0;q0.setNext(q0);q1.setNext(q3);q2.setNext(q2);q3.setNext(q1);base=q0;base.setOrig(o);base.setDest(d);return base;};jsts.triangulate.quadedge.QuadEdge.connect=function(a,b){var e=QuadEdge.makeEdge(a.dest(),b.orig());QuadEdge.splice(e,a.lNext());QuadEdge.splice(e.sym(),b);return e;};jsts.triangulate.quadedge.QuadEdge.splice=function(a,b){var alpha,beta,t1,t2,t3,t4;alpha=a.oNext().rot;beta=b.oNext().rot;t1=b.oNext();t2=a.oNext();t3=beta.oNext();t4=alpha.oNext();a.setNext(t1);b.setNext(t2);alpha.setNext(t3);beta.setNext(t4);};jsts.triangulate.quadedge.QuadEdge.swap=function(e){var a,b;a=e.oPrev();b=e.sym().oPrev();QuadEdge.splice(e,a);QuadEdge.splice(e.sym(),b);QuadEdge.splice(e,a.lNext());QuadEdge.splice(e.sym(),b.lNext());e.setOrig(a.dest());e.setDest(b.dest());};jsts.triangulate.quadedge.QuadEdge.prototype.getPrimary=function(){if(this.orig().getCoordinate().compareTo(this.dest().getCoordinate())<=0){return this;}
else{return this.sym();}};jsts.triangulate.quadedge.QuadEdge.prototype.setData=function(data){this.data=data;};jsts.triangulate.quadedge.QuadEdge.prototype.getData=function(){return this.data;};jsts.triangulate.quadedge.QuadEdge.prototype.delete_jsts=function(){this.rot=null;};jsts.triangulate.quadedge.QuadEdge.prototype.isLive=function(){return this.rot!==null;};jsts.triangulate.quadedge.QuadEdge.prototype.setNext=function(next){this.next=next;};jsts.triangulate.quadedge.QuadEdge.prototype.invRot=function(){return this.rot.sym();};jsts.triangulate.quadedge.QuadEdge.prototype.sym=function(){return this.rot.rot;};jsts.triangulate.quadedge.QuadEdge.prototype.oNext=function(){return this.next;};jsts.triangulate.quadedge.QuadEdge.prototype.oPrev=function(){return this.rot.next.rot;};jsts.triangulate.quadedge.QuadEdge.prototype.dNext=function(){return this.sym().oNext().sym();};jsts.triangulate.quadedge.QuadEdge.prototype.dPrev=function(){return this.invRot().oNext().invRot();};jsts.triangulate.quadedge.QuadEdge.prototype.lNext=function(){return this.invRot().oNext().rot;};jsts.triangulate.quadedge.QuadEdge.prototype.lPrev=function(){return this.next.sym();};jsts.triangulate.quadedge.QuadEdge.prototype.rNext=function(){return this.rot.next.invRot();};jsts.triangulate.quadedge.QuadEdge.prototype.rPrev=function(){return this.sym().oNext();};jsts.triangulate.quadedge.QuadEdge.prototype.setOrig=function(o){this.vertex=o;};jsts.triangulate.quadedge.QuadEdge.prototype.setDest=function(d){this.sym().setOrig(d);};jsts.triangulate.quadedge.QuadEdge.prototype.orig=function(){return this.vertex;};jsts.triangulate.quadedge.QuadEdge.prototype.dest=function(){return this.sym().orig();};jsts.triangulate.quadedge.QuadEdge.prototype.getLength=function(){return this.orig().getCoordinate().distance(dest().getCoordinate());};jsts.triangulate.quadedge.QuadEdge.prototype.equalsNonOriented=function(qe){if(this.equalsOriented(qe)){return true;}
if(this.equalsOriented(qe.sym())){return true;}
return false;};jsts.triangulate.quadedge.QuadEdge.prototype.equalsOriented=function(qe){if(this.orig().getCoordinate().equals2D(qe.orig().getCoordinate())&&this.dest().getCoordinate().equals2D(qe.dest().getCoordinate())){return true;}
return false;};jsts.triangulate.quadedge.QuadEdge.prototype.toLineSegment=function()
{return new jsts.geom.LineSegment(this.vertex.getCoordinate(),this.dest().getCoordinate());};jsts.triangulate.quadedge.QuadEdge.prototype.toString=function(){var p0,p1;p0=this.vertex.getCoordinate();p1=this.dest().getCoordinate();return jsts.io.WKTWriter.toLineString(p0,p1);};})();(function(){var Assert=jsts.util.Assert;jsts.geomgraph.EdgeEnd=function(edge,p0,p1,label){this.edge=edge;if(p0&&p1){this.init(p0,p1);}
if(label){this.label=label||null;}};jsts.geomgraph.EdgeEnd.prototype.edge=null;jsts.geomgraph.EdgeEnd.prototype.label=null;jsts.geomgraph.EdgeEnd.prototype.node=null;jsts.geomgraph.EdgeEnd.prototype.p0=null;jsts.geomgraph.EdgeEnd.prototype.p1=null;jsts.geomgraph.EdgeEnd.prototype.dx=null;jsts.geomgraph.EdgeEnd.prototype.dy=null;jsts.geomgraph.EdgeEnd.prototype.quadrant=null;jsts.geomgraph.EdgeEnd.prototype.init=function(p0,p1){this.p0=p0;this.p1=p1;this.dx=p1.x-p0.x;this.dy=p1.y-p0.y;this.quadrant=jsts.geomgraph.Quadrant.quadrant(this.dx,this.dy);Assert.isTrue(!(this.dx===0&&this.dy===0),'EdgeEnd with identical endpoints found');};jsts.geomgraph.EdgeEnd.prototype.getEdge=function(){return this.edge;};jsts.geomgraph.EdgeEnd.prototype.getLabel=function(){return this.label;};jsts.geomgraph.EdgeEnd.prototype.getCoordinate=function(){return this.p0;};jsts.geomgraph.EdgeEnd.prototype.getDirectedCoordinate=function(){return this.p1;};jsts.geomgraph.EdgeEnd.prototype.getQuadrant=function(){return this.quadrant;};jsts.geomgraph.EdgeEnd.prototype.getDx=function(){return this.dx;};jsts.geomgraph.EdgeEnd.prototype.getDy=function(){return this.dy;};jsts.geomgraph.EdgeEnd.prototype.setNode=function(node){this.node=node;};jsts.geomgraph.EdgeEnd.prototype.getNode=function(){return this.node;};jsts.geomgraph.EdgeEnd.prototype.compareTo=function(e){return this.compareDirection(e);};jsts.geomgraph.EdgeEnd.prototype.compareDirection=function(e){if(this.dx===e.dx&&this.dy===e.dy)
return 0;if(this.quadrant>e.quadrant)
return 1;if(this.quadrant<e.quadrant)
return-1;return jsts.algorithm.CGAlgorithms.computeOrientation(e.p0,e.p1,this.p1);};jsts.geomgraph.EdgeEnd.prototype.computeLabel=function(boundaryNodeRule){};})();jsts.triangulate.quadedge.TrianglePredicate=function(){};jsts.triangulate.quadedge.TrianglePredicate.isInCircleNonRobust=function(a,b,c,p){var isInCircle=(a.x*a.x+a.y*a.y)*jsts.triangulate.quadedge.TrianglePredicate.triArea(b,c,p)-
(b.x*b.x+b.y*b.y)*jsts.triangulate.quadedge.TrianglePredicate.triArea(a,c,p)+
(c.x*c.x+c.y*c.y)*jsts.triangulate.quadedge.TrianglePredicate.triArea(a,b,p)-
(p.x*p.x+p.y*p.y)*jsts.triangulate.quadedge.TrianglePredicate.triArea(a,b,c)>0;return isInCircle;};jsts.triangulate.quadedge.TrianglePredicate.isInCircleNormalized=function(a,b,c,p){var adx,ady,bdx,bdy,cdx,cdy,abdet,bcdet,cadet,alift,blift,clift,disc;adx=a.x-p.x;ady=a.y-p.y;bdx=b.x-p.x;bdy=b.y-p.y;cdx=c.x-p.x;cdy=c.y-p.y;abdet=adx*bdy-bdx*ady;bcdet=bdx*cdy-cdx*bdy;cadet=cdx*ady-adx*cdy;alift=adx*adx+ady*ady;blift=bdx*bdx+bdy*bdy;clift=cdx*cdx+cdy*cdy;disc=alift*bcdet+blift*cadet+clift*abdet;return disc>0;};jsts.triangulate.quadedge.TrianglePredicate.triArea=function(a,b,c){return(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);};jsts.triangulate.quadedge.TrianglePredicate.isInCircleRobust=function(a,b,c,p){return jsts.triangulate.quadedge.TrianglePredicate.isInCircleNormalized(a,b,c,p);};jsts.triangulate.quadedge.TrianglePredicate.isInCircleDDSlow=function(a,b,c,p){var px,py,ax,ay,bx,by,cx,cy,aTerm,bTerm,cTerm,pTerm,sum,isInCircle;px=jsts.math.DD.valueOf(p.x);py=jsts.math.DD.valueOf(p.y);ax=jsts.math.DD.valueOf(a.x);ay=jsts.math.DD.valueOf(a.y);bx=jsts.math.DD.valueOf(b.x);by=jsts.math.DD.valueOf(b.y);cx=jsts.math.DD.valueOf(c.x);cy=jsts.math.DD.valueOf(c.y);aTerm=(ax.multiply(ax).add(ay.multiply(ay))).multiply(jsts.triangulate.quadedge.TrianglePredicate.triAreaDDSlow(bx,by,cx,cy,px,py));bTerm=(bx.multiply(bx).add(by.multiply(by))).multiply(jsts.triangulate.quadedge.TrianglePredicate.triAreaDDSlow(ax,ay,cx,cy,px,py));cTerm=(cx.multiply(cx).add(cy.multiply(cy))).multiply(jsts.triangulate.quadedge.TrianglePredicate.triAreaDDSlow(ax,ay,bx,by,px,py));pTerm=(px.multiply(px).add(py.multiply(py))).multiply(jsts.triangulate.quadedge.TrianglePredicate.triAreaDDSlow(ax,ay,bx,by,cx,cy));sum=aTerm.subtract(bTerm).add(cTerm).subtract(pTerm);isInCircle=sum.doubleValue()>0;return isInCircle;};jsts.triangulate.quadedge.TrianglePredicate.triAreaDDSlow=function(ax,ay,bx,by,cx,cy){return(bx.subtract(ax).multiply(cy.subtract(ay)).subtract(by.subtract(ay).multiply(cx.subtract(ax))));};jsts.triangulate.quadedge.TrianglePredicate.isInCircleDDFast=function(a,b,c,p){var aTerm,bTerm,cTerm,pTerm,sum,isInCircle;aTerm=(jsts.math.DD.sqr(a.x).selfAdd(jsts.math.DD.sqr(a.y))).selfMultiply(jsts.triangulate.quadedge.TrianglePredicate.triAreaDDFast(b,c,p));bTerm=(jsts.math.DD.sqr(b.x).selfAdd(jsts.math.DD.sqr(b.y))).selfMultiply(jsts.triangulate.quadedge.TrianglePredicate.triAreaDDFast(a,c,p));cTerm=(jsts.math.DD.sqr(c.x).selfAdd(jsts.math.DD.sqr(c.y))).selfMultiply(jsts.triangulate.quadedge.TrianglePredicate.triAreaDDFast(a,b,p));pTerm=(jsts.math.DD.sqr(p.x).selfAdd(jsts.math.DD.sqr(p.y))).selfMultiply(jsts.triangulate.quadedge.TrianglePredicate.triAreaDDFast(a,b,c));sum=aTerm.selfSubtract(bTerm).selfAdd(cTerm).selfSubtract(pTerm);isInCircle=sum.doubleValue()>0;return isInCircle;};jsts.triangulate.quadedge.TrianglePredicate.triAreaDDFast=function(a,b,c){var t1,t2;t1=jsts.math.DD.valueOf(b.x).selfSubtract(a.x).selfMultiply(jsts.math.DD.valueOf(c.y).selfSubtract(a.y));t2=jsts.math.DD.valueOf(b.y).selSubtract(a.y).selfMultiply(jsts.math.DD.valueOf(c.x).selfSubtract(a.x));return t1.selfSubtract(t2);};jsts.triangulate.quadedge.TrianglePredicate.isInCircleDDNormalized=function(a,b,c,p){var adx,ady,bdx,bdy,cdx,cdy,abdet,bcdet,cadet,alift,blift,clift,sum,isInCircle;adx=jsts.math.DD.valueOf(a.x).selfSubtract(p.x);ady=jsts.math.DD.valueOf(a.y).selfSubtract(p.y);bdx=jsts.math.DD.valueOf(b.x).selfSubtract(p.x);bdx=jsts.math.DD.valueOf(b.y).selfSubtract(p.y);cdx=jsts.math.DD.valueOf(c.x).selfSubtract(p.x);cdx=jsts.math.DD.valueOf(c.y).selfSubtract(p.y);abdet=adx.multiply(bdy).selfSubtract(bdx.multiply(ady));bcdet=bdx.multiply(cdy).selfSubtract(cdx.multiply(bdy));cadet=cdx.multiply(ady).selfSubtract(adx.multiply(cdy));alift=adx.multiply(adx).selfAdd(ady.multiply(ady));blift=bdx.multiply(bdx).selfAdd(bdy.multiply(bdy));clift=cdx.multiply(cdx).selfAdd(cdy.multiply(cdy));sum=alift.selfMultiply(bcdet).selfAdd(blift.selfMultiply(cadet)).selfAdd(clift.selfMultiply(abdet));isInCircle=sum.doubleValue()>0;return isInCircle;};jsts.triangulate.quadedge.TrianglePredicate.isInCircleCC=function(a,b,c,p){var cc,ccRadius,pRadiusDiff;cc=jsts.geom.Triangle.circumcentre(a,b,c);ccRadius=a.distance(cc);pRadiusDiff=p.distance(cc)-ccRadius;return pRadiusDiff<=0;};jsts.operation.buffer.RightmostEdgeFinder=function(){};jsts.operation.buffer.RightmostEdgeFinder.prototype.minIndex=-1;jsts.operation.buffer.RightmostEdgeFinder.prototype.minCoord=null;jsts.operation.buffer.RightmostEdgeFinder.prototype.minDe=null;jsts.operation.buffer.RightmostEdgeFinder.prototype.orientedDe=null;jsts.operation.buffer.RightmostEdgeFinder.prototype.getEdge=function(){return this.orientedDe;};jsts.operation.buffer.RightmostEdgeFinder.prototype.getCoordinate=function(){return this.minCoord;};jsts.operation.buffer.RightmostEdgeFinder.prototype.findEdge=function(dirEdgeList){for(var i=dirEdgeList.iterator();i.hasNext();){var de=i.next();if(!de.isForward())
continue;this.checkForRightmostCoordinate(de);}
jsts.util.Assert.isTrue(this.minIndex!==0||this.minCoord.equals(this.minDe.getCoordinate()),'inconsistency in rightmost processing');if(this.minIndex===0){this.findRightmostEdgeAtNode();}else{this.findRightmostEdgeAtVertex();}
this.orientedDe=this.minDe;var rightmostSide=this.getRightmostSide(this.minDe,this.minIndex);if(rightmostSide==jsts.geomgraph.Position.LEFT){this.orientedDe=this.minDe.getSym();}};jsts.operation.buffer.RightmostEdgeFinder.prototype.findRightmostEdgeAtNode=function(){var node=this.minDe.getNode();var star=node.getEdges();this.minDe=star.getRightmostEdge();if(!this.minDe.isForward()){this.minDe=this.minDe.getSym();this.minIndex=this.minDe.getEdge().getCoordinates().length-1;}};jsts.operation.buffer.RightmostEdgeFinder.prototype.findRightmostEdgeAtVertex=function(){var pts=this.minDe.getEdge().getCoordinates();jsts.util.Assert.isTrue(this.minIndex>0&&this.minIndex<pts.length,'rightmost point expected to be interior vertex of edge');var pPrev=pts[this.minIndex-1];var pNext=pts[this.minIndex+1];var orientation=jsts.algorithm.CGAlgorithms.computeOrientation(this.minCoord,pNext,pPrev);var usePrev=false;if(pPrev.y<this.minCoord.y&&pNext.y<this.minCoord.y&&orientation===jsts.algorithm.CGAlgorithms.COUNTERCLOCKWISE){usePrev=true;}else if(pPrev.y>this.minCoord.y&&pNext.y>this.minCoord.y&&orientation===jsts.algorithm.CGAlgorithms.CLOCKWISE){usePrev=true;}
if(usePrev){this.minIndex=this.minIndex-1;}};jsts.operation.buffer.RightmostEdgeFinder.prototype.checkForRightmostCoordinate=function(de){var coord=de.getEdge().getCoordinates();for(var i=0;i<coord.length-1;i++){if(this.minCoord===null||coord[i].x>this.minCoord.x){this.minDe=de;this.minIndex=i;this.minCoord=coord[i];}}};jsts.operation.buffer.RightmostEdgeFinder.prototype.getRightmostSide=function(de,index){var side=this.getRightmostSideOfSegment(de,index);if(side<0)
side=this.getRightmostSideOfSegment(de,index-1);if(side<0){this.minCoord=null;this.checkForRightmostCoordinate(de);}
return side;};jsts.operation.buffer.RightmostEdgeFinder.prototype.getRightmostSideOfSegment=function(de,i){var e=de.getEdge();var coord=e.getCoordinates();if(i<0||i+1>=coord.length)
return-1;if(coord[i].y==coord[i+1].y)
return-1;var pos=jsts.geomgraph.Position.LEFT;if(coord[i].y<coord[i+1].y)
pos=jsts.geomgraph.Position.RIGHT;return pos;};(function(){jsts.triangulate.IncrementalDelaunayTriangulator=function(subdiv){this.subdiv=subdiv;this.isUsingTolerance=subdiv.getTolerance()>0.0;};jsts.triangulate.IncrementalDelaunayTriangulator.prototype.insertSites=function(vertices){var i=0,il=vertices.length,v;for(i;i<il;i++){v=vertices[i];this.insertSite(v);}};jsts.triangulate.IncrementalDelaunayTriangulator.prototype.insertSite=function(v){var e,base,startEdge,t;e=this.subdiv.locate(v);if(this.subdiv.isVertexOfEdge(e,v)){return e;}
else if(this.subdiv.isOnEdge(e,v.getCoordinate())){e=e.oPrev();this.subdiv.delete_jsts(e.oNext());}
base=this.subdiv.makeEdge(e.orig(),v);jsts.triangulate.quadedge.QuadEdge.splice(base,e);startEdge=base;do{base=this.subdiv.connect(e,base.sym());e=base.oPrev();}while(e.lNext()!=startEdge);do{t=e.oPrev();if(t.dest().rightOf(e)&&v.isInCircle(e.orig(),t.dest(),e.dest())){jsts.triangulate.quadedge.QuadEdge.swap(e);e=e.oPrev();}else if(e.oNext()==startEdge){return base;}else{e=e.oNext().lPrev();}}while(true);};}());jsts.noding.OrientedCoordinateArray=function(pts){this.pts=pts;this._orientation=jsts.noding.OrientedCoordinateArray.orientation(pts);};jsts.noding.OrientedCoordinateArray.prototype.pts=null;jsts.noding.OrientedCoordinateArray.prototype._orientation=undefined;jsts.noding.OrientedCoordinateArray.orientation=function(pts){return jsts.geom.CoordinateArrays.increasingDirection(pts)===1;};jsts.noding.OrientedCoordinateArray.prototype.compareTo=function(o1){var oca=o1;var comp=jsts.noding.OrientedCoordinateArray.compareOriented(this.pts,this._orientation,oca.pts,oca._orientation);return comp;};jsts.noding.OrientedCoordinateArray.compareOriented=function(pts1,orientation1,pts2,orientation2){var dir1=orientation1?1:-1;var dir2=orientation2?1:-1;var limit1=orientation1?pts1.length:-1;var limit2=orientation2?pts2.length:-1;var i1=orientation1?0:pts1.length-1;var i2=orientation2?0:pts2.length-1;var comp=0;while(true){var compPt=pts1[i1].compareTo(pts2[i2]);if(compPt!==0)
return compPt;i1+=dir1;i2+=dir2;var done1=i1===limit1;var done2=i2===limit2;if(done1&&!done2)
return-1;if(!done1&&done2)
return 1;if(done1&&done2)
return 0;}};jsts.index.quadtree.Root=function(){jsts.index.quadtree.NodeBase.prototype.constructor.apply(this,arguments);this.origin=new jsts.geom.Coordinate(0.0,0.0);};jsts.index.quadtree.Root.prototype=new jsts.index.quadtree.NodeBase();jsts.index.quadtree.Root.prototype.insert=function(itemEnv,item){var index=this.getSubnodeIndex(itemEnv,this.origin);if(index===-1){this.add(item);return;}
var node=this.subnode[index];if(node===null||!node.getEnvelope().contains(itemEnv)){var largerNode=jsts.index.quadtree.Node.createExpanded(node,itemEnv);this.subnode[index]=largerNode;}
this.insertContained(this.subnode[index],itemEnv,item);};jsts.index.quadtree.Root.prototype.insertContained=function(tree,itemEnv,item){var isZeroX,isZeroY,node;isZeroX=jsts.index.IntervalSize.isZeroWidth(itemEnv.getMinX(),itemEnv.getMaxX());isZeroY=jsts.index.IntervalSize.isZeroWidth(itemEnv.getMinY(),itemEnv.getMaxY());if(isZeroX||isZeroY){node=tree.find(itemEnv);}else{node=tree.getNode(itemEnv);}
node.add(item);};jsts.index.quadtree.Root.prototype.isSearchMatch=function(searchEnv){return true;};jsts.triangulate.quadedge.Vertex=function(){if(arguments.length===1){this.initFromCoordinate(arguments[0]);}else{this.initFromXY(arguments[0],arguments[1]);}};jsts.triangulate.quadedge.Vertex.LEFT=0;jsts.triangulate.quadedge.Vertex.RIGHT=1;jsts.triangulate.quadedge.Vertex.BEYOND=2;jsts.triangulate.quadedge.Vertex.BEHIND=3;jsts.triangulate.quadedge.Vertex.BETWEEN=4;jsts.triangulate.quadedge.Vertex.ORIGIN=5;jsts.triangulate.quadedge.Vertex.DESTINATION=6;jsts.triangulate.quadedge.Vertex.prototype.initFromXY=function(x,y){this.p=new jsts.geom.Coordinate(x,y);};jsts.triangulate.quadedge.Vertex.prototype.initFromCoordinate=function(_p){this.p=new jsts.geom.Coordinate(_p);};jsts.triangulate.quadedge.Vertex.prototype.getX=function(){return this.p.x;};jsts.triangulate.quadedge.Vertex.prototype.getY=function(){return this.p.y;};jsts.triangulate.quadedge.Vertex.prototype.getZ=function(){return this.p.z;};jsts.triangulate.quadedge.Vertex.prototype.setZ=function(z){this.p.z=z;};jsts.triangulate.quadedge.Vertex.prototype.getCoordinate=function(){return this.p;};jsts.triangulate.quadedge.Vertex.prototype.toString=function(){return'POINT ('+this.p.x+' '+this.p.y+')';};jsts.triangulate.quadedge.Vertex.prototype.equals=function(){if(arguments.length===1){return this.equalsExact(arguments[0]);}else{return this.equalsWithTolerance(arguments[0],arguments[1]);}};jsts.triangulate.quadedge.Vertex.prototype.equalsExact=function(other){return(this.p.x===other.getX()&&this.p.y===other.getY());};jsts.triangulate.quadedge.Vertex.prototype.equalsWithTolerance=function(other,tolerance){return(this.p.distance(other.getCoordinate())<tolerance);};jsts.triangulate.quadedge.Vertex.prototype.classify=function(p0,p1){var p2,a,b,sa;p2=this;a=p1.sub(p0);b=p2.sub(p0);sa=a.crossProduct(b);if(sa>0.0){return jsts.triangulate.quadedge.Vertex.LEFT;}
if(sa<0.0){return jsts.triangulate.quadedge.Vertex.RIGHT;}
if((a.getX()*b.getX()<0.0)||(a.getY()*b.getY()<0.0)){return jsts.triangulate.quadedge.Vertex.BEHIND;}
if(a.magn()<b.magn()){return jsts.triangulate.quadedge.Vertex.BEYOND;}
if(p0.equals(p2)){return jsts.triangulate.quadedge.Vertex.ORIGIN;}
if(p1.equals(p2)){return jsts.triangulate.quadedge.Vertex.DESTINATION;}
return jsts.triangulate.quadedge.Vertex.BETWEEN;};jsts.triangulate.quadedge.Vertex.prototype.crossProduct=function(v){return((this.p.x*v.getY())-(this.p.y*v.getX()));};jsts.triangulate.quadedge.Vertex.prototype.dot=function(v){return((this.p.x*v.getX())+(this.p.y*v.getY()));};jsts.triangulate.quadedge.Vertex.prototype.times=function(c){return new jsts.triangulate.quadedge.Vertex(c*this.p.x,c*this.p.y);};jsts.triangulate.quadedge.Vertex.prototype.sum=function(v){return new jsts.triangulate.quadedge.Vertex(this.p.x+v.getX(),this.p.y+
v.getY());};jsts.triangulate.quadedge.Vertex.prototype.sub=function(v){return new jsts.triangulate.quadedge.Vertex(this.p.x-v.getX(),this.p.y-
v.getY());};jsts.triangulate.quadedge.Vertex.prototype.magn=function(){return(Math.sqrt((this.p.x*this.p.x)+(this.p.y*this.p.y)));};jsts.triangulate.quadedge.Vertex.prototype.cross=function(){return new Vertex(this.p.y,-this.p.x);};jsts.triangulate.quadedge.Vertex.prototype.isInCircle=function(a,b,c){return jsts.triangulate.quadedge.TrianglePredicate.isInCircleRobust(a.p,b.p,c.p,this.p);};jsts.triangulate.quadedge.Vertex.prototype.isCCW=function(b,c){return((b.p.x-this.p.x)*(c.p.y-this.p.y)-(b.p.y-this.p.y)*(c.p.x-this.p.x)>0);};jsts.triangulate.quadedge.Vertex.prototype.rightOf=function(e){return this.isCCW(e.dest(),e.orig());};jsts.triangulate.quadedge.Vertex.prototype.leftOf=function(e){return this.isCCW(e.orig(),e.dest());};jsts.triangulate.quadedge.Vertex.prototype.bisector=function(a,b){var dx,dy,l1,l2;dx=b.getX()-a.getX();dy=b.getY()-a.getY();l1=new jsts.algorithm.HCoordinate(a.getX()+(dx/2.0),a.getY()+
(dy/2.0),1.0);l2=new jsts.algorithm.HCoordinate(a.getX()-dy+(dx/2.0),a.getY()+
dx+(dy/2.0),1.0);return new jsts.algorithm.HCoordinate(l1,l2);};jsts.triangulate.quadedge.Vertex.prototype.distance=function(v1,v2){return v1.p.distance(v2.p);};jsts.triangulate.quadedge.Vertex.prototype.circumRadiusRatio=function(b,c){var x,radius,edgeLength,el;x=this.circleCenter(b,c);radius=this.distance(x,b);edgeLength=this.distance(this,b);el=this.distance(b,c);if(el<edgeLength){edgeLength=el;}
el=this.distance(c,this);if(el<edgeLength){edgeLength=el;}
return radius/edgeLength;};jsts.triangulate.quadedge.Vertex.prototype.midPoint=function(a){var xm,ym;xm=(this.p.x+a.getX())/2.0;ym=(this.p.y+a.getY())/2.0;return new jsts.triangulate.quadedge.Vertex(xm,ym);};jsts.triangulate.quadedge.Vertex.prototype.circleCenter=function(b,c){var a,cab,cbc,hcc,cc;a=new jsts.triangulate.quadedge.Vertex(this.getX(),this.getY());cab=this.bisector(a,b);cbc=this.bisector(b,c);hcc=new jsts.algorithm.HCoordinate(cab,cbc);cc=null;try{cc=new jsts.triangulate.quadedge.Vertex(hcc.getX(),hcc.getY());}catch(err){}
return cc;};jsts.noding.SegmentNodeList=function(edge){this.nodeMap=new javascript.util.TreeMap();this.edge=edge;};jsts.noding.SegmentNodeList.prototype.nodeMap=null;jsts.noding.SegmentNodeList.prototype.iterator=function(){return this.nodeMap.values().iterator();};jsts.noding.SegmentNodeList.prototype.edge=null;jsts.noding.SegmentNodeList.prototype.getEdge=function(){return this.edge;};jsts.noding.SegmentNodeList.prototype.add=function(intPt,segmentIndex){var eiNew=new jsts.noding.SegmentNode(this.edge,intPt,segmentIndex,this.edge.getSegmentOctant(segmentIndex));var ei=this.nodeMap.get(eiNew);if(ei!==null){jsts.util.Assert.isTrue(ei.coord.equals2D(intPt),'Found equal nodes with different coordinates');return ei;}
this.nodeMap.put(eiNew,eiNew);return eiNew;};jsts.noding.SegmentNodeList.prototype.addEndpoints=function(){var maxSegIndex=this.edge.size()-1;this.add(this.edge.getCoordinate(0),0);this.add(this.edge.getCoordinate(maxSegIndex),maxSegIndex);};jsts.noding.SegmentNodeList.prototype.addCollapsedNodes=function(){var collapsedVertexIndexes=[];this.findCollapsesFromInsertedNodes(collapsedVertexIndexes);this.findCollapsesFromExistingVertices(collapsedVertexIndexes);for(var i=0;i<collapsedVertexIndexes.length;i++){var vertexIndex=collapsedVertexIndexes[i];this.add(this.edge.getCoordinate(vertexIndex),vertexIndex);}};jsts.noding.SegmentNodeList.prototype.findCollapsesFromExistingVertices=function(collapsedVertexIndexes){for(var i=0;i<this.edge.size()-2;i++){var p0=this.edge.getCoordinate(i);var p1=this.edge.getCoordinate(i+1);var p2=this.edge.getCoordinate(i+2);if(p0.equals2D(p2)){collapsedVertexIndexes.push(i+1);}}};jsts.noding.SegmentNodeList.prototype.findCollapsesFromInsertedNodes=function(collapsedVertexIndexes){var collapsedVertexIndex=[null];var it=this.iterator();var eiPrev=it.next();while(it.hasNext()){var ei=it.next();var isCollapsed=this.findCollapseIndex(eiPrev,ei,collapsedVertexIndex);if(isCollapsed)
collapsedVertexIndexes.push(collapsedVertexIndex[0]);eiPrev=ei;}};jsts.noding.SegmentNodeList.prototype.findCollapseIndex=function(ei0,ei1,collapsedVertexIndex){if(!ei0.coord.equals2D(ei1.coord))
return false;var numVerticesBetween=ei1.segmentIndex-ei0.segmentIndex;if(!ei1.isInterior()){numVerticesBetween--;}
if(numVerticesBetween===1){collapsedVertexIndex[0]=ei0.segmentIndex+1;return true;}
return false;};jsts.noding.SegmentNodeList.prototype.addSplitEdges=function(edgeList){this.addEndpoints();this.addCollapsedNodes();var it=this.iterator();var eiPrev=it.next();while(it.hasNext()){var ei=it.next();var newEdge=this.createSplitEdge(eiPrev,ei);edgeList.add(newEdge);eiPrev=ei;}};jsts.noding.SegmentNodeList.prototype.checkSplitEdgesCorrectness=function(splitEdges){var edgePts=edge.getCoordinates();var split0=splitEdges[0];var pt0=split0.getCoordinate(0);if(!pt0.equals2D(edgePts[0]))
throw new Error('bad split edge start point at '+pt0);var splitn=splitEdges[splitEdges.length-1];var splitnPts=splitn.getCoordinates();var ptn=splitnPts[splitnPts.length-1];if(!ptn.equals2D(edgePts[edgePts.length-1]))
throw new Error('bad split edge end point at '+ptn);};jsts.noding.SegmentNodeList.prototype.createSplitEdge=function(ei0,ei1){var npts=ei1.segmentIndex-ei0.segmentIndex+2;var lastSegStartPt=this.edge.getCoordinate(ei1.segmentIndex);var useIntPt1=ei1.isInterior()||!ei1.coord.equals2D(lastSegStartPt);if(!useIntPt1){npts--;}
var pts=[];var ipt=0;pts[ipt++]=new jsts.geom.Coordinate(ei0.coord);for(var i=ei0.segmentIndex+1;i<=ei1.segmentIndex;i++){pts[ipt++]=this.edge.getCoordinate(i);}
if(useIntPt1)
pts[ipt]=ei1.coord;return new jsts.noding.NodedSegmentString(pts,this.edge.getData());};jsts.operation.union.CascadedPolygonUnion=function(polys){this.inputPolys=polys;};jsts.operation.union.CascadedPolygonUnion.union=function(polys){var op=new jsts.operation.union.CascadedPolygonUnion(polys);return op.union();};jsts.operation.union.CascadedPolygonUnion.prototype.inputPolys;jsts.operation.union.CascadedPolygonUnion.prototype.geomFactory=null;jsts.operation.union.CascadedPolygonUnion.prototype.STRTREE_NODE_CAPACITY=4;jsts.operation.union.CascadedPolygonUnion.prototype.union=function(){if(this.inputPolys.length===0){return null;}
this.geomFactory=this.inputPolys[0].getFactory();var index=new jsts.index.strtree.STRtree(this.STRTREE_NODE_CAPACITY);for(var i=0,l=this.inputPolys.length;i<l;i++){var item=this.inputPolys[i];index.insert(item.getEnvelopeInternal(),item);}
var itemTree=index.itemsTree();var unionAll=this.unionTree(itemTree);return unionAll;};jsts.operation.union.CascadedPolygonUnion.prototype.unionTree=function(geomTree){var geoms=this.reduceToGeometries(geomTree);var union=this.bindayUnion(geoms);return union;};jsts.operation.union.CascadedPolygonUnion.prototype.binaryUnion=function(geoms,start,end){start=start||0;end=end||geoms.length;if(end-start<=1){var g0=this.getGeometry(geoms,start);return this.unionSafe(g0,null);}
else if(end-start===2){return this.unionSafe(this.getGeometry(geoms,start),this.getGeometry(geoms,start+1));}
else{var mid=(end+start)/2;var g0=this.binaryUnion(geoms,start,mid);var g1=this.binaryUnion(geoms,mid,end);return this.unionSafe(g0,g1);}};jsts.operation.union.CascadedPolygonUnion.getGeometry=function(list,index){if(index>=list.length){return null;}
return list[i];};jsts.operation.union.CascadedPolygonUnion.prototype.reduceToGeometries=function(geomTree){var geoms=[];for(var i=0,l=geomTree.length;i<l;i++){var o=geomTree[i],geom=null;if(o instanceof Array){geom=this.unionTree(o);}
else if(o instanceof jsts.geom.Geometry){geom=o;}
geoms.push(geom);}
return geoms;};jsts.operation.union.CascadedPolygonUnion.prototype.unionSafe=function(g0,g1){if(g0===null&&g1===null){return null;}
if(g0===null){return g1.clone();}
if(g1===null){return g0.clone();}
return unionOptimized(g0,g1);};jsts.operation.union.CascadedPolygonUnion.prototype.unionOptimized=function(g0,g1){var g0Env=g0.getEnvelopeInternal(),g1Env=g1.getEnvelopeInternal();if(!g0Env.intersects(g1Env)){var combo=jsts.geom.util.GeometryCombiner.combine(g0,g1);return combo;}
if(g0.getNumGeometries<=1&&g1.getNumGeometries<=1){return this.unionActual(g0,g1);}
var commonEnv=g0Env.intersection(g1Env);return this.unionUsingEnvelopeIntersection(g0,g1,commonEnv);};jsts.operation.union.CascadedPolygonUnion.prototype.unionUsingEnvelopeIntersection=function(g0,g1,common){var disjointPolys=[];var g0Int=this.extractByEnvelope(common,g0,disjointPolys);var g1Int=this.extractByEnvelope(common,g1,disjointPolys);var union=this.unionActual(g0Int,g1Int);disjointPolys.push(union);var overallUnion=jsts.geom.util.GeometryCombiner.combine(disjointPolys);return overallUnion;};jsts.operation.union.CascadedPolygonUnion.prototype.extractByEnvelope=function(env,geom,disjointGeoms){var intersectingGeoms=[];for(var i=0;i<geom.getNumGeometries();i++){var elem=geom.getGeometryN(i);if(elem.getEnvelopeInternal().intersects(env)){intersectingGeoms.push(elem);}
else{disjointGeoms.add(elem);}}
return this.geomFactory.buildGeometry(intersectingGeoms);};jsts.operation.union.CascadedPolygonUnion.prototype.unionActual=function(g0,g1){return g0.union(g1);};(function(){jsts.geom.MultiPoint=function(points,factory){this.geometries=points||[];this.factory=factory;};jsts.geom.MultiPoint.prototype=new jsts.geom.GeometryCollection();jsts.geom.MultiPoint.constructor=jsts.geom.MultiPoint;jsts.geom.MultiPoint.prototype.getBoundary=function(){return this.getFactory().createGeometryCollection(null);};jsts.geom.MultiPoint.prototype.getGeometryN=function(n){return this.geometries[n];};jsts.geom.MultiPoint.prototype.equalsExact=function(other,tolerance){if(!this.isEquivalentClass(other)){return false;}
return jsts.geom.GeometryCollection.prototype.equalsExact.call(this,other,tolerance);};jsts.geom.MultiPoint.prototype.CLASS_NAME='jsts.geom.MultiPoint';})();jsts.operation.distance.DistanceOp=function(g0,g1,terminateDistance){this.ptLocator=new jsts.algorithm.PointLocator();this.geom=[];this.geom[0]=g0;this.geom[1]=g1;this.terminateDistance=terminateDistance;};jsts.operation.distance.DistanceOp.prototype.geom=null;jsts.operation.distance.DistanceOp.prototype.terminateDistance=0.0;jsts.operation.distance.DistanceOp.prototype.ptLocator=null;jsts.operation.distance.DistanceOp.prototype.minDistanceLocation=null;jsts.operation.distance.DistanceOp.prototype.minDistance=Number.MAX_VALUE;jsts.operation.distance.DistanceOp.distance=function(g0,g1){var distOp=new jsts.operation.distance.DistanceOp(g0,g1,0.0);return distOp.distance();};jsts.operation.distance.DistanceOp.isWithinDistance=function(g0,g1,distance){var distOp=new jsts.operation.distance.DistanceOp(g0,g1,distance);return distOp.distance()<=distance;};jsts.operation.distance.DistanceOp.nearestPoints=function(g0,g1){var distOp=new jsts.operation.distance.DistanceOp(g0,g1,0.0);return distOp.nearestPoints();};jsts.operation.distance.DistanceOp.prototype.distance=function(){if(this.geom[0]===null||this.geom[1]===null)
throw new jsts.error.IllegalArgumentError('null geometries are not supported');if(this.geom[0].isEmpty()||this.geom[1].isEmpty())
return 0.0;this.computeMinDistance();return this.minDistance;};jsts.operation.distance.DistanceOp.prototype.nearestPoints=function(){this.computeMinDistance();var nearestPts=[this.minDistanceLocation[0].getCoordinate(),this.minDistanceLocation[1].getCoordinate()];return nearestPts;};jsts.operation.distance.DistanceOp.prototype.nearestLocations=function(){this.computeMinDistance();return this.minDistanceLocation;};jsts.operation.distance.DistanceOp.prototype.updateMinDistance=function(locGeom,flip){if(locGeom[0]===null)
return;if(flip){this.minDistanceLocation[0]=locGeom[1];this.minDistanceLocation[1]=locGeom[0];}else{this.minDistanceLocation[0]=locGeom[0];this.minDistanceLocation[1]=locGeom[1];}};jsts.operation.distance.DistanceOp.prototype.computeMinDistance=function(){if(arguments.length>0){this.computeMinDistance2.apply(this,arguments);return;}
if(this.minDistanceLocation!==null)
return;this.minDistanceLocation=[];this.computeContainmentDistance();if(this.minDistance<=this.terminateDistance)
return;this.computeFacetDistance();};jsts.operation.distance.DistanceOp.prototype.computeContainmentDistance=function(){if(arguments.length===2){this.computeContainmentDistance2.apply(this,arguments);return;}else if(arguments.length===3&&(!arguments[0]instanceof jsts.operation.distance.GeometryLocation)){this.computeContainmentDistance3.apply(this,arguments);return;}else if(arguments.length===3){this.computeContainmentDistance4.apply(this,arguments);return;}
var locPtPoly=[];this.computeContainmentDistance2(0,locPtPoly);if(this.minDistance<=this.terminateDistance)
return;this.computeContainmentDistance2(1,locPtPoly);};jsts.operation.distance.DistanceOp.prototype.computeContainmentDistance2=function(polyGeomIndex,locPtPoly){var locationsIndex=1-polyGeomIndex;var polys=jsts.geom.util.PolygonExtracter.getPolygons(this.geom[polyGeomIndex]);if(polys.length>0){var insideLocs=jsts.operation.distance.ConnectedElementLocationFilter.getLocations(this.geom[locationsIndex]);this.computeContainmentDistance3(insideLocs,polys,locPtPoly);if(this.minDistance<=this.terminateDistance){this.minDistanceLocation[locationsIndex]=locPtPoly[0];this.minDistanceLocation[polyGeomIndex]=locPtPoly[1];return;}}};jsts.operation.distance.DistanceOp.prototype.computeContainmentDistance3=function(locs,polys,locPtPoly){for(var i=0;i<locs.length;i++){var loc=locs[i];for(var j=0;j<polys.length;j++){this.computeContainmentDistance4(loc,polys[j],locPtPoly);if(this.minDistance<=this.terminateDistance)
return;}}};jsts.operation.distance.DistanceOp.prototype.computeContainmentDistance4=function(ptLoc,poly,locPtPoly){var pt=ptLoc.getCoordinate();if(jsts.geom.Location.EXTERIOR!==this.ptLocator.locate(pt,poly)){this.minDistance=0.0;locPtPoly[0]=ptLoc;locPtPoly[1]=new jsts.operation.distance.GeometryLocation(poly,pt);return;}};jsts.operation.distance.DistanceOp.prototype.computeFacetDistance=function(){var locGeom=[];var lines0=jsts.geom.util.LinearComponentExtracter.getLines(this.geom[0]);var lines1=jsts.geom.util.LinearComponentExtracter.getLines(this.geom[1]);var pts0=jsts.geom.util.PointExtracter.getPoints(this.geom[0]);var pts1=jsts.geom.util.PointExtracter.getPoints(this.geom[1]);this.computeMinDistanceLines(lines0,lines1,locGeom);this.updateMinDistance(locGeom,false);if(this.minDistance<=this.terminateDistance)
return;locGeom[0]=null;locGeom[1]=null;this.computeMinDistanceLinesPoints(lines0,pts1,locGeom);this.updateMinDistance(locGeom,false);if(this.minDistance<=this.terminateDistance)
return;locGeom[0]=null;locGeom[1]=null;this.computeMinDistanceLinesPoints(lines1,pts0,locGeom);this.updateMinDistance(locGeom,true);if(this.minDistance<=this.terminateDistance)
return;locGeom[0]=null;locGeom[1]=null;this.computeMinDistancePoints(pts0,pts1,locGeom);this.updateMinDistance(locGeom,false);};jsts.operation.distance.DistanceOp.prototype.computeMinDistanceLines=function(lines0,lines1,locGeom){for(var i=0;i<lines0.length;i++){var line0=lines0[i];for(var j=0;j<lines1.length;j++){var line1=lines1[j];this.computeMinDistance(line0,line1,locGeom);if(this.minDistance<=this.terminateDistance)
return;}}};jsts.operation.distance.DistanceOp.prototype.computeMinDistancePoints=function(points0,points1,locGeom){for(var i=0;i<points0.length;i++){var pt0=points0[i];for(var j=0;j<points1.length;j++){var pt1=points1[j];var dist=pt0.getCoordinate().distance(pt1.getCoordinate());if(dist<this.minDistance){this.minDistance=dist;locGeom[0]=new jsts.operation.distance.GeometryLocation(pt0,0,pt0.getCoordinate());locGeom[1]=new jsts.operation.distance.GeometryLocation(pt1,0,pt1.getCoordinate());}
if(this.minDistance<=this.terminateDistance)
return;}}};jsts.operation.distance.DistanceOp.prototype.computeMinDistanceLinesPoints=function(lines,points,locGeom){for(var i=0;i<lines.length;i++){var line=lines[i];for(var j=0;j<points.length;j++){var pt=points[j];this.computeMinDistance(line,pt,locGeom);if(this.minDistance<=this.terminateDistance)
return;}}};jsts.operation.distance.DistanceOp.prototype.computeMinDistance2=function(line0,line1,locGeom){if(line1 instanceof jsts.geom.Point){this.computeMinDistance3(line0,line1,locGeom);return;}
if(line0.getEnvelopeInternal().distance(line1.getEnvelopeInternal())>this.minDistance){return;}
var coord0=line0.getCoordinates();var coord1=line1.getCoordinates();for(var i=0;i<coord0.length-1;i++){for(var j=0;j<coord1.length-1;j++){var dist=jsts.algorithm.CGAlgorithms.distanceLineLine(coord0[i],coord0[i+1],coord1[j],coord1[j+1]);if(dist<this.minDistance){this.minDistance=dist;var seg0=new jsts.geom.LineSegment(coord0[i],coord0[i+1]);var seg1=new jsts.geom.LineSegment(coord1[j],coord1[j+1]);var closestPt=seg0.closestPoints(seg1);locGeom[0]=new jsts.operation.distance.GeometryLocation(line0,i,closestPt[0]);locGeom[1]=new jsts.operation.distance.GeometryLocation(line1,j,closestPt[1]);}
if(this.minDistance<=this.terminateDistance){return;}}}};jsts.operation.distance.DistanceOp.prototype.computeMinDistance3=function(line,pt,locGeom){if(line.getEnvelopeInternal().distance(pt.getEnvelopeInternal())>this.minDistance){return;}
var coord0=line.getCoordinates();var coord=pt.getCoordinate();for(var i=0;i<coord0.length-1;i++){var dist=jsts.algorithm.CGAlgorithms.distancePointLine(coord,coord0[i],coord0[i+1]);if(dist<this.minDistance){this.minDistance=dist;var seg=new jsts.geom.LineSegment(coord0[i],coord0[i+1]);var segClosestPoint=seg.closestPoint(coord);locGeom[0]=new jsts.operation.distance.GeometryLocation(line,i,segClosestPoint);locGeom[1]=new jsts.operation.distance.GeometryLocation(pt,0,coord);}
if(this.minDistance<=this.terminateDistance){return;}}};(function(){var HotPixelSnapAction=function(hotPixel,parentEdge,vertexIndex){this.hotPixel=hotPixel;this.parentEdge=parentEdge;this.vertexIndex=vertexIndex;};HotPixelSnapAction.prototype=new jsts.index.chain.MonotoneChainSelectAction();HotPixelSnapAction.constructor=HotPixelSnapAction;HotPixelSnapAction.prototype.hotPixel=null;HotPixelSnapAction.prototype.parentEdge=null;HotPixelSnapAction.prototype.vertexIndex=null;HotPixelSnapAction.prototype._isNodeAdded=false;HotPixelSnapAction.prototype.isNodeAdded=function(){return this._isNodeAdded;};HotPixelSnapAction.prototype.select=function(mc,startIndex){var ss=mc.getContext();if(this.parentEdge!==null){if(ss===this.parentEdge&&startIndex===this.vertexIndex)
return;}
this._isNodeAdded=this.hotPixel.addSnappedNode(ss,startIndex);};jsts.noding.snapround.MCIndexPointSnapper=function(index){this.index=index;};jsts.noding.snapround.MCIndexPointSnapper.prototype.index=null;jsts.noding.snapround.MCIndexPointSnapper.prototype.snap=function(hotPixel,parentEdge,vertexIndex){if(arguments.length===1){this.snap2.apply(this,arguments);return;}
var pixelEnv=hotPixel.getSafeEnvelope();var hotPixelSnapAction=new HotPixelSnapAction(hotPixel,parentEdge,vertexIndex);this.index.query(pixelEnv,{visitItem:function(testChain){testChain.select(pixelEnv,hotPixelSnapAction);}});return hotPixelSnapAction.isNodeAdded();};jsts.noding.snapround.MCIndexPointSnapper.prototype.snap2=function(hotPixel){return this.snap(hotPixel,null,-1);};})();jsts.geomgraph.Quadrant=function(){};jsts.geomgraph.Quadrant.NE=0;jsts.geomgraph.Quadrant.NW=1;jsts.geomgraph.Quadrant.SW=2;jsts.geomgraph.Quadrant.SE=3;jsts.geomgraph.Quadrant.quadrant=function(dx,dy){if(dx instanceof jsts.geom.Coordinate){return jsts.geomgraph.Quadrant.quadrant2.apply(this,arguments);}
if(dx===0.0&&dy===0.0)
throw new jsts.error.IllegalArgumentError('Cannot compute the quadrant for point ( '+dx+', '+dy+' )');if(dx>=0.0){if(dy>=0.0)
return jsts.geomgraph.Quadrant.NE;else
return jsts.geomgraph.Quadrant.SE;}else{if(dy>=0.0)
return jsts.geomgraph.Quadrant.NW;else
return jsts.geomgraph.Quadrant.SW;}};jsts.geomgraph.Quadrant.quadrant2=function(p0,p1){if(p1.x===p0.x&&p1.y===p0.y)
throw new jsts.error.IllegalArgumentError('Cannot compute the quadrant for two identical points '+p0);if(p1.x>=p0.x){if(p1.y>=p0.y)
return jsts.geomgraph.Quadrant.NE;else
return jsts.geomgraph.Quadrant.SE;}else{if(p1.y>=p0.y)
return jsts.geomgraph.Quadrant.NW;else
return jsts.geomgraph.Quadrant.SW;}};jsts.geomgraph.Quadrant.isOpposite=function(quad1,quad2){if(quad1===quad2)
return false;var diff=(quad1-quad2+4)%4;if(diff===2)
return true;return false;};jsts.geomgraph.Quadrant.commonHalfPlane=function(quad1,quad2){if(quad1===quad2)
return quad1;var diff=(quad1-quad2+4)%4;if(diff===2)
return-1;var min=(quad1<quad2)?quad1:quad2;var max=(quad1>quad2)?quad1:quad2;if(min===0&&max===3)
return 3;return min;};jsts.geomgraph.Quadrant.isInHalfPlane=function(quad,halfPlane){if(halfPlane===jsts.geomgraph.Quadrant.SE){return quad===jsts.geomgraph.Quadrant.SE||quad===jsts.geomgraph.Quadrant.SW;}
return quad===halfPlane||quad===halfPlane+1;};jsts.geomgraph.Quadrant.isNorthern=function(quad){return quad===jsts.geomgraph.Quadrant.NE||quad===jsts.geomgraph.Quadrant.NW;};jsts.operation.valid.ConsistentAreaTester=function(geomGraph){this.geomGraph=geomGraph;this.li=new jsts.algorithm.RobustLineIntersector();this.nodeGraph=new jsts.operation.relate.RelateNodeGraph();this.invalidPoint=null;};jsts.operation.valid.ConsistentAreaTester.prototype.getInvalidPoint=function(){return this.invalidPoint;};jsts.operation.valid.ConsistentAreaTester.prototype.isNodeConsistentArea=function(){var intersector=this.geomGraph.computeSelfNodes(this.li,true);if(intersector.hasProperIntersection()){this.invalidPoint=intersector.getProperIntersectionPoint();return false;}
this.nodeGraph.build(this.geomGraph);return this.isNodeEdgeAreaLabelsConsistent();};jsts.operation.valid.ConsistentAreaTester.prototype.isNodeEdgeAreaLabelsConsistent=function(){for(var nodeIt=this.nodeGraph.getNodeIterator();nodeIt.hasNext();){var node=nodeIt.next();if(!node.getEdges().isAreaLabelsConsistent(this.geomGraph)){this.invalidPoint=node.getCoordinate().clone();return false;}}
return true;};jsts.operation.valid.ConsistentAreaTester.prototype.hasDuplicateRings=function(){for(var nodeIt=this.nodeGraph.getNodeIterator();nodeIt.hasNext();){var node=nodeIt.next();for(var i=node.getEdges().iterator();i.hasNext();){var eeb=i.next();if(eeb.getEdgeEnds().length>1){invalidPoint=eeb.getEdge().getCoordinate(0);return true;}}}
return false;};jsts.index.strtree.AbstractNode=function(level){this.level=level;this.childBoundables=[];};jsts.index.strtree.AbstractNode.prototype=new jsts.index.strtree.Boundable();jsts.index.strtree.AbstractNode.constructor=jsts.index.strtree.AbstractNode;jsts.index.strtree.AbstractNode.prototype.childBoundables=null;jsts.index.strtree.AbstractNode.prototype.bounds=null;jsts.index.strtree.AbstractNode.prototype.level=null;jsts.index.strtree.AbstractNode.prototype.getChildBoundables=function(){return this.childBoundables;};jsts.index.strtree.AbstractNode.prototype.computeBounds=function(){throw new jsts.error.AbstractMethodInvocationError();};jsts.index.strtree.AbstractNode.prototype.getBounds=function(){if(this.bounds===null){this.bounds=this.computeBounds();}
return this.bounds;};jsts.index.strtree.AbstractNode.prototype.getLevel=function(){return this.level;};jsts.index.strtree.AbstractNode.prototype.addChildBoundable=function(childBoundable){this.childBoundables.push(childBoundable);};(function(){var Location=jsts.geom.Location;var Position=jsts.geomgraph.Position;var EdgeEnd=jsts.geomgraph.EdgeEnd;jsts.geomgraph.DirectedEdge=function(edge,isForward){EdgeEnd.call(this,edge);this.depth=[0,-999,-999];this._isForward=isForward;if(isForward){this.init(edge.getCoordinate(0),edge.getCoordinate(1));}else{var n=edge.getNumPoints()-1;this.init(edge.getCoordinate(n),edge.getCoordinate(n-1));}
this.computeDirectedLabel();};jsts.geomgraph.DirectedEdge.prototype=new EdgeEnd();jsts.geomgraph.DirectedEdge.constructor=jsts.geomgraph.DirectedEdge;jsts.geomgraph.DirectedEdge.depthFactor=function(currLocation,nextLocation){if(currLocation===Location.EXTERIOR&&nextLocation===Location.INTERIOR)
return 1;else if(currLocation===Location.INTERIOR&&nextLocation===Location.EXTERIOR)
return-1;return 0;};jsts.geomgraph.DirectedEdge.prototype._isForward=null;jsts.geomgraph.DirectedEdge.prototype._isInResult=false;jsts.geomgraph.DirectedEdge.prototype._isVisited=false;jsts.geomgraph.DirectedEdge.prototype.sym=null;jsts.geomgraph.DirectedEdge.prototype.next=null;jsts.geomgraph.DirectedEdge.prototype.nextMin=null;jsts.geomgraph.DirectedEdge.prototype.edgeRing=null;jsts.geomgraph.DirectedEdge.prototype.minEdgeRing=null;jsts.geomgraph.DirectedEdge.prototype.depth=null;jsts.geomgraph.DirectedEdge.prototype.getEdge=function(){return this.edge;};jsts.geomgraph.DirectedEdge.prototype.setInResult=function(isInResult){this._isInResult=isInResult;};jsts.geomgraph.DirectedEdge.prototype.isInResult=function(){return this._isInResult;};jsts.geomgraph.DirectedEdge.prototype.isVisited=function(){return this._isVisited;};jsts.geomgraph.DirectedEdge.prototype.setVisited=function(isVisited){this._isVisited=isVisited;};jsts.geomgraph.DirectedEdge.prototype.setEdgeRing=function(edgeRing){this.edgeRing=edgeRing;};jsts.geomgraph.DirectedEdge.prototype.getEdgeRing=function(){return this.edgeRing;};jsts.geomgraph.DirectedEdge.prototype.setMinEdgeRing=function(minEdgeRing){this.minEdgeRing=minEdgeRing;};jsts.geomgraph.DirectedEdge.prototype.getMinEdgeRing=function(){return this.minEdgeRing;};jsts.geomgraph.DirectedEdge.prototype.getDepth=function(position){return this.depth[position];};jsts.geomgraph.DirectedEdge.prototype.setDepth=function(position,depthVal){if(this.depth[position]!==-999){if(this.depth[position]!==depthVal)
throw new jsts.error.TopologyError('assigned depths do not match',this.getCoordinate());}
this.depth[position]=depthVal;};jsts.geomgraph.DirectedEdge.prototype.getDepthDelta=function(){var depthDelta=this.edge.getDepthDelta();if(!this._isForward)
depthDelta=-depthDelta;return depthDelta;};jsts.geomgraph.DirectedEdge.prototype.setVisitedEdge=function(isVisited){this.setVisited(isVisited);this.sym.setVisited(isVisited);};jsts.geomgraph.DirectedEdge.prototype.getSym=function(){return this.sym;};jsts.geomgraph.DirectedEdge.prototype.isForward=function(){return this._isForward;};jsts.geomgraph.DirectedEdge.prototype.setSym=function(de){this.sym=de;};jsts.geomgraph.DirectedEdge.prototype.getNext=function(){return this.next;};jsts.geomgraph.DirectedEdge.prototype.setNext=function(next){this.next=next;};jsts.geomgraph.DirectedEdge.prototype.getNextMin=function(){return this.nextMin;};jsts.geomgraph.DirectedEdge.prototype.setNextMin=function(nextMin){this.nextMin=nextMin;};jsts.geomgraph.DirectedEdge.prototype.isLineEdge=function(){var isLine=this.label.isLine(0)||this.label.isLine(1);var isExteriorIfArea0=!this.label.isArea(0)||this.label.allPositionsEqual(0,Location.EXTERIOR);var isExteriorIfArea1=!this.label.isArea(1)||this.label.allPositionsEqual(1,Location.EXTERIOR);return isLine&&isExteriorIfArea0&&isExteriorIfArea1;};jsts.geomgraph.DirectedEdge.prototype.isInteriorAreaEdge=function(){var isInteriorAreaEdge=true;for(var i=0;i<2;i++){if(!(this.label.isArea(i)&&this.label.getLocation(i,Position.LEFT)===Location.INTERIOR&&this.label.getLocation(i,Position.RIGHT)===Location.INTERIOR)){isInteriorAreaEdge=false;}}
return isInteriorAreaEdge;};jsts.geomgraph.DirectedEdge.prototype.computeDirectedLabel=function(){this.label=new jsts.geomgraph.Label(this.edge.getLabel());if(!this._isForward)
this.label.flip();};jsts.geomgraph.DirectedEdge.prototype.setEdgeDepths=function(position,depth){var depthDelta=this.getEdge().getDepthDelta();if(!this._isForward)
depthDelta=-depthDelta;var directionFactor=1;if(position===Position.LEFT)
directionFactor=-1;var oppositePos=Position.opposite(position);var delta=depthDelta*directionFactor;var oppositeDepth=depth+delta;this.setDepth(position,depth);this.setDepth(oppositePos,oppositeDepth);};})();jsts.operation.buffer.OffsetCurveBuilder=function(precisionModel,bufParams){this.precisionModel=precisionModel;this.bufParams=bufParams;};jsts.operation.buffer.OffsetCurveBuilder.prototype.distance=0.0;jsts.operation.buffer.OffsetCurveBuilder.prototype.precisionModel=null;jsts.operation.buffer.OffsetCurveBuilder.prototype.bufParams=null;jsts.operation.buffer.OffsetCurveBuilder.prototype.getBufferParameters=function(){return this.bufParams;};jsts.operation.buffer.OffsetCurveBuilder.prototype.getLineCurve=function(inputPts,distance){this.distance=distance;if(this.distance<0.0&&!this.bufParams.isSingleSided())
return null;if(this.distance==0.0)
return null;var posDistance=Math.abs(this.distance);var segGen=this.getSegGen(posDistance);if(inputPts.length<=1){this.computePointCurve(inputPts[0],segGen);}else{if(this.bufParams.isSingleSided()){var isRightSide=distance<0.0;this.computeSingleSidedBufferCurve(inputPts,isRightSide,segGen);}else
this.computeLineBufferCurve(inputPts,segGen);}
var lineCoord=segGen.getCoordinates();return lineCoord;};jsts.operation.buffer.OffsetCurveBuilder.prototype.getRingCurve=function(inputPts,side,distance){this.distance=distance;if(inputPts.length<=2)
return this.getLineCurve(inputPts,distance);if(this.distance==0.0){return jsts.operation.buffer.OffsetCurveBuilder.copyCoordinates(inputPts);}
var segGen=this.getSegGen(this.distance);this.computeRingBufferCurve(inputPts,side,segGen);return segGen.getCoordinates();};jsts.operation.buffer.OffsetCurveBuilder.prototype.getOffsetCurve=function(inputPts,distance){this.distance=distance;if(this.distance===0.0)
return null;var isRightSide=this.distance<0.0;var posDistance=Math.abs(this.distance);var segGen=this.getSegGen(posDistance);if(inputPts.length<=1){this.computePointCurve(inputPts[0],segGen);}else{this.computeOffsetCurve(inputPts,isRightSide,segGen);}
var curvePts=segGen.getCoordinates();if(isRightSide)
curvePts.reverse();return curvePts;};jsts.operation.buffer.OffsetCurveBuilder.copyCoordinates=function(pts){var copy=[];for(var i=0;i<pts.length;i++){copy.push(pts[i].clone());}
return copy;};jsts.operation.buffer.OffsetCurveBuilder.prototype.getSegGen=function(distance){return new jsts.operation.buffer.OffsetSegmentGenerator(this.precisionModel,this.bufParams,distance);};jsts.operation.buffer.OffsetCurveBuilder.SIMPLIFY_FACTOR=100.0;jsts.operation.buffer.OffsetCurveBuilder.simplifyTolerance=function(bufDistance){return bufDistance/jsts.operation.buffer.OffsetCurveBuilder.SIMPLIFY_FACTOR;};jsts.operation.buffer.OffsetCurveBuilder.prototype.computePointCurve=function(pt,segGen){switch(this.bufParams.getEndCapStyle()){case jsts.operation.buffer.BufferParameters.CAP_ROUND:segGen.createCircle(pt);break;case jsts.operation.buffer.BufferParameters.CAP_SQUARE:segGen.createSquare(pt);break;}};jsts.operation.buffer.OffsetCurveBuilder.prototype.computeLineBufferCurve=function(inputPts,segGen){var distTol=jsts.operation.buffer.OffsetCurveBuilder.simplifyTolerance(this.distance);var simp1=jsts.operation.buffer.BufferInputLineSimplifier.simplify(inputPts,distTol);var n1=simp1.length-1;segGen.initSideSegments(simp1[0],simp1[1],jsts.geomgraph.Position.LEFT);for(var i=2;i<=n1;i++){segGen.addNextSegment(simp1[i],true);}
segGen.addLastSegment();segGen.addLineEndCap(simp1[n1-1],simp1[n1]);var simp2=jsts.operation.buffer.BufferInputLineSimplifier.simplify(inputPts,-distTol);var n2=simp2.length-1;segGen.initSideSegments(simp2[n2],simp2[n2-1],jsts.geomgraph.Position.LEFT);for(var i=n2-2;i>=0;i--){segGen.addNextSegment(simp2[i],true);}
segGen.addLastSegment();segGen.addLineEndCap(simp2[1],simp2[0]);segGen.closeRing();};jsts.operation.buffer.OffsetCurveBuilder.prototype.computeSingleSidedBufferCurve=function(inputPts,isRightSide,segGen){var distTol=jsts.operation.buffer.OffsetCurveBuilder.simplifyTolerance(this.distance);if(isRightSide){segGen.addSegments(inputPts,true);var simp2=jsts.operation.buffer.BufferInputLineSimplifier.simplify(inputPts,-distTol);var n2=simp2.length-1;segGen.initSideSegments(simp2[n2],simp2[n2-1],jsts.geomgraph.Position.LEFT);segGen.addFirstSegment();for(var i=n2-2;i>=0;i--){segGen.addNextSegment(simp2[i],true);}}else{segGen.addSegments(inputPts,false);var simp1=jsts.operation.buffer.BufferInputLineSimplifier.simplify(inputPts,distTol);var n1=simp1.length-1;segGen.initSideSegments(simp1[0],simp1[1],jsts.geomgraph.Position.LEFT);segGen.addFirstSegment();for(var i=2;i<=n1;i++){segGen.addNextSegment(simp1[i],true);}}
segGen.addLastSegment();segGen.closeRing();};jsts.operation.buffer.OffsetCurveBuilder.prototype.computeOffsetCurve=function(inputPts,isRightSide,segGen){var distTol=jsts.operation.buffer.OffsetCurveBuilder.simplifyTolerance(this.distance);if(isRightSide){var simp2=jsts.operation.buffer.BufferInputLineSimplifier.simplify(inputPts,-distTol);var n2=simp2.length-1;segGen.initSideSegments(simp2[n2],simp2[n2-1],jsts.geomgraph.Position.LEFT);segGen.addFirstSegment();for(var i=n2-2;i>=0;i--){segGen.addNextSegment(simp2[i],true);}}else{var simp1=jsts.operation.buffer.BufferInputLineSimplifier.simplify(inputPts,distTol);var n1=simp1.length-1;segGen.initSideSegments(simp1[0],simp1[1],jsts.geomgraph.Position.LEFT);segGen.addFirstSegment();for(var i=2;i<=n1;i++){segGen.addNextSegment(simp1[i],true);}}
segGen.addLastSegment();};jsts.operation.buffer.OffsetCurveBuilder.prototype.computeRingBufferCurve=function(inputPts,side,segGen){var distTol=jsts.operation.buffer.OffsetCurveBuilder.simplifyTolerance(this.distance);if(side===jsts.geomgraph.Position.RIGHT)
distTol=-distTol;var simp=jsts.operation.buffer.BufferInputLineSimplifier.simplify(inputPts,distTol);var n=simp.length-1;segGen.initSideSegments(simp[n-1],simp[0],side);for(var i=1;i<=n;i++){var addStartPoint=i!==1;segGen.addNextSegment(simp[i],addStartPoint);}
segGen.closeRing();};jsts.index.strtree.SIRtree=function(nodeCapacity){nodeCapacity=nodeCapacity||10;jsts.index.strtree.AbstractSTRtree.call(this,nodeCapacity);};jsts.index.strtree.SIRtree.prototype=new jsts.index.strtree.AbstractSTRtree();jsts.index.strtree.SIRtree.constructor=jsts.index.strtree.SIRtree;jsts.index.strtree.SIRtree.prototype.comperator={compare:function(o1,o2){return o1.getBounds().getCentre()-o2.getBounds().getCentre();}};jsts.index.strtree.SIRtree.prototype.intersectionOp={intersects:function(aBounds,bBounds){return aBounds.intersects(bBounds);}};jsts.index.strtree.SIRtree.prototype.createNode=function(level){var AbstractNode=function(level){jsts.index.strtree.AbstractNode.apply(this,arguments);};AbstractNode.prototype=new jsts.index.strtree.AbstractNode();AbstractNode.constructor=AbstractNode;AbstractNode.prototype.computeBounds=function(){var bounds=null,childBoundables=this.getChildBoundables(),childBoundable;for(var i=0,l=childBoundables.length;i<l;i++){childBoundable=childBoundables[i];if(bounds===null){bounds=new jsts.index.strtree.Interval(childBoundable.getBounds());}
else{bounds.expandToInclude(childBoundable.getBounds());}}
return bounds;};return AbstractNode;};jsts.index.strtree.SIRtree.prototype.insert=function(x1,x2,item){jsts.index.strtree.AbstractSTRtree.prototype.insert(new jsts.index.strtree.Interval(Math.min(x1,x2),Math.max(x1,x2)),item);};jsts.index.strtree.SIRtree.prototype.query=function(x1,x2){x2=x2||x1;jsts.index.strtree.AbstractSTRtree.prototype.query(new jsts.index.strtree.Interval(Math.min(x1,x2),Math.max(x1,x2)));};jsts.index.strtree.SIRtree.prototype.getIntersectsOp=function(){return this.intersectionOp;};jsts.index.strtree.SIRtree.prototype.getComparator=function(){return this.comperator;};(function(){var Location=jsts.geom.Location;jsts.operation.relate.RelateNodeGraph=function(){this.nodes=new jsts.geomgraph.NodeMap(new jsts.operation.relate.RelateNodeFactory());};jsts.operation.relate.RelateNodeGraph.prototype.nodes=null;jsts.operation.relate.RelateNodeGraph.prototype.build=function(geomGraph){this.computeIntersectionNodes(geomGraph,0);this.copyNodesAndLabels(geomGraph,0);var eeBuilder=new jsts.operation.relate.EdgeEndBuilder();var eeList=eeBuilder.computeEdgeEnds(geomGraph.getEdgeIterator());this.insertEdgeEnds(eeList);};jsts.operation.relate.RelateNodeGraph.prototype.computeIntersectionNodes=function(geomGraph,argIndex){for(var edgeIt=geomGraph.getEdgeIterator();edgeIt.hasNext();){var e=edgeIt.next();var eLoc=e.getLabel().getLocation(argIndex);for(var eiIt=e.getEdgeIntersectionList().iterator();eiIt.hasNext();){var ei=eiIt.next();var n=this.nodes.addNode(ei.coord);if(eLoc===Location.BOUNDARY)
n.setLabelBoundary(argIndex);else{if(n.getLabel().isNull(argIndex))
n.setLabel(argIndex,Location.INTERIOR);}}}};jsts.operation.relate.RelateNodeGraph.prototype.copyNodesAndLabels=function(geomGraph,argIndex){for(var nodeIt=geomGraph.getNodeIterator();nodeIt.hasNext();){var graphNode=nodeIt.next();var newNode=this.nodes.addNode(graphNode.getCoordinate());newNode.setLabel(argIndex,graphNode.getLabel().getLocation(argIndex));}};jsts.operation.relate.RelateNodeGraph.prototype.insertEdgeEnds=function(ee){for(var i=ee.iterator();i.hasNext();){var e=i.next();this.nodes.add(e);}};jsts.operation.relate.RelateNodeGraph.prototype.getNodeIterator=function(){return this.nodes.iterator();};})();(function(){var Location=jsts.geom.Location;var Position=jsts.geomgraph.Position;jsts.geomgraph.Depth=function(){this.depth=[[],[]];for(var i=0;i<2;i++){for(var j=0;j<3;j++){this.depth[i][j]=jsts.geomgraph.Depth.NULL_VALUE;}}};jsts.geomgraph.Depth.NULL_VALUE=-1;jsts.geomgraph.Depth.depthAtLocation=function(location){if(location===Location.EXTERIOR)
return 0;if(location===Location.INTERIOR)
return 1;return jsts.geomgraph.Depth.NULL_VALUE;};jsts.geomgraph.Depth.prototype.depth=null;jsts.geomgraph.Depth.prototype.getDepth=function(geomIndex,posIndex){return this.depth[geomIndex][posIndex];};jsts.geomgraph.Depth.prototype.setDepth=function(geomIndex,posIndex,depthValue){this.depth[geomIndex][posIndex]=depthValue;};jsts.geomgraph.Depth.prototype.getLocation=function(geomIndex,posIndex){if(this.depth[geomIndex][posIndex]<=0)
return Location.EXTERIOR;return Location.INTERIOR;};jsts.geomgraph.Depth.prototype.add=function(geomIndex,posIndex,location){if(location===Location.INTERIOR)
this.depth[geomIndex][posIndex]++;};jsts.geomgraph.Depth.prototype.isNull=function(){if(arguments.length>0){return this.isNull2.apply(this,arguments);}
for(var i=0;i<2;i++){for(var j=0;j<3;j++){if(this.depth[i][j]!==jsts.geomgraph.Depth.NULL_VALUE)
return false;}}
return true;};jsts.geomgraph.Depth.prototype.isNull2=function(geomIndex){if(arguments.length>1){return this.isNull3.apply(this,arguments);}
return this.depth[geomIndex][1]==jsts.geomgraph.Depth.NULL_VALUE;};jsts.geomgraph.Depth.prototype.isNull3=function(geomIndex,posIndex){return this.depth[geomIndex][posIndex]==jsts.geomgraph.Depth.NULL_VALUE;};jsts.geomgraph.Depth.prototype.add=function(lbl){for(var i=0;i<2;i++){for(var j=1;j<3;j++){var loc=lbl.getLocation(i,j);if(loc===Location.EXTERIOR||loc===Location.INTERIOR){if(this.isNull(i,j)){this.depth[i][j]=jsts.geomgraph.Depth.depthAtLocation(loc);}else
this.depth[i][j]+=jsts.geomgraph.Depth.depthAtLocation(loc);}}}};jsts.geomgraph.Depth.prototype.getDelta=function(geomIndex){return this.depth[geomIndex][Position.RIGHT]-
this.depth[geomIndex][Position.LEFT];};jsts.geomgraph.Depth.prototype.normalize=function(){for(var i=0;i<2;i++){if(!this.isNull(i)){var minDepth=this.depth[i][1];if(this.depth[i][2]<minDepth)
minDepth=this.depth[i][2];if(minDepth<0)
minDepth=0;for(var j=1;j<3;j++){var newValue=0;if(this.depth[i][j]>minDepth)
newValue=1;this.depth[i][j]=newValue;}}}};jsts.geomgraph.Depth.prototype.toString=function(){return'A: '+this.depth[0][1]+','+this.depth[0][2]+' B: '+
this.depth[1][1]+','+this.depth[1][2];};})();jsts.operation.buffer.BufferParameters=function(quadrantSegments,endCapStyle,joinStyle,mitreLimit){if(quadrantSegments)
this.setQuadrantSegments(quadrantSegments);if(endCapStyle)
this.setEndCapStyle(endCapStyle);if(joinStyle)
this.setJoinStyle(joinStyle);if(mitreLimit)
this.setMitreLimit(mitreLimit);};jsts.operation.buffer.BufferParameters.CAP_ROUND=1;jsts.operation.buffer.BufferParameters.CAP_FLAT=2;jsts.operation.buffer.BufferParameters.CAP_SQUARE=3;jsts.operation.buffer.BufferParameters.JOIN_ROUND=1;jsts.operation.buffer.BufferParameters.JOIN_MITRE=2;jsts.operation.buffer.BufferParameters.JOIN_BEVEL=3;jsts.operation.buffer.BufferParameters.DEFAULT_QUADRANT_SEGMENTS=8;jsts.operation.buffer.BufferParameters.DEFAULT_MITRE_LIMIT=5.0;jsts.operation.buffer.BufferParameters.prototype.quadrantSegments=jsts.operation.buffer.BufferParameters.DEFAULT_QUADRANT_SEGMENTS;jsts.operation.buffer.BufferParameters.prototype.endCapStyle=jsts.operation.buffer.BufferParameters.CAP_ROUND;jsts.operation.buffer.BufferParameters.prototype.joinStyle=jsts.operation.buffer.BufferParameters.JOIN_ROUND;jsts.operation.buffer.BufferParameters.prototype.mitreLimit=jsts.operation.buffer.BufferParameters.DEFAULT_MITRE_LIMIT;jsts.operation.buffer.BufferParameters.prototype._isSingleSided=false;jsts.operation.buffer.BufferParameters.prototype.getQuadrantSegments=function(){return this.quadrantSegments;};jsts.operation.buffer.BufferParameters.prototype.setQuadrantSegments=function(quadrantSegments){this.quadrantSegments=quadrantSegments;};jsts.operation.buffer.BufferParameters.prototype.setQuadrantSegments=function(quadSegs){this.quadrantSegments=quadSegs;if(this.quadrantSegments===0)
this.joinStyle=jsts.operation.buffer.BufferParameters.JOIN_BEVEL;if(this.quadrantSegments<0){this.joinStyle=jsts.operation.buffer.BufferParameters.JOIN_MITRE;this.mitreLimit=Math.abs(this.quadrantSegments);}
if(quadSegs<=0){this.quadrantSegments=1;}
if(this.joinStyle!==jsts.operation.buffer.BufferParameters.JOIN_ROUND){this.quadrantSegments=jsts.operation.buffer.BufferParameters.DEFAULT_QUADRANT_SEGMENTS;}};jsts.operation.buffer.BufferParameters.bufferDistanceError=function(quadSegs){var alpha=Math.PI/2.0/quadSegs;return 1-Math.cos(alpha/2.0);};jsts.operation.buffer.BufferParameters.prototype.getEndCapStyle=function(){return this.endCapStyle;};jsts.operation.buffer.BufferParameters.prototype.setEndCapStyle=function(endCapStyle){this.endCapStyle=endCapStyle;};jsts.operation.buffer.BufferParameters.prototype.getJoinStyle=function(){return this.joinStyle;};jsts.operation.buffer.BufferParameters.prototype.setJoinStyle=function(joinStyle){this.joinStyle=joinStyle;};jsts.operation.buffer.BufferParameters.prototype.getMitreLimit=function(){return this.mitreLimit;};jsts.operation.buffer.BufferParameters.prototype.setMitreLimit=function(mitreLimit){this.mitreLimit=mitreLimit;};jsts.operation.buffer.BufferParameters.prototype.setSingleSided=function(isSingleSided){this._isSingleSided=isSingleSided;};jsts.operation.buffer.BufferParameters.prototype.isSingleSided=function(){return this._isSingleSided;};jsts.algorithm.distance.PointPairDistance=function(){this.pt=[new jsts.geom.Coordinate(),new jsts.geom.Coordinate()];};jsts.algorithm.distance.PointPairDistance.prototype.pt=null;jsts.algorithm.distance.PointPairDistance.prototype.distance=NaN;jsts.algorithm.distance.PointPairDistance.prototype.isNull=true;jsts.algorithm.distance.PointPairDistance.prototype.initialize=function(p0,p1,distance){if(p0===undefined){this.isNull=true;return;}
this.pt[0].setCoordinate(p0);this.pt[1].setCoordinate(p1);this.distance=distance!==undefined?distance:p0.distance(p1);this.isNull=false;};jsts.algorithm.distance.PointPairDistance.prototype.getDistance=function(){return this.distance;};jsts.algorithm.distance.PointPairDistance.prototype.getCoordinates=function(){return this.pt;};jsts.algorithm.distance.PointPairDistance.prototype.getCoordinate=function(i){return this.pt[i];};jsts.algorithm.distance.PointPairDistance.prototype.setMaximum=function(ptDist){if(arguments.length===2){this.setMaximum2.apply(this,arguments);return;}
this.setMaximum(ptDist.pt[0],ptDist.pt[1]);};jsts.algorithm.distance.PointPairDistance.prototype.setMaximum2=function(p0,p1){if(this.isNull){this.initialize(p0,p1);return;}
var dist=p0.distance(p1);if(dist>this.distance)
this.initialize(p0,p1,dist);};jsts.algorithm.distance.PointPairDistance.prototype.setMinimum=function(ptDist){if(arguments.length===2){this.setMinimum2.apply(this,arguments);return;}
this.setMinimum(ptDist.pt[0],ptDist.pt[1]);};jsts.algorithm.distance.PointPairDistance.prototype.setMinimum2=function(p0,p1){if(this.isNull){this.initialize(p0,p1);return;}
var dist=p0.distance(p1);if(dist<this.distance)
this.initialize(p0,p1,dist);};(function(){var PointPairDistance=jsts.algorithm.distance.PointPairDistance;var DistanceToPoint=jsts.algorithm.distance.DistanceToPoint;var MaxPointDistanceFilter=function(geom){this.maxPtDist=new PointPairDistance();this.minPtDist=new PointPairDistance();this.euclideanDist=new DistanceToPoint();this.geom=geom;};MaxPointDistanceFilter.prototype=new jsts.geom.CoordinateFilter();MaxPointDistanceFilter.prototype.maxPtDist=new PointPairDistance();MaxPointDistanceFilter.prototype.minPtDist=new PointPairDistance();MaxPointDistanceFilter.prototype.euclideanDist=new DistanceToPoint();MaxPointDistanceFilter.prototype.geom;MaxPointDistanceFilter.prototype.filter=function(pt){this.minPtDist.initialize();DistanceToPoint.computeDistance(this.geom,pt,this.minPtDist);this.maxPtDist.setMaximum(this.minPtDist);};MaxPointDistanceFilter.prototype.getMaxPointDistance=function(){return this.maxPtDist;};var MaxDensifiedByFractionDistanceFilter=function(geom,fraction){this.maxPtDist=new PointPairDistance();this.minPtDist=new PointPairDistance();this.geom=geom;this.numSubSegs=Math.round(1.0/fraction);};MaxDensifiedByFractionDistanceFilter.prototype=new jsts.geom.CoordinateSequenceFilter();MaxDensifiedByFractionDistanceFilter.prototype.maxPtDist=new PointPairDistance();MaxDensifiedByFractionDistanceFilter.prototype.minPtDist=new PointPairDistance();MaxDensifiedByFractionDistanceFilter.prototype.geom;MaxDensifiedByFractionDistanceFilter.prototype.numSubSegs=0;MaxDensifiedByFractionDistanceFilter.prototype.filter=function(seq,index){if(index==0)
return;var p0=seq[index-1];var p1=seq[index];var delx=(p1.x-p0.x)/this.numSubSegs;var dely=(p1.y-p0.y)/this.numSubSegs;for(var i=0;i<this.numSubSegs;i++){var x=p0.x+i*delx;var y=p0.y+i*dely;var pt=new jsts.geom.Coordinate(x,y);this.minPtDist.initialize();DistanceToPoint.computeDistance(this.geom,pt,this.minPtDist);this.maxPtDist.setMaximum(this.minPtDist);}};MaxDensifiedByFractionDistanceFilter.prototype.isGeometryChanged=function(){return false;};MaxDensifiedByFractionDistanceFilter.prototype.isDone=function(){return false;};MaxDensifiedByFractionDistanceFilter.prototype.getMaxPointDistance=function(){return this.maxPtDist;};jsts.algorithm.distance.DiscreteHausdorffDistance=function(g0,g1){this.g0=g0;this.g1=g1;this.ptDist=new jsts.algorithm.distance.PointPairDistance();};jsts.algorithm.distance.DiscreteHausdorffDistance.prototype.g0=null;jsts.algorithm.distance.DiscreteHausdorffDistance.prototype.g1=null;jsts.algorithm.distance.DiscreteHausdorffDistance.prototype.ptDist=null;jsts.algorithm.distance.DiscreteHausdorffDistance.prototype.densifyFrac=0.0;jsts.algorithm.distance.DiscreteHausdorffDistance.distance=function(g0,g1,densifyFrac){var dist=new jsts.algorithm.distance.DiscreteHausdorffDistance(g0,g1);if(densifyFrac!==undefined)
dist.setDensifyFraction(densifyFrac);return dist.distance();};jsts.algorithm.distance.DiscreteHausdorffDistance.prototype.setDensifyFraction=function(densifyFrac){if(densifyFrac>1.0||densifyFrac<=0.0)
throw new jsts.error.IllegalArgumentError('Fraction is not in range (0.0 - 1.0]');this.densifyFrac=densifyFrac;};jsts.algorithm.distance.DiscreteHausdorffDistance.prototype.distance=function(){this.compute(this.g0,this.g1);return ptDist.getDistance();};jsts.algorithm.distance.DiscreteHausdorffDistance.prototype.orientedDistance=function(){this.computeOrientedDistance(this.g0,this.g1,this.ptDist);return this.ptDist.getDistance();};jsts.algorithm.distance.DiscreteHausdorffDistance.prototype.getCoordinates=function(){return ptDist.getCoordinates();};jsts.algorithm.distance.DiscreteHausdorffDistance.prototype.compute=function(g0,g1){this.computeOrientedDistance(g0,g1,this.ptDist);this.computeOrientedDistance(g1,g0,this.ptDist);};jsts.algorithm.distance.DiscreteHausdorffDistance.prototype.computeOrientedDistance=function(discreteGeom,geom,ptDist){var distFilter=new MaxPointDistanceFilter(geom);discreteGeom.apply(distFilter);ptDist.setMaximum(distFilter.getMaxPointDistance());if(this.densifyFrac>0){var fracFilter=new MaxDensifiedByFractionDistanceFilter(geom,this.densifyFrac);discreteGeom.apply(fracFilter);ptDist.setMaximum(fracFilter.getMaxPointDistance());}};})();jsts.operation.distance.GeometryLocation=function(component,segIndex,pt){this.component=component;this.segIndex=segIndex;this.pt=pt;};jsts.operation.distance.GeometryLocation.INSIDE_AREA=-1;jsts.operation.distance.GeometryLocation.prototype.component=null;jsts.operation.distance.GeometryLocation.prototype.segIndex=null;jsts.operation.distance.GeometryLocation.prototype.pt=null;jsts.operation.distance.GeometryLocation.prototype.getGeometryComponent=function(){return this.component;};jsts.operation.distance.GeometryLocation.prototype.getSegmentIndex=function(){return this.segIndex;};jsts.operation.distance.GeometryLocation.prototype.getCoordinate=function(){return this.pt;};jsts.operation.distance.GeometryLocation.prototype.isInsideArea=function(){return this.segIndex===jsts.operation.distance.GeometryLocation.INSIDE_AREA;};jsts.geom.util.PointExtracter=function(pts){this.pts=pts;};jsts.geom.util.PointExtracter.prototype=new jsts.geom.GeometryFilter();jsts.geom.util.PointExtracter.prototype.pts=null;jsts.geom.util.PointExtracter.getPoints=function(geom,list){if(list===undefined){list=[];}
if(geom instanceof jsts.geom.Point){list.push(geom);}else if(geom instanceof jsts.geom.GeometryCollection||geom instanceof jsts.geom.MultiPoint||geom instanceof jsts.geom.MultiLineString||geom instanceof jsts.geom.MultiPolygon){geom.apply(new jsts.geom.util.PointExtracter(list));}
return list;};jsts.geom.util.PointExtracter.prototype.filter=function(geom){if(geom instanceof jsts.geom.Point)
this.pts.push(geom);};jsts.noding.ScaledNoder=function(noder,scaleFactor,offsetX,offsetY){this.offsetX=offsetX?offsetX:0;this.offsetY=offsetY?offsetY:0;this.noder=noder;this.scaleFactor=scaleFactor;this.isScaled=!this.isIntegerPrecision();};jsts.noding.ScaledNoder.prototype=new jsts.noding.Noder();jsts.noding.ScaledNoder.constructor=jsts.noding.ScaledNoder;jsts.noding.ScaledNoder.prototype.noder=null;jsts.noding.ScaledNoder.prototype.scaleFactor=undefined;jsts.noding.ScaledNoder.prototype.offsetX=undefined;jsts.noding.ScaledNoder.prototype.offsetY=undefined;jsts.noding.ScaledNoder.prototype.isScaled=false;jsts.noding.ScaledNoder.prototype.isIntegerPrecision=function(){return this.scaleFactor===1.0;};jsts.noding.ScaledNoder.prototype.getNodedSubstrings=function(){var splitSS=this.noder.getNodedSubstrings();if(this.isScaled)
this.rescale(splitSS);return splitSS;};jsts.noding.ScaledNoder.prototype.computeNodes=function(inputSegStrings){var intSegStrings=inputSegStrings;if(this.isScaled)
intSegStrings=this.scale(inputSegStrings);this.noder.computeNodes(intSegStrings);};jsts.noding.ScaledNoder.prototype.scale=function(segStrings){if(segStrings instanceof Array){return this.scale2(segStrings);}
var transformed=new javascript.util.ArrayList();for(var i=segStrings.iterator();i.hasNext();){var ss=i.next();transformed.add(new jsts.noding.NodedSegmentString(this.scale(ss.getCoordinates()),ss.getData()));}
return transformed;};jsts.noding.ScaledNoder.prototype.scale2=function(pts){var roundPts=[];for(var i=0;i<pts.length;i++){roundPts[i]=new jsts.geom.Coordinate(Math.round((pts[i].x-this.offsetX)*this.scaleFactor),Math.round((pts[i].y-this.offsetY)*this.scaleFactor));}
var roundPtsNoDup=jsts.geom.CoordinateArrays.removeRepeatedPoints(roundPts);return roundPtsNoDup;};jsts.noding.ScaledNoder.prototype.rescale=function(segStrings){if(segStrings instanceof Array){this.rescale2(segStrings);return;}
for(var i=segStrings.iterator();i.hasNext();){var ss=i.next();this.rescale(ss.getCoordinates());}};jsts.noding.ScaledNoder.prototype.rescale2=function(pts){for(var i=0;i<pts.length;i++){pts[i].x=pts[i].x/this.scaleFactor+this.offsetX;pts[i].y=pts[i].y/this.scaleFactor+this.offsetY;}};jsts.noding.IntersectionAdder=function(li){this.li=li;};jsts.noding.IntersectionAdder.prototype=new jsts.noding.SegmentIntersector();jsts.noding.IntersectionAdder.constructor=jsts.noding.IntersectionAdder;jsts.noding.IntersectionAdder.isAdjacentSegments=function(i1,i2){return Math.abs(i1-i2)===1;};jsts.noding.IntersectionAdder.prototype._hasIntersection=false;jsts.noding.IntersectionAdder.prototype.hasProper=false;jsts.noding.IntersectionAdder.prototype.hasProperInterior=false;jsts.noding.IntersectionAdder.prototype.hasInterior=false;jsts.noding.IntersectionAdder.prototype.properIntersectionPoint=null;jsts.noding.IntersectionAdder.prototype.li=null;jsts.noding.IntersectionAdder.prototype.isSelfIntersection=null;jsts.noding.IntersectionAdder.prototype.numIntersections=0;jsts.noding.IntersectionAdder.prototype.numInteriorIntersections=0;jsts.noding.IntersectionAdder.prototype.numProperIntersections=0;jsts.noding.IntersectionAdder.prototype.numTests=0;jsts.noding.IntersectionAdder.prototype.getLineIntersector=function(){return this.li;};jsts.noding.IntersectionAdder.prototype.getProperIntersectionPoint=function(){return this.properIntersectionPoint;};jsts.noding.IntersectionAdder.prototype.hasIntersection=function(){return this._hasIntersection;};jsts.noding.IntersectionAdder.prototype.hasProperIntersection=function(){return this.hasProper;};jsts.noding.IntersectionAdder.prototype.hasProperInteriorIntersection=function(){return this.hasProperInterior;};jsts.noding.IntersectionAdder.prototype.hasInteriorIntersection=function(){return this.hasInterior;};jsts.noding.IntersectionAdder.prototype.isTrivialIntersection=function(e0,segIndex0,e1,segIndex1){if(e0==e1){if(this.li.getIntersectionNum()==1){if(jsts.noding.IntersectionAdder.isAdjacentSegments(segIndex0,segIndex1))
return true;if(e0.isClosed()){var maxSegIndex=e0.size()-1;if((segIndex0===0&&segIndex1===maxSegIndex)||(segIndex1===0&&segIndex0===maxSegIndex)){return true;}}}}
return false;};jsts.noding.IntersectionAdder.prototype.processIntersections=function(e0,segIndex0,e1,segIndex1){if(e0===e1&&segIndex0===segIndex1)
return;this.numTests++;var p00=e0.getCoordinates()[segIndex0];var p01=e0.getCoordinates()[segIndex0+1];var p10=e1.getCoordinates()[segIndex1];var p11=e1.getCoordinates()[segIndex1+1];this.li.computeIntersection(p00,p01,p10,p11);if(this.li.hasIntersection()){this.numIntersections++;if(this.li.isInteriorIntersection()){this.numInteriorIntersections++;this.hasInterior=true;}
if(!this.isTrivialIntersection(e0,segIndex0,e1,segIndex1)){this._hasIntersection=true;e0.addIntersections(this.li,segIndex0,0);e1.addIntersections(this.li,segIndex1,1);if(this.li.isProper()){this.numProperIntersections++;this.hasProper=true;this.hasProperInterior=true;}}}};jsts.noding.IntersectionAdder.prototype.isDone=function(){return false;};jsts.triangulate.VoronoiDiagramBuilder=function(){this.siteCoords=null;this.tolerance=0.0;this.subdiv=null;this.clipEnv=null;this.diagramEnv=null;};jsts.triangulate.VoronoiDiagramBuilder.prototype.setSites=function(){var arg=arguments[0];if(arg instanceof jsts.geom.Geometry||arg instanceof jsts.geom.Coordinate||arg instanceof jsts.geom.Point||arg instanceof jsts.geom.MultiPoint||arg instanceof jsts.geom.LineString||arg instanceof jsts.geom.MultiLineString||arg instanceof jsts.geom.LinearRing||arg instanceof jsts.geom.Polygon||arg instanceof jsts.geom.MultiPolygon){this.setSitesByGeometry(arg);}else{this.setSitesByArray(arg);}};jsts.triangulate.VoronoiDiagramBuilder.prototype.setSitesByGeometry=function(geom){this.siteCoords=jsts.triangulate.DelaunayTriangulationBuilder.extractUniqueCoordinates(geom);};jsts.triangulate.VoronoiDiagramBuilder.prototype.setSitesByArray=function(coords){this.siteCoords=jsts.triangulate.DelaunayTriangulationBuilder.unique(coords);};jsts.triangulate.VoronoiDiagramBuilder.prototype.setClipEnvelope=function(clipEnv){this.clipEnv=clipEnv;};jsts.triangulate.VoronoiDiagramBuilder.prototype.setTolerance=function(tolerance)
{this.tolerance=tolerance;};jsts.triangulate.VoronoiDiagramBuilder.prototype.create=function(){if(this.subdiv!==null){return;}
var siteEnv,expandBy,vertices,triangulator;siteEnv=jsts.triangulate.DelaunayTriangulationBuilder.envelope(this.siteCoords);this.diagramEnv=siteEnv;expandBy=Math.max(this.diagramEnv.getWidth(),this.diagramEnv.getHeight());this.diagramEnv.expandBy(expandBy);if(this.clipEnv!==null){this.diagramEnv.expandToInclude(this.clipEnv);}
vertices=jsts.triangulate.DelaunayTriangulationBuilder.toVertices(this.siteCoords);this.subdiv=new jsts.triangulate.quadedge.QuadEdgeSubdivision(siteEnv,this.tolerance);triangulator=new jsts.triangulate.IncrementalDelaunayTriangulator(this.subdiv);triangulator.insertSites(vertices);};jsts.triangulate.VoronoiDiagramBuilder.prototype.getSubdivision=function(){this.create();return this.subdiv;};jsts.triangulate.VoronoiDiagramBuilder.prototype.getDiagram=function(geomFact){this.create();var polys=this.subdiv.getVoronoiDiagram(geomFact);return this.clipGeometryCollection(polys,this.diagramEnv);};jsts.triangulate.VoronoiDiagramBuilder.prototype.clipGeometryCollection=function(geom,clipEnv){var clipPoly,clipped,i,il,g,result;clipPoly=geom.getFactory().toGeometry(clipEnv);clipped=[];i=0,il=geom.getNumGeometries();for(i;i<il;i++){g=geom.getGeometryN(i);result=null;if(clipEnv.contains(g.getEnvelopeInternal())){result=g;}
else if(clipEnv.intersects(g.getEnvelopeInternal())){result=clipPoly.intersection(g);}
if(result!==null&&!result.isEmpty()){clipped.push(result);}}
return geom.getFactory().createGeometryCollection(clipped);};jsts.operation.valid.IndexedNestedRingTester=function(graph){this.graph=graph;this.rings=new javascript.util.ArrayList();this.totalEnv=new jsts.geom.Envelope();this.index=null;this.nestedPt=null;};jsts.operation.valid.IndexedNestedRingTester.prototype.getNestedPoint=function(){return this.nestedPt;};jsts.operation.valid.IndexedNestedRingTester.prototype.add=function(ring){this.rings.add(ring);this.totalEnv.expandToInclude(ring.getEnvelopeInternal());};jsts.operation.valid.IndexedNestedRingTester.prototype.isNonNested=function(){this.buildIndex();for(var i=0;i<this.rings.size();i++){var innerRing=this.rings.get(i);var innerRingPts=innerRing.getCoordinates();var results=this.index.query(innerRing.getEnvelopeInternal());for(var j=0;j<results.length;j++){var searchRing=results[j];var searchRingPts=searchRing.getCoordinates();if(innerRing==searchRing){continue;}
if(!innerRing.getEnvelopeInternal().intersects(searchRing.getEnvelopeInternal())){continue;}
var innerRingPt=jsts.operation.valid.IsValidOp.findPtNotNode(innerRingPts,searchRing,this.graph);if(innerRingPt==null){continue;}
var isInside=jsts.algorithm.CGAlgorithms.isPointInRing(innerRingPt,searchRingPts);if(isInside){this.nestedPt=innerRingPt;return false;}}}
return true;};jsts.operation.valid.IndexedNestedRingTester.prototype.buildIndex=function(){this.index=new jsts.index.strtree.STRtree();for(var i=0;i<this.rings.size();i++){var ring=this.rings.get(i);var env=ring.getEnvelopeInternal();this.index.insert(env,ring);}};jsts.noding.SegmentNode=function(segString,coord,segmentIndex,segmentOctant){this.segString=segString;this.coord=new jsts.geom.Coordinate(coord);this.segmentIndex=segmentIndex;this.segmentOctant=segmentOctant;this._isInterior=!coord.equals2D(segString.getCoordinate(segmentIndex));};jsts.noding.SegmentNode.prototype.segString=null;jsts.noding.SegmentNode.prototype.coord=null;jsts.noding.SegmentNode.prototype.segmentIndex=null;jsts.noding.SegmentNode.prototype.segmentOctant=null;jsts.noding.SegmentNode.prototype._isInterior=null;jsts.noding.SegmentNode.prototype.getCoordinate=function(){return this.coord;};jsts.noding.SegmentNode.prototype.isInterior=function(){return this._isInterior;};jsts.noding.SegmentNode.prototype.isEndPoint=function(maxSegmentIndex){if(this.segmentIndex===0&&!this._isInterior)return true;if(this.segmentIndex===this.maxSegmentIndex)return true;return false;};jsts.noding.SegmentNode.prototype.compareTo=function(obj){var other=obj;if(this.segmentIndex<other.segmentIndex)return-1;if(this.segmentIndex>other.segmentIndex)return 1;if(this.coord.equals2D(other.coord))return 0;return jsts.noding.SegmentPointComparator.compare(this.segmentOctant,this.coord,other.coord);};(function(){jsts.io.GeoJSONWriter=function(){this.parser=new jsts.io.GeoJSONParser(this.geometryFactory);};jsts.io.GeoJSONWriter.prototype.write=function(geometry){var geoJson=this.parser.write(geometry);return geoJson;};})();jsts.io.OpenLayersParser=function(geometryFactory){this.geometryFactory=geometryFactory||new jsts.geom.GeometryFactory();};jsts.io.OpenLayersParser.prototype.read=function(geometry){if(geometry.CLASS_NAME==='OpenLayers.Geometry.Point'){return this.convertFromPoint(geometry);}else if(geometry.CLASS_NAME==='OpenLayers.Geometry.LineString'){return this.convertFromLineString(geometry);}else if(geometry.CLASS_NAME==='OpenLayers.Geometry.LinearRing'){return this.convertFromLinearRing(geometry);}else if(geometry.CLASS_NAME==='OpenLayers.Geometry.Polygon'){return this.convertFromPolygon(geometry);}else if(geometry.CLASS_NAME==='OpenLayers.Geometry.MultiPoint'){return this.convertFromMultiPoint(geometry);}else if(geometry.CLASS_NAME==='OpenLayers.Geometry.MultiLineString'){return this.convertFromMultiLineString(geometry);}else if(geometry.CLASS_NAME==='OpenLayers.Geometry.MultiPolygon'){return this.convertFromMultiPolygon(geometry);}else if(geometry.CLASS_NAME==='OpenLayers.Geometry.Collection'){return this.convertFromCollection(geometry);}};jsts.io.OpenLayersParser.prototype.convertFromPoint=function(point){return this.geometryFactory.createPoint(new jsts.geom.Coordinate(point.x,point.y));};jsts.io.OpenLayersParser.prototype.convertFromLineString=function(lineString){var i;var coordinates=[];for(i=0;i<lineString.components.length;i++){coordinates.push(new jsts.geom.Coordinate(lineString.components[i].x,lineString.components[i].y));}
return this.geometryFactory.createLineString(coordinates);};jsts.io.OpenLayersParser.prototype.convertFromLinearRing=function(linearRing){var i;var coordinates=[];for(i=0;i<linearRing.components.length;i++){coordinates.push(new jsts.geom.Coordinate(linearRing.components[i].x,linearRing.components[i].y));}
return this.geometryFactory.createLinearRing(coordinates);};jsts.io.OpenLayersParser.prototype.convertFromPolygon=function(polygon){var i;var shell=null;var holes=[];for(i=0;i<polygon.components.length;i++){var linearRing=this.convertFromLinearRing(polygon.components[i]);if(i===0){shell=linearRing;}else{holes.push(linearRing);}}
return this.geometryFactory.createPolygon(shell,holes);};jsts.io.OpenLayersParser.prototype.convertFromMultiPoint=function(multiPoint){var i;var points=[];for(i=0;i<multiPoint.components.length;i++){points.push(this.convertFromPoint(multiPoint.components[i]));}
return this.geometryFactory.createMultiPoint(points);};jsts.io.OpenLayersParser.prototype.convertFromMultiLineString=function(multiLineString){var i;var lineStrings=[];for(i=0;i<multiLineString.components.length;i++){lineStrings.push(this.convertFromLineString(multiLineString.components[i]));}
return this.geometryFactory.createMultiLineString(lineStrings);};jsts.io.OpenLayersParser.prototype.convertFromMultiPolygon=function(multiPolygon){var i;var polygons=[];for(i=0;i<multiPolygon.components.length;i++){polygons.push(this.convertFromPolygon(multiPolygon.components[i]));}
return this.geometryFactory.createMultiPolygon(polygons);};jsts.io.OpenLayersParser.prototype.convertFromCollection=function(collection){var i;var geometries=[];for(i=0;i<collection.components.length;i++){geometries.push(this.convertFrom(collection.components[i]));}
return this.geometryFactory.createGeometryCollection(geometries);};jsts.io.OpenLayersParser.prototype.write=function(geometry){if(geometry.CLASS_NAME==='jsts.geom.Point'){return this.convertToPoint(geometry.coordinate);}else if(geometry.CLASS_NAME==='jsts.geom.LineString'){return this.convertToLineString(geometry);}else if(geometry.CLASS_NAME==='jsts.geom.LinearRing'){return this.convertToLinearRing(geometry);}else if(geometry.CLASS_NAME==='jsts.geom.Polygon'){return this.convertToPolygon(geometry);}else if(geometry.CLASS_NAME==='jsts.geom.MultiPoint'){return this.convertToMultiPoint(geometry);}else if(geometry.CLASS_NAME==='jsts.geom.MultiLineString'){return this.convertToMultiLineString(geometry);}else if(geometry.CLASS_NAME==='jsts.geom.MultiPolygon'){return this.convertToMultiPolygon(geometry);}else if(geometry.CLASS_NAME==='jsts.geom.GeometryCollection'){return this.convertToCollection(geometry);}};jsts.io.OpenLayersParser.prototype.convertToPoint=function(coordinate){return new OpenLayers.Geometry.Point(coordinate.x,coordinate.y);};jsts.io.OpenLayersParser.prototype.convertToLineString=function(lineString){var i;var points=[];for(i=0;i<lineString.points.length;i++){var coordinate=lineString.points[i];points.push(this.convertToPoint(coordinate));}
return new OpenLayers.Geometry.LineString(points);};jsts.io.OpenLayersParser.prototype.convertToLinearRing=function(linearRing){var i;var points=[];for(i=0;i<linearRing.points.length;i++){var coordinate=linearRing.points[i];points.push(this.convertToPoint(coordinate));}
return new OpenLayers.Geometry.LinearRing(points);};jsts.io.OpenLayersParser.prototype.convertToPolygon=function(polygon){var i;var rings=[];rings.push(this.convertToLinearRing(polygon.shell));for(i=0;i<polygon.holes.length;i++){var ring=polygon.holes[i];rings.push(this.convertToLinearRing(ring));}
return new OpenLayers.Geometry.Polygon(rings);};jsts.io.OpenLayersParser.prototype.convertToMultiPoint=function(multiPoint){var i;var points=[];for(i=0;i<multiPoint.geometries.length;i++){var coordinate=multiPoint.geometries[i].coordinate;points.push(new OpenLayers.Geometry.Point(coordinate.x,coordinate.y));}
return new OpenLayers.Geometry.MultiPoint(points);};jsts.io.OpenLayersParser.prototype.convertToMultiLineString=function(multiLineString){var i;var lineStrings=[];for(i=0;i<multiLineString.geometries.length;i++){lineStrings.push(this.convertToLineString(multiLineString.geometries[i]));}
return new OpenLayers.Geometry.MultiLineString(lineStrings);};jsts.io.OpenLayersParser.prototype.convertToMultiPolygon=function(multiPolygon){var i;var polygons=[];for(i=0;i<multiPolygon.geometries.length;i++){polygons.push(this.convertToPolygon(multiPolygon.geometries[i]));}
return new OpenLayers.Geometry.MultiPolygon(polygons);};jsts.io.OpenLayersParser.prototype.convertToCollection=function(geometryCollection){var i;var geometries=[];for(i=0;i<geometryCollection.geometries.length;i++){var geometry=geometryCollection.geometries[i];var geometryOpenLayers=this.write(geometry);geometries.push(geometryOpenLayers);}
return new OpenLayers.Geometry.Collection(geometries);};jsts.index.quadtree.Quadtree=function(){this.root=new jsts.index.quadtree.Root();this.minExtent=1.0;};jsts.index.quadtree.Quadtree.ensureExtent=function(itemEnv,minExtent){var minx,maxx,miny,maxy;minx=itemEnv.getMinX();maxx=itemEnv.getMaxX();miny=itemEnv.getMinY();maxy=itemEnv.getMaxY();if(minx!==maxx&&miny!==maxy){return itemEnv;}
if(minx===maxx){minx=minx-(minExtent/2.0);maxx=minx+(minExtent/2.0);}
if(miny===maxy){miny=miny-(minExtent/2.0);maxy=miny+(minExtent/2.0);}
return new jsts.geom.Envelope(minx,maxx,miny,maxy);};jsts.index.quadtree.Quadtree.prototype.depth=function(){return this.root.depth();};jsts.index.quadtree.Quadtree.prototype.size=function(){return this.root.size();};jsts.index.quadtree.Quadtree.prototype.insert=function(itemEnv,item){this.collectStats(itemEnv);var insertEnv=jsts.index.quadtree.Quadtree.ensureExtent(itemEnv,this.minExtent);this.root.insert(insertEnv,item);};jsts.index.quadtree.Quadtree.prototype.remove=function(itemEnv,item){var posEnv=jsts.index.quadtree.Quadtree.ensureExtent(itemEnv,this.minExtent);return this.root.remove(posEnv,item);};jsts.index.quadtree.Quadtree.prototype.query=function(){if(arguments.length===1){return jsts.index.quadtree.Quadtree.prototype.queryByEnvelope.apply(this,arguments);}else{jsts.index.quadtree.Quadtree.prototype.queryWithVisitor.apply(this,arguments);}};jsts.index.quadtree.Quadtree.prototype.queryByEnvelope=function(searchEnv){var visitor=new jsts.index.ArrayListVisitor();this.query(searchEnv,visitor);return visitor.getItems();};jsts.index.quadtree.Quadtree.prototype.queryWithVisitor=function(searchEnv,visitor){this.root.visit(searchEnv,visitor);};jsts.index.quadtree.Quadtree.prototype.queryAll=function(){var foundItems=[];foundItems=this.root.addAllItems(foundItems);return foundItems;};jsts.index.quadtree.Quadtree.prototype.collectStats=function(itemEnv){var delX=itemEnv.getWidth();if(delX<this.minExtent&&delX>0.0){this.minExtent=delX;}
var delY=itemEnv.getHeight();if(delY<this.minExtent&&delY>0.0){this.minExtent=delY;}};jsts.operation.relate.RelateNodeFactory=function(){};jsts.operation.relate.RelateNodeFactory.prototype=new jsts.geomgraph.NodeFactory();jsts.operation.relate.RelateNodeFactory.prototype.createNode=function(coord){return new jsts.operation.relate.RelateNode(coord,new jsts.operation.relate.EdgeEndBundleStar());};jsts.index.quadtree.Key=function(itemEnv){this.pt=new jsts.geom.Coordinate();this.level=0;this.env=null;this.computeKey(itemEnv);};jsts.index.quadtree.Key.computeQuadLevel=function(env){var dx,dy,dMax,level;dx=env.getWidth();dy=env.getHeight();dMax=dx>dy?dx:dy;level=jsts.index.DoubleBits.exponent(dMax)+1;return level;};jsts.index.quadtree.Key.prototype.getPoint=function(){return this.pt;};jsts.index.quadtree.Key.prototype.getLevel=function(){return this.level;};jsts.index.quadtree.Key.prototype.getEnvelope=function(){return this.env;};jsts.index.quadtree.Key.prototype.getCentre=function(){var x,y;x=(this.env.getMinX()+this.env.getMaxX())/2;y=(this.env.getMinY()+this.env.getMaxY())/2;return new jsts.geom.Coordinate(x,y);};jsts.index.quadtree.Key.prototype.computeKey=function(){if(arguments[0]instanceof jsts.geom.Envelope){this.computeKeyFromEnvelope(arguments[0]);}else{this.computeKeyFromLevel(arguments[0],arguments[1]);}};jsts.index.quadtree.Key.prototype.computeKeyFromEnvelope=function(env){this.level=jsts.index.quadtree.Key.computeQuadLevel(env);this.env=new jsts.geom.Envelope();this.computeKey(this.level,env);while(!this.env.contains(env)){this.level+=1;this.computeKey(this.level,env);}};jsts.index.quadtree.Key.prototype.computeKeyFromLevel=function(level,env){var quadSize=jsts.index.DoubleBits.powerOf2(level);this.pt.x=Math.floor(env.getMinX()/quadSize)*quadSize;this.pt.y=Math.floor(env.getMinY()/quadSize)*quadSize;this.env.init(this.pt.x,this.pt.x+quadSize,this.pt.y,this.pt.y+
quadSize);};jsts.operation.buffer.OffsetSegmentGenerator=function(precisionModel,bufParams,distance){this.seg0=new jsts.geom.LineSegment();this.seg1=new jsts.geom.LineSegment();this.offset0=new jsts.geom.LineSegment();this.offset1=new jsts.geom.LineSegment();this.precisionModel=precisionModel;this.bufParams=bufParams;this.li=new jsts.algorithm.RobustLineIntersector();this.filletAngleQuantum=Math.PI/2.0/bufParams.getQuadrantSegments();if(this.bufParams.getQuadrantSegments()>=8&&this.bufParams.getJoinStyle()===jsts.operation.buffer.BufferParameters.JOIN_ROUND){this.closingSegLengthFactor=jsts.operation.buffer.OffsetSegmentGenerator.MAX_CLOSING_SEG_LEN_FACTOR;}
this.init(distance);};jsts.operation.buffer.OffsetSegmentGenerator.OFFSET_SEGMENT_SEPARATION_FACTOR=1.0E-3;jsts.operation.buffer.OffsetSegmentGenerator.INSIDE_TURN_VERTEX_SNAP_DISTANCE_FACTOR=1.0E-3;jsts.operation.buffer.OffsetSegmentGenerator.CURVE_VERTEX_SNAP_DISTANCE_FACTOR=1.0E-6;jsts.operation.buffer.OffsetSegmentGenerator.MAX_CLOSING_SEG_LEN_FACTOR=80;jsts.operation.buffer.OffsetSegmentGenerator.prototype.maxCurveSegmentError=0.0;jsts.operation.buffer.OffsetSegmentGenerator.prototype.filletAngleQuantum=null;jsts.operation.buffer.OffsetSegmentGenerator.prototype.closingSegLengthFactor=1;jsts.operation.buffer.OffsetSegmentGenerator.prototype.segList=null;jsts.operation.buffer.OffsetSegmentGenerator.prototype.distance=0.0;jsts.operation.buffer.OffsetSegmentGenerator.prototype.precisionModel=null;jsts.operation.buffer.OffsetSegmentGenerator.prototype.bufParams=null;jsts.operation.buffer.OffsetSegmentGenerator.prototype.li=null;jsts.operation.buffer.OffsetSegmentGenerator.prototype.s0=null;jsts.operation.buffer.OffsetSegmentGenerator.prototype.s1=null;jsts.operation.buffer.OffsetSegmentGenerator.prototype.s2=null;jsts.operation.buffer.OffsetSegmentGenerator.prototype.seg0=null;jsts.operation.buffer.OffsetSegmentGenerator.prototype.seg1=null;jsts.operation.buffer.OffsetSegmentGenerator.prototype.offset0=null;jsts.operation.buffer.OffsetSegmentGenerator.prototype.offset1=null;jsts.operation.buffer.OffsetSegmentGenerator.prototype.side=0;jsts.operation.buffer.OffsetSegmentGenerator.prototype.hasNarrowConcaveAngle=false;jsts.operation.buffer.OffsetSegmentGenerator.prototype.hasNarrowConcaveAngle=function(){return this.hasNarrowConcaveAngle;};jsts.operation.buffer.OffsetSegmentGenerator.prototype.init=function(distance){this.distance=distance;this.maxCurveSegmentError=this.distance*(1-Math.cos(this.filletAngleQuantum/2.0));this.segList=new jsts.operation.buffer.OffsetSegmentString();this.segList.setPrecisionModel(this.precisionModel);this.segList.setMinimumVertexDistance(this.distance*jsts.operation.buffer.OffsetSegmentGenerator.CURVE_VERTEX_SNAP_DISTANCE_FACTOR);};jsts.operation.buffer.OffsetSegmentGenerator.prototype.initSideSegments=function(s1,s2,side){this.s1=s1;this.s2=s2;this.side=side;this.seg1.setCoordinates(this.s1,this.s2);this.computeOffsetSegment(this.seg1,this.side,this.distance,this.offset1);};jsts.operation.buffer.OffsetSegmentGenerator.prototype.getCoordinates=function(){return this.segList.getCoordinates();};jsts.operation.buffer.OffsetSegmentGenerator.prototype.closeRing=function(){this.segList.closeRing();};jsts.operation.buffer.OffsetSegmentGenerator.prototype.addSegments=function(pt,isForward){this.segList.addPts(pt,isForward);};jsts.operation.buffer.OffsetSegmentGenerator.prototype.addFirstSegment=function(){this.segList.addPt(this.offset1.p0);};jsts.operation.buffer.OffsetSegmentGenerator.prototype.addLastSegment=function(){this.segList.addPt(this.offset1.p1);};jsts.operation.buffer.OffsetSegmentGenerator.prototype.addNextSegment=function(p,addStartPoint){this.s0=this.s1;this.s1=this.s2;this.s2=p;this.seg0.setCoordinates(this.s0,this.s1);this.computeOffsetSegment(this.seg0,this.side,this.distance,this.offset0);this.seg1.setCoordinates(this.s1,this.s2);this.computeOffsetSegment(this.seg1,this.side,this.distance,this.offset1);if(this.s1.equals(this.s2))
return;var orientation=jsts.algorithm.CGAlgorithms.computeOrientation(this.s0,this.s1,this.s2);var outsideTurn=(orientation===jsts.algorithm.CGAlgorithms.CLOCKWISE&&this.side===jsts.geomgraph.Position.LEFT)||(orientation===jsts.algorithm.CGAlgorithms.COUNTERCLOCKWISE&&this.side===jsts.geomgraph.Position.RIGHT);if(orientation==0){this.addCollinear(addStartPoint);}else if(outsideTurn){this.addOutsideTurn(orientation,addStartPoint);}else{this.addInsideTurn(orientation,addStartPoint);}};jsts.operation.buffer.OffsetSegmentGenerator.prototype.addCollinear=function(addStartPoint){this.li.computeIntersection(this.s0,this.s1,this.s1,this.s2);var numInt=this.li.getIntersectionNum();if(numInt>=2){if(this.bufParams.getJoinStyle()===jsts.operation.buffer.BufferParameters.JOIN_BEVEL||this.bufParams.getJoinStyle()===jsts.operation.buffer.BufferParameters.JOIN_MITRE){if(addStartPoint)
this.segList.addPt(this.offset0.p1);this.segList.addPt(this.offset1.p0);}else{this.addFillet(this.s1,this.offset0.p1,this.offset1.p0,jsts.algorithm.CGAlgorithms.CLOCKWISE,this.distance);}}};jsts.operation.buffer.OffsetSegmentGenerator.prototype.addOutsideTurn=function(orientation,addStartPoint){if(this.offset0.p1.distance(this.offset1.p0)<this.distance*jsts.operation.buffer.OffsetSegmentGenerator.OFFSET_SEGMENT_SEPARATION_FACTOR){this.segList.addPt(this.offset0.p1);return;}
if(this.bufParams.getJoinStyle()===jsts.operation.buffer.BufferParameters.JOIN_MITRE){this.addMitreJoin(this.s1,this.offset0,this.offset1,this.distance);}else if(this.bufParams.getJoinStyle()===jsts.operation.buffer.BufferParameters.JOIN_BEVEL){this.addBevelJoin(this.offset0,this.offset1);}else{if(addStartPoint)
this.segList.addPt(this.offset0.p1);this.addFillet(this.s1,this.offset0.p1,this.offset1.p0,orientation,this.distance);this.segList.addPt(this.offset1.p0);}};jsts.operation.buffer.OffsetSegmentGenerator.prototype.addInsideTurn=function(orientation,addStartPoint){this.li.computeIntersection(this.offset0.p0,this.offset0.p1,this.offset1.p0,this.offset1.p1);if(this.li.hasIntersection()){this.segList.addPt(this.li.getIntersection(0));}else{this.hasNarrowConcaveAngle=true;if(this.offset0.p1.distance(this.offset1.p0)<this.distance*jsts.operation.buffer.OffsetSegmentGenerator.INSIDE_TURN_VERTEX_SNAP_DISTANCE_FACTOR){this.segList.addPt(this.offset0.p1);}else{this.segList.addPt(this.offset0.p1);if(this.closingSegLengthFactor>0){var mid0=new jsts.geom.Coordinate((this.closingSegLengthFactor*this.offset0.p1.x+this.s1.x)/(this.closingSegLengthFactor+1),(this.closingSegLengthFactor*this.offset0.p1.y+this.s1.y)/(this.closingSegLengthFactor+1));this.segList.addPt(mid0);var mid1=new jsts.geom.Coordinate((this.closingSegLengthFactor*this.offset1.p0.x+this.s1.x)/(this.closingSegLengthFactor+1),(this.closingSegLengthFactor*this.offset1.p0.y+this.s1.y)/(this.closingSegLengthFactor+1));this.segList.addPt(mid1);}else{this.segList.addPt(this.s1);}
this.segList.addPt(this.offset1.p0);}}};jsts.operation.buffer.OffsetSegmentGenerator.prototype.computeOffsetSegment=function(seg,side,distance,offset){var sideSign=side===jsts.geomgraph.Position.LEFT?1:-1;var dx=seg.p1.x-seg.p0.x;var dy=seg.p1.y-seg.p0.y;var len=Math.sqrt(dx*dx+dy*dy);var ux=sideSign*distance*dx/len;var uy=sideSign*distance*dy/len;offset.p0.x=seg.p0.x-uy;offset.p0.y=seg.p0.y+ux;offset.p1.x=seg.p1.x-uy;offset.p1.y=seg.p1.y+ux;};jsts.operation.buffer.OffsetSegmentGenerator.prototype.addLineEndCap=function(p0,p1){var seg=new jsts.geom.LineSegment(p0,p1);var offsetL=new jsts.geom.LineSegment();this.computeOffsetSegment(seg,jsts.geomgraph.Position.LEFT,this.distance,offsetL);var offsetR=new jsts.geom.LineSegment();this.computeOffsetSegment(seg,jsts.geomgraph.Position.RIGHT,this.distance,offsetR);var dx=p1.x-p0.x;var dy=p1.y-p0.y;var angle=Math.atan2(dy,dx);switch(this.bufParams.getEndCapStyle()){case jsts.operation.buffer.BufferParameters.CAP_ROUND:this.segList.addPt(offsetL.p1);this.addFillet(p1,angle+Math.PI/2,angle-Math.PI/2,jsts.algorithm.CGAlgorithms.CLOCKWISE,this.distance);this.segList.addPt(offsetR.p1);break;case jsts.operation.buffer.BufferParameters.CAP_FLAT:this.segList.addPt(offsetL.p1);this.segList.addPt(offsetR.p1);break;case jsts.operation.buffer.BufferParameters.CAP_SQUARE:var squareCapSideOffset=new jsts.geom.Coordinate();squareCapSideOffset.x=Math.abs(this.distance)*Math.cos(angle);squareCapSideOffset.y=Math.abs(this.distance)*Math.sin(angle);var squareCapLOffset=new jsts.geom.Coordinate(offsetL.p1.x+
squareCapSideOffset.x,offsetL.p1.y+squareCapSideOffset.y);var squareCapROffset=new jsts.geom.Coordinate(offsetR.p1.x+
squareCapSideOffset.x,offsetR.p1.y+squareCapSideOffset.y);this.segList.addPt(squareCapLOffset);this.segList.addPt(squareCapROffset);break;}};jsts.operation.buffer.OffsetSegmentGenerator.prototype.addMitreJoin=function(p,offset0,offset1,distance){var isMitreWithinLimit=true;var intPt=null;try{intPt=jsts.algorithm.HCoordinate.intersection(offset0.p0,offset0.p1,offset1.p0,offset1.p1);var mitreRatio=distance<=0.0?1.0:intPt.distance(p)/Math.abs(distance);if(mitreRatio>this.bufParams.getMitreLimit())
this.isMitreWithinLimit=false;}catch(e){if(e instanceof jsts.error.NotRepresentableError){intPt=new jsts.geom.Coordinate(0,0);this.isMitreWithinLimit=false;}}
if(isMitreWithinLimit){this.segList.addPt(intPt);}else{this.addLimitedMitreJoin(offset0,offset1,distance,bufParams.getMitreLimit());}};jsts.operation.buffer.OffsetSegmentGenerator.prototype.addLimitedMitreJoin=function(offset0,offset1,distance,mitreLimit){var basePt=this.seg0.p1;var ang0=jsts.algorithm.Angle.angle(basePt,this.seg0.p0);var ang1=jsts.algorithm.Angle.angle(basePt,this.seg1.p1);var angDiff=jsts.algorithm.Angle.angleBetweenOriented(this.seg0.p0,basePt,this.seg1.p1);var angDiffHalf=angDiff/2;var midAng=jsts.algorithm.Angle.normalize(ang0+angDiffHalf);var mitreMidAng=jsts.algorithm.Angle.normalize(midAng+Math.PI);var mitreDist=mitreLimit*distance;var bevelDelta=mitreDist*Math.abs(Math.sin(angDiffHalf));var bevelHalfLen=distance-bevelDelta;var bevelMidX=basePt.x+mitreDist*Math.cos(mitreMidAng);var bevelMidY=basePt.y+mitreDist*Math.sin(mitreMidAng);var bevelMidPt=new jsts.geom.Coordinate(bevelMidX,bevelMidY);var mitreMidLine=new jsts.geom.LineSegment(basePt,bevelMidPt);var bevelEndLeft=mitreMidLine.pointAlongOffset(1.0,bevelHalfLen);var bevelEndRight=mitreMidLine.pointAlongOffset(1.0,-bevelHalfLen);if(this.side==jsts.geomgraph.Position.LEFT){this.segList.addPt(bevelEndLeft);this.segList.addPt(bevelEndRight);}else{this.segList.addPt(bevelEndRight);this.segList.addPt(bevelEndLeft);}};jsts.operation.buffer.OffsetSegmentGenerator.prototype.addBevelJoin=function(offset0,offset1){this.segList.addPt(offset0.p1);this.segList.addPt(offset1.p0);};jsts.operation.buffer.OffsetSegmentGenerator.prototype.addFillet=function(p,p0,p1,direction,radius){if(!(p1 instanceof jsts.geom.Coordinate)){this.addFillet2.apply(this,arguments);return;}
var dx0=p0.x-p.x;var dy0=p0.y-p.y;var startAngle=Math.atan2(dy0,dx0);var dx1=p1.x-p.x;var dy1=p1.y-p.y;var endAngle=Math.atan2(dy1,dx1);if(direction===jsts.algorithm.CGAlgorithms.CLOCKWISE){if(startAngle<=endAngle)
startAngle+=2.0*Math.PI;}else{if(startAngle>=endAngle)
startAngle-=2.0*Math.PI;}
this.segList.addPt(p0);this.addFillet(p,startAngle,endAngle,direction,radius);this.segList.addPt(p1);};jsts.operation.buffer.OffsetSegmentGenerator.prototype.addFillet2=function(p,startAngle,endAngle,direction,radius){var directionFactor=direction===jsts.algorithm.CGAlgorithms.CLOCKWISE?-1:1;var totalAngle=Math.abs(startAngle-endAngle);var nSegs=parseInt((totalAngle/this.filletAngleQuantum+0.5));if(nSegs<1)
return;var initAngle,currAngleInc;initAngle=0.0;currAngleInc=totalAngle/nSegs;var currAngle=initAngle;var pt=new jsts.geom.Coordinate();while(currAngle<totalAngle){var angle=startAngle+directionFactor*currAngle;pt.x=p.x+radius*Math.cos(angle);pt.y=p.y+radius*Math.sin(angle);this.segList.addPt(pt);currAngle+=currAngleInc;}};jsts.operation.buffer.OffsetSegmentGenerator.prototype.createCircle=function(p){var pt=new jsts.geom.Coordinate(p.x+this.distance,p.y);this.segList.addPt(pt);this.addFillet(p,0.0,2.0*Math.PI,-1,this.distance);this.segList.closeRing();};jsts.operation.buffer.OffsetSegmentGenerator.prototype.createSquare=function(p){this.segList.addPt(new jsts.geom.Coordinate(p.x+distance,p.y+distance));this.segList.addPt(new jsts.geom.Coordinate(p.x+distance,p.y-distance));this.segList.addPt(new jsts.geom.Coordinate(p.x-distance,p.y-distance));this.segList.addPt(new jsts.geom.Coordinate(p.x-distance,p.y+distance));this.segList.closeRing();};jsts.geom.CoordinateArrays=function(){throw new jsts.error.AbstractMethodInvocationError();};jsts.geom.CoordinateArrays.removeRepeatedPoints=function(coord){var coordList;if(!this.hasRepeatedPoints(coord)){return coord;}
coordList=new jsts.geom.CoordinateList(coord,false);return coordList.toCoordinateArray();};jsts.geom.CoordinateArrays.hasRepeatedPoints=function(coord){var i;for(i=1;i<coord.length;i++){if(coord[i-1].equals(coord[i])){return true;}}
return false;};jsts.geom.CoordinateArrays.ptNotInList=function(testPts,pts){for(var i=0;i<testPts.length;i++){var testPt=testPts[i];if(jsts.geom.CoordinateArrays.indexOf(testPt,pts)<0)
return testPt;}
return null;};jsts.geom.CoordinateArrays.increasingDirection=function(pts){for(var i=0;i<parseInt(pts.length/2);i++){var j=pts.length-1-i;var comp=pts[i].compareTo(pts[j]);if(comp!=0)
return comp;}
return 1;};jsts.geom.CoordinateArrays.minCoordinate=function(coordinates){var minCoord=null;for(var i=0;i<coordinates.length;i++){if(minCoord===null||minCoord.compareTo(coordinates[i])>0){minCoord=coordinates[i];}}
return minCoord;};jsts.geom.CoordinateArrays.scroll=function(coordinates,firstCoordinate){var i=jsts.geom.CoordinateArrays.indexOf(firstCoordinate,coordinates);if(i<0)
return;var newCoordinates=coordinates.slice(i).concat(coordinates.slice(0,i));for(i=0;i<newCoordinates.length;i++){coordinates[i]=newCoordinates[i];}};jsts.geom.CoordinateArrays.indexOf=function(coordinate,coordinates){for(var i=0;i<coordinates.length;i++){if(coordinate.equals(coordinates[i])){return i;}}
return-1;};jsts.operation.overlay.MinimalEdgeRing=function(start,geometryFactory){jsts.geomgraph.EdgeRing.call(this,start,geometryFactory);};jsts.operation.overlay.MinimalEdgeRing.prototype=new jsts.geomgraph.EdgeRing();jsts.operation.overlay.MinimalEdgeRing.constructor=jsts.operation.overlay.MinimalEdgeRing;jsts.operation.overlay.MinimalEdgeRing.prototype.getNext=function(de){return de.getNextMin();};jsts.operation.overlay.MinimalEdgeRing.prototype.setEdgeRing=function(de,er){de.setMinEdgeRing(er);};jsts.triangulate.DelaunayTriangulationBuilder=function(){this.siteCoords=null;this.tolerance=0.0;this.subdiv=null;};jsts.triangulate.DelaunayTriangulationBuilder.extractUniqueCoordinates=function(geom){if(geom===undefined||geom===null){return new jsts.geom.CoordinateList([],false).toArray();}
var coords=geom.getCoordinates();return jsts.triangulate.DelaunayTriangulationBuilder.unique(coords);};jsts.triangulate.DelaunayTriangulationBuilder.unique=function(coords){coords.sort(function(a,b){return a.compareTo(b);});var coordList=new jsts.geom.CoordinateList(coords,false);return coordList.toArray();};jsts.triangulate.DelaunayTriangulationBuilder.toVertices=function(coords){var verts=new Array(coords.length),i=0,il=coords.length,coord;for(i;i<il;i++){coord=coords[i];verts[i]=new jsts.triangulate.quadedge.Vertex(coord);}
return verts;};jsts.triangulate.DelaunayTriangulationBuilder.envelope=function(coords){var env=new jsts.geom.Envelope(),i=0,il=coords.length;for(i;i<il;i++){env.expandToInclude(coords[i]);}
return env;};jsts.triangulate.DelaunayTriangulationBuilder.prototype.setSites=function(){var arg=arguments[0];if(arg instanceof jsts.geom.Geometry||arg instanceof jsts.geom.Coordinate||arg instanceof jsts.geom.Point||arg instanceof jsts.geom.MultiPoint||arg instanceof jsts.geom.LineString||arg instanceof jsts.geom.MultiLineString||arg instanceof jsts.geom.LinearRing||arg instanceof jsts.geom.Polygon||arg instanceof jsts.geom.MultiPolygon){this.setSitesFromGeometry(arg);}else{this.setSitesFromCollection(arg);}};jsts.triangulate.DelaunayTriangulationBuilder.prototype.setSitesFromGeometry=function(geom){this.siteCoords=jsts.triangulate.DelaunayTriangulationBuilder.extractUniqueCoordinates(geom);};jsts.triangulate.DelaunayTriangulationBuilder.prototype.setSitesFromCollection=function(coords){this.siteCoords=jsts.triangulate.DelaunayTriangulationBuilder.unique(coords);};jsts.triangulate.DelaunayTriangulationBuilder.prototype.setTolerance=function(tolerance){this.tolerance=tolerance;};jsts.triangulate.DelaunayTriangulationBuilder.prototype.create=function(){if(this.subdiv===null){var siteEnv,vertices,triangulator;siteEnv=jsts.triangulate.DelaunayTriangulationBuilder.envelope(this.siteCoords);vertices=jsts.triangulate.DelaunayTriangulationBuilder.toVertices(this.siteCoords);this.subdiv=new jsts.triangulate.quadedge.QuadEdgeSubdivision(siteEnv,this.tolerance);triangulator=new jsts.triangulate.IncrementalDelaunayTriangulator(this.subdiv);triangulator.insertSites(vertices);}};jsts.triangulate.DelaunayTriangulationBuilder.prototype.getSubdivision=function(){this.create();return this.subdiv;};jsts.triangulate.DelaunayTriangulationBuilder.prototype.getEdges=function(geomFact){this.create();return this.subdiv.getEdges(geomFact);};jsts.triangulate.DelaunayTriangulationBuilder.prototype.getTriangles=function(geomFact){this.create();return this.subdiv.getTriangles(geomFact);};jsts.algorithm.RayCrossingCounter=function(p){this.p=p;};jsts.algorithm.RayCrossingCounter.locatePointInRing=function(p,ring){var counter=new jsts.algorithm.RayCrossingCounter(p);for(var i=1;i<ring.length;i++){var p1=ring[i];var p2=ring[i-1];counter.countSegment(p1,p2);if(counter.isOnSegment())
return counter.getLocation();}
return counter.getLocation();};jsts.algorithm.RayCrossingCounter.prototype.p=null;jsts.algorithm.RayCrossingCounter.prototype.crossingCount=0;jsts.algorithm.RayCrossingCounter.prototype.isPointOnSegment=false;jsts.algorithm.RayCrossingCounter.prototype.countSegment=function(p1,p2){if(p1.x<this.p.x&&p2.x<this.p.x)
return;if(this.p.x==p2.x&&this.p.y===p2.y){this.isPointOnSegment=true;return;}
if(p1.y===this.p.y&&p2.y===this.p.y){var minx=p1.x;var maxx=p2.x;if(minx>maxx){minx=p2.x;maxx=p1.x;}
if(this.p.x>=minx&&this.p.x<=maxx){this.isPointOnSegment=true;}
return;}
if(((p1.y>this.p.y)&&(p2.y<=this.p.y))||((p2.y>this.p.y)&&(p1.y<=this.p.y))){var x1=p1.x-this.p.x;var y1=p1.y-this.p.y;var x2=p2.x-this.p.x;var y2=p2.y-this.p.y;var xIntSign=jsts.algorithm.RobustDeterminant.signOfDet2x2(x1,y1,x2,y2);if(xIntSign===0.0){this.isPointOnSegment=true;return;}
if(y2<y1)
xIntSign=-xIntSign;if(xIntSign>0.0){this.crossingCount++;}}};jsts.algorithm.RayCrossingCounter.prototype.isOnSegment=function(){return jsts.geom.isPointOnSegment;};jsts.algorithm.RayCrossingCounter.prototype.getLocation=function(){if(this.isPointOnSegment)
return jsts.geom.Location.BOUNDARY;if((this.crossingCount%2)===1){return jsts.geom.Location.INTERIOR;}
return jsts.geom.Location.EXTERIOR;};jsts.algorithm.RayCrossingCounter.prototype.isPointInPolygon=function(){return this.getLocation()!==jsts.geom.Location.EXTERIOR;};jsts.operation.BoundaryOp=function(geom,bnRule){this.geom=geom;this.geomFact=geom.getFactory();this.bnRule=bnRule||jsts.algorithm.BoundaryNodeRule.MOD2_BOUNDARY_RULE;};jsts.operation.BoundaryOp.prototype.geom=null;jsts.operation.BoundaryOp.prototype.geomFact=null;jsts.operation.BoundaryOp.prototype.bnRule=null;jsts.operation.BoundaryOp.prototype.getBoundary=function(){if(this.geom instanceof jsts.geom.LineString)return this.boundaryLineString(this.geom);if(this.geom instanceof jsts.geom.MultiLineString)return this.boundaryMultiLineString(this.geom);return this.geom.getBoundary();};jsts.operation.BoundaryOp.prototype.getEmptyMultiPoint=function(){return this.geomFact.createMultiPoint(null);};jsts.operation.BoundaryOp.prototype.boundaryMultiLineString=function(mLine){if(this.geom.isEmpty()){return this.getEmptyMultiPoint();}
var bdyPts=this.computeBoundaryCoordinates(mLine);if(bdyPts.length==1){return this.geomFact.createPoint(bdyPts[0]);}
return this.geomFact.createMultiPoint(bdyPts);};jsts.operation.BoundaryOp.prototype.endpoints=null;jsts.operation.BoundaryOp.prototype.computeBoundaryCoordinates=function(mLine){var i,line,endpoint,bdyPts=[];this.endpoints=[];for(i=0;i<mLine.getNumGeometries();i++){line=mLine.getGeometryN(i);if(line.getNumPoints()==0)
continue;this.addEndpoint(line.getCoordinateN(0));this.addEndpoint(line.getCoordinateN(line.getNumPoints()-1));}
for(i=0;i<this.endpoints.length;i++){endpoint=this.endpoints[i];if(this.bnRule.isInBoundary(endpoint.count)){bdyPts.push(endpoint.coordinate);}}
return bdyPts;};jsts.operation.BoundaryOp.prototype.addEndpoint=function(pt){var i,endpoint,found=false;for(i=0;i<this.endpoints.length;i++){endpoint=this.endpoints[i];if(endpoint.coordinate.equals(pt)){found=true;break;}}
if(!found){endpoint={};endpoint.coordinate=pt;endpoint.count=0;this.endpoints.push(endpoint);}
endpoint.count++;};jsts.operation.BoundaryOp.prototype.boundaryLineString=function(line){if(this.geom.isEmpty()){return this.getEmptyMultiPoint();}
if(line.isClosed()){var closedEndpointOnBoundary=this.bnRule.isInBoundary(2);if(closedEndpointOnBoundary){return line.getStartPoint();}
else{return this.geomFact.createMultiPoint(null);}}
return this.geomFact.createMultiPoint([line.getStartPoint(),line.getEndPoint()]);};jsts.operation.buffer.OffsetCurveSetBuilder=function(inputGeom,distance,curveBuilder){this.inputGeom=inputGeom;this.distance=distance;this.curveBuilder=curveBuilder;this.curveList=new javascript.util.ArrayList();};jsts.operation.buffer.OffsetCurveSetBuilder.prototype.inputGeom=null;jsts.operation.buffer.OffsetCurveSetBuilder.prototype.distance=null;jsts.operation.buffer.OffsetCurveSetBuilder.prototype.curveBuilder=null;jsts.operation.buffer.OffsetCurveSetBuilder.prototype.curveList=null;jsts.operation.buffer.OffsetCurveSetBuilder.prototype.getCurves=function(){this.add(this.inputGeom);return this.curveList;};jsts.operation.buffer.OffsetCurveSetBuilder.prototype.addCurve=function(coord,leftLoc,rightLoc){if(coord==null||coord.length<2)
return;var e=new jsts.noding.NodedSegmentString(coord,new jsts.geomgraph.Label(0,jsts.geom.Location.BOUNDARY,leftLoc,rightLoc));this.curveList.add(e);};jsts.operation.buffer.OffsetCurveSetBuilder.prototype.add=function(g){if(g.isEmpty())
return;if(g instanceof jsts.geom.Polygon)
this.addPolygon(g);else if(g instanceof jsts.geom.LineString)
this.addLineString(g);else if(g instanceof jsts.geom.Point)
this.addPoint(g);else if(g instanceof jsts.geom.MultiPoint)
this.addCollection(g);else if(g instanceof jsts.geom.MultiLineString)
this.addCollection(g);else if(g instanceof jsts.geom.MultiPolygon)
this.addCollection(g);else if(g instanceof jsts.geom.GeometryCollection)
this.addCollection(g);else
throw new jsts.error.IllegalArgumentError();};jsts.operation.buffer.OffsetCurveSetBuilder.prototype.addCollection=function(gc){for(var i=0;i<gc.getNumGeometries();i++){var g=gc.getGeometryN(i);this.add(g);}};jsts.operation.buffer.OffsetCurveSetBuilder.prototype.addPoint=function(p){if(this.distance<=0.0)
return;var coord=p.getCoordinates();var curve=this.curveBuilder.getLineCurve(coord,this.distance);this.addCurve(curve,jsts.geom.Location.EXTERIOR,jsts.geom.Location.INTERIOR);};jsts.operation.buffer.OffsetCurveSetBuilder.prototype.addLineString=function(line){if(this.distance<=0.0&&!this.curveBuilder.getBufferParameters().isSingleSided())
return;var coord=jsts.geom.CoordinateArrays.removeRepeatedPoints(line.getCoordinates());var curve=this.curveBuilder.getLineCurve(coord,this.distance);this.addCurve(curve,jsts.geom.Location.EXTERIOR,jsts.geom.Location.INTERIOR);};jsts.operation.buffer.OffsetCurveSetBuilder.prototype.addPolygon=function(p){var offsetDistance=this.distance;var offsetSide=jsts.geomgraph.Position.LEFT;if(this.distance<0.0){offsetDistance=-this.distance;offsetSide=jsts.geomgraph.Position.RIGHT;}
var shell=p.getExteriorRing();var shellCoord=jsts.geom.CoordinateArrays.removeRepeatedPoints(shell.getCoordinates());if(this.distance<0.0&&this.isErodedCompletely(shell,this.distance))
return;if(this.distance<=0.0&&shellCoord.length<3)
return;this.addPolygonRing(shellCoord,offsetDistance,offsetSide,jsts.geom.Location.EXTERIOR,jsts.geom.Location.INTERIOR);for(var i=0;i<p.getNumInteriorRing();i++){var hole=p.getInteriorRingN(i);var holeCoord=jsts.geom.CoordinateArrays.removeRepeatedPoints(hole.getCoordinates());if(this.distance>0.0&&this.isErodedCompletely(hole,-this.distance))
continue;this.addPolygonRing(holeCoord,offsetDistance,jsts.geomgraph.Position.opposite(offsetSide),jsts.geom.Location.INTERIOR,jsts.geom.Location.EXTERIOR);}};jsts.operation.buffer.OffsetCurveSetBuilder.prototype.addPolygonRing=function(coord,offsetDistance,side,cwLeftLoc,cwRightLoc){if(offsetDistance==0.0&&coord.length<jsts.geom.LinearRing.MINIMUM_VALID_SIZE)
return;var leftLoc=cwLeftLoc;var rightLoc=cwRightLoc;if(coord.length>=jsts.geom.LinearRing.MINIMUM_VALID_SIZE&&jsts.algorithm.CGAlgorithms.isCCW(coord)){leftLoc=cwRightLoc;rightLoc=cwLeftLoc;side=jsts.geomgraph.Position.opposite(side);}
var curve=this.curveBuilder.getRingCurve(coord,side,offsetDistance);this.addCurve(curve,leftLoc,rightLoc);};jsts.operation.buffer.OffsetCurveSetBuilder.prototype.isErodedCompletely=function(ring,bufferDistance){var ringCoord=ring.getCoordinates();var minDiam=0.0;if(ringCoord.length<4)
return bufferDistance<0;if(ringCoord.length==4)
return this.isTriangleErodedCompletely(ringCoord,bufferDistance);var env=ring.getEnvelopeInternal();var envMinDimension=Math.min(env.getHeight(),env.getWidth());if(bufferDistance<0.0&&2*Math.abs(bufferDistance)>envMinDimension)
return true;return false;};jsts.operation.buffer.OffsetCurveSetBuilder.prototype.isTriangleErodedCompletely=function(triangleCoord,bufferDistance){var tri=new jsts.geom.Triangle(triangleCoord[0],triangleCoord[1],triangleCoord[2]);var inCentre=tri.inCentre();var distToCentre=jsts.algorithm.CGAlgorithms.distancePointLine(inCentre,tri.p0,tri.p1);return distToCentre<Math.abs(bufferDistance);};jsts.operation.buffer.BufferSubgraph=function(){this.dirEdgeList=new javascript.util.ArrayList();this.nodes=new javascript.util.ArrayList();this.finder=new jsts.operation.buffer.RightmostEdgeFinder();};jsts.operation.buffer.BufferSubgraph.prototype.finder=null;jsts.operation.buffer.BufferSubgraph.prototype.dirEdgeList=null;jsts.operation.buffer.BufferSubgraph.prototype.nodes=null;jsts.operation.buffer.BufferSubgraph.prototype.rightMostCoord=null;jsts.operation.buffer.BufferSubgraph.prototype.env=null;jsts.operation.buffer.BufferSubgraph.prototype.getDirectedEdges=function(){return this.dirEdgeList;};jsts.operation.buffer.BufferSubgraph.prototype.getNodes=function(){return this.nodes;};jsts.operation.buffer.BufferSubgraph.prototype.getEnvelope=function(){if(this.env===null){var edgeEnv=new jsts.geom.Envelope();for(var it=this.dirEdgeList.iterator();it.hasNext();){var dirEdge=it.next();var pts=dirEdge.getEdge().getCoordinates();for(var j=0;j<pts.length-1;j++){edgeEnv.expandToInclude(pts[j]);}}
this.env=edgeEnv;}
return this.env;};jsts.operation.buffer.BufferSubgraph.prototype.getRightmostCoordinate=function(){return this.rightMostCoord;};jsts.operation.buffer.BufferSubgraph.prototype.create=function(node){this.addReachable(node);this.finder.findEdge(this.dirEdgeList);this.rightMostCoord=this.finder.getCoordinate();};jsts.operation.buffer.BufferSubgraph.prototype.addReachable=function(startNode){var nodeStack=[];nodeStack.push(startNode);while(nodeStack.length!==0){var node=nodeStack.pop();this.add(node,nodeStack);}};jsts.operation.buffer.BufferSubgraph.prototype.add=function(node,nodeStack){node.setVisited(true);this.nodes.add(node);for(var i=node.getEdges().iterator();i.hasNext();){var de=i.next();this.dirEdgeList.add(de);var sym=de.getSym();var symNode=sym.getNode();if(!symNode.isVisited())
nodeStack.push(symNode);}};jsts.operation.buffer.BufferSubgraph.prototype.clearVisitedEdges=function(){for(var it=this.dirEdgeList.iterator();it.hasNext();){var de=it.next();de.setVisited(false);}};jsts.operation.buffer.BufferSubgraph.prototype.computeDepth=function(outsideDepth){this.clearVisitedEdges();var de=this.finder.getEdge();var n=de.getNode();var label=de.getLabel();de.setEdgeDepths(jsts.geomgraph.Position.RIGHT,outsideDepth);this.copySymDepths(de);this.computeDepths(de);};jsts.operation.buffer.BufferSubgraph.prototype.computeDepths=function(startEdge){var nodesVisited=[];var nodeQueue=[];var startNode=startEdge.getNode();nodeQueue.push(startNode);nodesVisited.push(startNode);startEdge.setVisited(true);while(nodeQueue.length!==0){var n=nodeQueue.shift();nodesVisited.push(n);this.computeNodeDepth(n);for(var i=n.getEdges().iterator();i.hasNext();){var de=i.next();var sym=de.getSym();if(sym.isVisited())
continue;var adjNode=sym.getNode();if(nodesVisited.indexOf(adjNode)===-1){nodeQueue.push(adjNode);nodesVisited.push(adjNode);}}}};jsts.operation.buffer.BufferSubgraph.prototype.computeNodeDepth=function(n){var startEdge=null;for(var i=n.getEdges().iterator();i.hasNext();){var de=i.next();if(de.isVisited()||de.getSym().isVisited()){startEdge=de;break;}}
if(startEdge==null)
throw new jsts.error.TopologyError('unable to find edge to compute depths at '+n.getCoordinate());n.getEdges().computeDepths(startEdge);for(var i=n.getEdges().iterator();i.hasNext();){var de=i.next();de.setVisited(true);this.copySymDepths(de);}};jsts.operation.buffer.BufferSubgraph.prototype.copySymDepths=function(de){var sym=de.getSym();sym.setDepth(jsts.geomgraph.Position.LEFT,de.getDepth(jsts.geomgraph.Position.RIGHT));sym.setDepth(jsts.geomgraph.Position.RIGHT,de.getDepth(jsts.geomgraph.Position.LEFT));};jsts.operation.buffer.BufferSubgraph.prototype.findResultEdges=function(){for(var it=this.dirEdgeList.iterator();it.hasNext();){var de=it.next();if(de.getDepth(jsts.geomgraph.Position.RIGHT)>=1&&de.getDepth(jsts.geomgraph.Position.LEFT)<=0&&!de.isInteriorAreaEdge()){de.setInResult(true);}}};jsts.operation.buffer.BufferSubgraph.prototype.compareTo=function(o){var graph=o;if(this.rightMostCoord.x<graph.rightMostCoord.x){return-1;}
if(this.rightMostCoord.x>graph.rightMostCoord.x){return 1;}
return 0;};jsts.geom.util.GeometryExtracter=function(clz,comps){this.clz=clz;this.comps=comps;};jsts.geom.util.GeometryExtracter.prototype=new jsts.geom.GeometryFilter();jsts.geom.util.GeometryExtracter.prototype.clz=null;jsts.geom.util.GeometryExtracter.prototype.comps=null;jsts.geom.util.GeometryExtracter.extract=function(geom,clz,list){list=list||new javascript.util.ArrayList();if(geom instanceof clz){list.add(geom);}
else if(geom instanceof jsts.geom.GeometryCollection||geom instanceof jsts.geom.MultiPoint||geom instanceof jsts.geom.MultiLineString||geom instanceof jsts.geom.MultiPolygon){geom.apply(new jsts.geom.util.GeometryExtracter(clz,list));}
return list;};jsts.geom.util.GeometryExtracter.prototype.filter=function(geom){if(this.clz===null||geom instanceof this.clz){this.comps.add(geom);}};(function(){var OverlayOp=jsts.operation.overlay.OverlayOp;var SnapOverlayOp=jsts.operation.overlay.snap.SnapOverlayOp;var SnapIfNeededOverlayOp=function(g1,g2){this.geom=[];this.geom[0]=g1;this.geom[1]=g2;};SnapIfNeededOverlayOp.overlayOp=function(g0,g1,opCode){var op=new SnapIfNeededOverlayOp(g0,g1);return op.getResultGeometry(opCode);};SnapIfNeededOverlayOp.intersection=function(g0,g1){return overlayOp(g0,g1,OverlayOp.INTERSECTION);};SnapIfNeededOverlayOp.union=function(g0,g1){return overlayOp(g0,g1,OverlayOp.UNION);};SnapIfNeededOverlayOp.difference=function(g0,g1){return overlayOp(g0,g1,OverlayOp.DIFFERENCE);};SnapIfNeededOverlayOp.symDifference=function(g0,g1){return overlayOp(g0,g1,OverlayOp.SYMDIFFERENCE);};SnapIfNeededOverlayOp.prototype.geom=null;SnapIfNeededOverlayOp.prototype.getResultGeometry=function(opCode){var result=null;var isSuccess=false;var savedException=null;try{result=OverlayOp.overlayOp(this.geom[0],this.geom[1],opCode);var isValid=true;if(isValid)
isSuccess=true;}catch(ex){savedException=ex;}
if(!isSuccess){try{result=SnapOverlayOp.overlayOp(this.geom[0],this.geom[1],opCode);}catch(ex){throw savedException;}}
return result;};jsts.operation.overlay.snap.SnapIfNeededOverlayOp=SnapIfNeededOverlayOp;})();(function(){var GeometryExtracter=jsts.geom.util.GeometryExtracter;var CascadedPolygonUnion=jsts.operation.union.CascadedPolygonUnion;var PointGeometryUnion=jsts.operation.union.PointGeometryUnion;var OverlayOp=jsts.operation.overlay.OverlayOp;var SnapIfNeededOverlayOp=jsts.operation.overlay.snap.SnapIfNeededOverlayOp;var ArrayList=javascript.util.ArrayList;jsts.operation.union.UnaryUnionOp=function(geoms,geomFact){this.polygons=new ArrayList();this.lines=new ArrayList();this.points=new ArrayList();if(geomFact){this.geomFact=geomFact;}
this.extract(geoms);};jsts.operation.union.UnaryUnionOp.union=function(geoms,geomFact){var op=new jsts.operation.union.UnaryUnionOp(geoms,geomFact);return op.union();};jsts.operation.union.UnaryUnionOp.prototype.polygons=null;jsts.operation.union.UnaryUnionOp.prototype.lines=null;jsts.operation.union.UnaryUnionOp.prototype.points=null;jsts.operation.union.UnaryUnionOp.prototype.geomFact=null;jsts.operation.union.UnaryUnionOp.prototype.extract=function(geoms){if(geoms instanceof ArrayList){for(var i=geoms.iterator();i.hasNext();){var geom=i.next();this.extract(geom);}}else{if(this.geomFact===null){this.geomFact=geoms.getFactory();}
GeometryExtracter.extract(geoms,jsts.geom.Polygon,this.polygons);GeometryExtracter.extract(geoms,jsts.geom.LineString,this.lines);GeometryExtracter.extract(geoms,jsts.geom.Point,this.points);}};jsts.operation.union.UnaryUnionOp.prototype.union=function(){if(this.geomFact===null){return null;}
var unionPoints=null;if(this.points.size()>0){var ptGeom=this.geomFact.buildGeometry(this.points);unionPoints=this.unionNoOpt(ptGeom);}
var unionLines=null;if(this.lines.size()>0){var lineGeom=this.geomFact.buildGeometry(this.lines);unionLines=this.unionNoOpt(lineGeom);}
var unionPolygons=null;if(this.polygons.size()>0){unionPolygons=CascadedPolygonUnion.union(this.polygons);}
var unionLA=this.unionWithNull(unionLines,unionPolygons);var union=null;if(unionPoints===null){union=unionLA;}else if(unionLA===null){union=unionPoints;}else{union=PointGeometryUnion(unionPoints,unionLA);}
if(union===null){return this.geomFact.createGeometryCollection(null);}
return union;};jsts.operation.union.UnaryUnionOp.prototype.unionWithNull=function(g0,g1){if(g0===null&&g1===null){return null;}
if(g1===null){return g0;}
if(g0===null){return g1;}
return g0.union(g1);};jsts.operation.union.UnaryUnionOp.prototype.unionNoOpt=function(g0){var empty=this.geomFact.createPoint(null);return SnapIfNeededOverlayOp.overlayOp(g0,empty,OverlayOp.UNION);};}());jsts.index.kdtree.KdNode=function(){this.left=null;this.right=null;this.count=1;if(arguments.length===2){this.initializeFromCoordinate.apply(this,arguments[0],arguments[1]);}else if(arguments.length===3){this.initializeFromXY.apply(this,arguments[0],arguments[1],arguments[2]);}};jsts.index.kdtree.KdNode.prototype.initializeFromXY=function(x,y,data){this.p=new jsts.geom.Coordinate(x,y);this.data=data;};jsts.index.kdtree.KdNode.prototype.initializeFromCoordinate=function(p,data){this.p=p;this.data=data;};jsts.index.kdtree.KdNode.prototype.getX=function(){return this.p.x;};jsts.index.kdtree.KdNode.prototype.getY=function(){return this.p.y;};jsts.index.kdtree.KdNode.prototype.getCoordinate=function(){return this.p;};jsts.index.kdtree.KdNode.prototype.getData=function(){return this.data;};jsts.index.kdtree.KdNode.prototype.getLeft=function(){return this.left;};jsts.index.kdtree.KdNode.prototype.getRight=function(){return this.right;};jsts.index.kdtree.KdNode.prototype.increment=function(){this.count+=1;};jsts.index.kdtree.KdNode.prototype.getCount=function(){return this.count;};jsts.index.kdtree.KdNode.prototype.isRepeated=function(){return count>1;};jsts.index.kdtree.KdNode.prototype.setLeft=function(left){this.left=left;};jsts.index.kdtree.KdNode.prototype.setRight=function(right){this.right=right;};(function(){jsts.geom.MultiLineString=function(geometries,factory){this.geometries=geometries||[];this.factory=factory;};jsts.geom.MultiLineString.prototype=new jsts.geom.GeometryCollection();jsts.geom.MultiLineString.constructor=jsts.geom.MultiLineString;jsts.geom.MultiLineString.prototype.getBoundary=function(){return(new jsts.operation.BoundaryOp(this)).getBoundary();};jsts.geom.MultiLineString.prototype.equalsExact=function(other,tolerance){if(!this.isEquivalentClass(other)){return false;}
return jsts.geom.GeometryCollection.prototype.equalsExact.call(this,other,tolerance);};jsts.geom.MultiLineString.prototype.CLASS_NAME='jsts.geom.MultiLineString';})();jsts.algorithm.BoundaryNodeRule=function(){};jsts.algorithm.BoundaryNodeRule.prototype.isInBoundary=function(boundaryCount){throw new jsts.error.AbstractMethodInvocationError();};jsts.algorithm.Mod2BoundaryNodeRule=function(){};jsts.algorithm.Mod2BoundaryNodeRule.prototype=new jsts.algorithm.BoundaryNodeRule();jsts.algorithm.Mod2BoundaryNodeRule.prototype.isInBoundary=function(boundaryCount){return boundaryCount%2===1;};jsts.algorithm.BoundaryNodeRule.MOD2_BOUNDARY_RULE=new jsts.algorithm.Mod2BoundaryNodeRule();jsts.algorithm.BoundaryNodeRule.OGC_SFS_BOUNDARY_RULE=jsts.algorithm.BoundaryNodeRule.MOD2_BOUNDARY_RULE;jsts.operation.buffer.BufferBuilder=function(bufParams){this.bufParams=bufParams;this.edgeList=new jsts.geomgraph.EdgeList();};jsts.operation.buffer.BufferBuilder.depthDelta=function(label){var lLoc=label.getLocation(0,jsts.geomgraph.Position.LEFT);var rLoc=label.getLocation(0,jsts.geomgraph.Position.RIGHT);if(lLoc===jsts.geom.Location.INTERIOR&&rLoc===jsts.geom.Location.EXTERIOR)
return 1;else if(lLoc===jsts.geom.Location.EXTERIOR&&rLoc===jsts.geom.Location.INTERIOR)
return-1;return 0;};jsts.operation.buffer.BufferBuilder.prototype.bufParams=null;jsts.operation.buffer.BufferBuilder.prototype.workingPrecisionModel=null;jsts.operation.buffer.BufferBuilder.prototype.workingNoder=null;jsts.operation.buffer.BufferBuilder.prototype.geomFact=null;jsts.operation.buffer.BufferBuilder.prototype.graph=null;jsts.operation.buffer.BufferBuilder.prototype.edgeList=null;jsts.operation.buffer.BufferBuilder.prototype.setWorkingPrecisionModel=function(pm){this.workingPrecisionModel=pm;};jsts.operation.buffer.BufferBuilder.prototype.setNoder=function(noder){this.workingNoder=noder;};jsts.operation.buffer.BufferBuilder.prototype.buffer=function(g,distance){var precisionModel=this.workingPrecisionModel;if(precisionModel===null)
precisionModel=g.getPrecisionModel();this.geomFact=g.getFactory();var curveBuilder=new jsts.operation.buffer.OffsetCurveBuilder(precisionModel,this.bufParams);var curveSetBuilder=new jsts.operation.buffer.OffsetCurveSetBuilder(g,distance,curveBuilder);var bufferSegStrList=curveSetBuilder.getCurves();if(bufferSegStrList.size()<=0){return this.createEmptyResultGeometry();}
this.computeNodedEdges(bufferSegStrList,precisionModel);this.graph=new jsts.geomgraph.PlanarGraph(new jsts.operation.overlay.OverlayNodeFactory());this.graph.addEdges(this.edgeList.getEdges());var subgraphList=this.createSubgraphs(this.graph);var polyBuilder=new jsts.operation.overlay.PolygonBuilder(this.geomFact);this.buildSubgraphs(subgraphList,polyBuilder);var resultPolyList=polyBuilder.getPolygons();if(resultPolyList.size()<=0){return this.createEmptyResultGeometry();}
var resultGeom=this.geomFact.buildGeometry(resultPolyList);return resultGeom;};jsts.operation.buffer.BufferBuilder.prototype.getNoder=function(precisionModel){if(this.workingNoder!==null)
return this.workingNoder;var noder=new jsts.noding.MCIndexNoder();var li=new jsts.algorithm.RobustLineIntersector();li.setPrecisionModel(precisionModel);noder.setSegmentIntersector(new jsts.noding.IntersectionAdder(li));return noder;};jsts.operation.buffer.BufferBuilder.prototype.computeNodedEdges=function(bufferSegStrList,precisionModel){var noder=this.getNoder(precisionModel);noder.computeNodes(bufferSegStrList);var nodedSegStrings=noder.getNodedSubstrings();for(var i=nodedSegStrings.iterator();i.hasNext();){var segStr=i.next();var oldLabel=segStr.getData();var edge=new jsts.geomgraph.Edge(segStr.getCoordinates(),new jsts.geomgraph.Label(oldLabel));this.insertUniqueEdge(edge);}};jsts.operation.buffer.BufferBuilder.prototype.insertUniqueEdge=function(e){var existingEdge=this.edgeList.findEqualEdge(e);if(existingEdge!=null){var existingLabel=existingEdge.getLabel();var labelToMerge=e.getLabel();if(!existingEdge.isPointwiseEqual(e)){labelToMerge=new jsts.geomgraph.Label(e.getLabel());labelToMerge.flip();}
existingLabel.merge(labelToMerge);var mergeDelta=jsts.operation.buffer.BufferBuilder.depthDelta(labelToMerge);var existingDelta=existingEdge.getDepthDelta();var newDelta=existingDelta+mergeDelta;existingEdge.setDepthDelta(newDelta);}else{this.edgeList.add(e);e.setDepthDelta(jsts.operation.buffer.BufferBuilder.depthDelta(e.getLabel()));}};jsts.operation.buffer.BufferBuilder.prototype.createSubgraphs=function(graph){var subgraphList=[];for(var i=graph.getNodes().iterator();i.hasNext();){var node=i.next();if(!node.isVisited()){var subgraph=new jsts.operation.buffer.BufferSubgraph();subgraph.create(node);subgraphList.push(subgraph);}}
var compare=function(a,b){return a.compareTo(b);};subgraphList.sort(compare);subgraphList.reverse();return subgraphList;};jsts.operation.buffer.BufferBuilder.prototype.buildSubgraphs=function(subgraphList,polyBuilder){var processedGraphs=[];for(var i=0;i<subgraphList.length;i++){var subgraph=subgraphList[i];var p=subgraph.getRightmostCoordinate();var locater=new jsts.operation.buffer.SubgraphDepthLocater(processedGraphs);var outsideDepth=locater.getDepth(p);subgraph.computeDepth(outsideDepth);subgraph.findResultEdges();processedGraphs.push(subgraph);polyBuilder.add(subgraph.getDirectedEdges(),subgraph.getNodes());}};jsts.operation.buffer.BufferBuilder.convertSegStrings=function(it){var fact=new jsts.geom.GeometryFactory();var lines=new javascript.util.ArrayList();while(it.hasNext()){var ss=it.next();var line=fact.createLineString(ss.getCoordinates());lines.add(line);}
return fact.buildGeometry(lines);};jsts.operation.buffer.BufferBuilder.prototype.createEmptyResultGeometry=function(){var emptyGeom=this.geomFact.createPolygon(null,null);return emptyGeom;};jsts.operation.relate.EdgeEndBundle=function(){this.edgeEnds=[];var e=arguments[0]instanceof jsts.geomgraph.EdgeEnd?arguments[0]:arguments[1];var edge=e.getEdge();var coord=e.getCoordinate();var dirCoord=e.getDirectedCoordinate();var label=new jsts.geomgraph.Label(e.getLabel());jsts.geomgraph.EdgeEnd.call(this,edge,coord,dirCoord,label);this.insert(e);};jsts.operation.relate.EdgeEndBundle.prototype=new jsts.geomgraph.EdgeEnd();jsts.operation.relate.EdgeEndBundle.prototype.edgeEnds=null;jsts.operation.relate.EdgeEndBundle.prototype.getLabel=function(){return this.label;};jsts.operation.relate.EdgeEndBundle.prototype.getEdgeEnds=function(){return this.edgeEnds;};jsts.operation.relate.EdgeEndBundle.prototype.insert=function(e){this.edgeEnds.push(e);};jsts.operation.relate.EdgeEndBundle.prototype.computeLabel=function(boundaryNodeRule){var isArea=false;for(var i=0;i<this.edgeEnds.length;i++){var e=this.edgeEnds[i];if(e.getLabel().isArea())
isArea=true;}
if(isArea)
this.label=new jsts.geomgraph.Label(jsts.geom.Location.NONE,jsts.geom.Location.NONE,jsts.geom.Location.NONE);else
this.label=new jsts.geomgraph.Label(jsts.geom.Location.NONE);for(var i=0;i<2;i++){this.computeLabelOn(i,boundaryNodeRule);if(isArea)
this.computeLabelSides(i);}};jsts.operation.relate.EdgeEndBundle.prototype.computeLabelOn=function(geomIndex,boundaryNodeRule){var boundaryCount=0;var foundInterior=false;for(var i=0;i<this.edgeEnds.length;i++){var e=this.edgeEnds[i];var loc=e.getLabel().getLocation(geomIndex);if(loc==jsts.geom.Location.BOUNDARY)
boundaryCount++;if(loc==jsts.geom.Location.INTERIOR)
foundInterior=true;}
var loc=jsts.geom.Location.NONE;if(foundInterior)
loc=jsts.geom.Location.INTERIOR;if(boundaryCount>0){loc=jsts.geomgraph.GeometryGraph.determineBoundary(boundaryNodeRule,boundaryCount);}
this.label.setLocation(geomIndex,loc);};jsts.operation.relate.EdgeEndBundle.prototype.computeLabelSides=function(geomIndex){this.computeLabelSide(geomIndex,jsts.geomgraph.Position.LEFT);this.computeLabelSide(geomIndex,jsts.geomgraph.Position.RIGHT);};jsts.operation.relate.EdgeEndBundle.prototype.computeLabelSide=function(geomIndex,side){for(var i=0;i<this.edgeEnds.length;i++){var e=this.edgeEnds[i];if(e.getLabel().isArea()){var loc=e.getLabel().getLocation(geomIndex,side);if(loc===jsts.geom.Location.INTERIOR){this.label.setLocation(geomIndex,side,jsts.geom.Location.INTERIOR);return;}else if(loc===jsts.geom.Location.EXTERIOR)
this.label.setLocation(geomIndex,side,jsts.geom.Location.EXTERIOR);}}};jsts.operation.relate.EdgeEndBundle.prototype.updateIM=function(im){jsts.geomgraph.Edge.updateIM(this.label,im);};jsts.index.chain.MonotoneChain=function(pts,start,end,context){this.pts=pts;this.start=start;this.end=end;this.context=context;};jsts.index.chain.MonotoneChain.prototype.pts=null;jsts.index.chain.MonotoneChain.prototype.start=null;jsts.index.chain.MonotoneChain.prototype.end=null;jsts.index.chain.MonotoneChain.prototype.env=null;jsts.index.chain.MonotoneChain.prototype.context=null;jsts.index.chain.MonotoneChain.prototype.id=null;jsts.index.chain.MonotoneChain.prototype.setId=function(id){this.id=id;};jsts.index.chain.MonotoneChain.prototype.getId=function(){return this.id;};jsts.index.chain.MonotoneChain.prototype.getContext=function(){return this.context;};jsts.index.chain.MonotoneChain.prototype.getEnvelope=function(){if(this.env==null){var p0=this.pts[this.start];var p1=this.pts[this.end];this.env=new jsts.geom.Envelope(p0,p1);}
return this.env;};jsts.index.chain.MonotoneChain.prototype.getStartIndex=function(){return this.start;};jsts.index.chain.MonotoneChain.prototype.getEndIndex=function(){return this.end;};jsts.index.chain.MonotoneChain.prototype.getLineSegment=function(index,ls){ls.p0=this.pts[index];ls.p1=this.pts[index+1];};jsts.index.chain.MonotoneChain.prototype.getCoordinates=function(){var coord=[];var index=0;for(var i=this.start;i<=this.end;i++){coord[index++]=this.pts[i];}
return coord;};jsts.index.chain.MonotoneChain.prototype.select=function(searchEnv,mcs){this.computeSelect2(searchEnv,this.start,this.end,mcs);};jsts.index.chain.MonotoneChain.prototype.computeSelect2=function(searchEnv,start0,end0,mcs){var p0=this.pts[start0];var p1=this.pts[end0];mcs.tempEnv1.init(p0,p1);if(end0-start0===1){mcs.select(this,start0);return;}
if(!searchEnv.intersects(mcs.tempEnv1))
return;var mid=parseInt((start0+end0)/2);if(start0<mid){this.computeSelect2(searchEnv,start0,mid,mcs);}
if(mid<end0){this.computeSelect2(searchEnv,mid,end0,mcs);}};jsts.index.chain.MonotoneChain.prototype.computeOverlaps=function(mc,mco){if(arguments.length===6){return this.computeOverlaps2.apply(this,arguments);}
this.computeOverlaps2(this.start,this.end,mc,mc.start,mc.end,mco);};jsts.index.chain.MonotoneChain.prototype.computeOverlaps2=function(start0,end0,mc,start1,end1,mco){var p00=this.pts[start0];var p01=this.pts[end0];var p10=mc.pts[start1];var p11=mc.pts[end1];if(end0-start0===1&&end1-start1===1){mco.overlap(this,start0,mc,start1);return;}
mco.tempEnv1.init(p00,p01);mco.tempEnv2.init(p10,p11);if(!mco.tempEnv1.intersects(mco.tempEnv2))
return;var mid0=parseInt((start0+end0)/2);var mid1=parseInt((start1+end1)/2);if(start0<mid0){if(start1<mid1)
this.computeOverlaps2(start0,mid0,mc,start1,mid1,mco);if(mid1<end1)
this.computeOverlaps2(start0,mid0,mc,mid1,end1,mco);}
if(mid0<end0){if(start1<mid1)
this.computeOverlaps2(mid0,end0,mc,start1,mid1,mco);if(mid1<end1)
this.computeOverlaps2(mid0,end0,mc,mid1,end1,mco);}};(function(){var Location=jsts.geom.Location;var Dimension=jsts.geom.Dimension;jsts.geom.IntersectionMatrix=function(elements){var other=elements;if(elements===undefined||elements===null){this.matrix=[[],[],[]];this.setAll(Dimension.FALSE);}else if(typeof elements==='string'){this.set(elements);}else if(other instanceof jsts.geom.IntersectionMatrix){this.matrix[Location.INTERIOR][Location.INTERIOR]=other.matrix[Location.INTERIOR][Location.INTERIOR];this.matrix[Location.INTERIOR][Location.BOUNDARY]=other.matrix[Location.INTERIOR][Location.BOUNDARY];this.matrix[Location.INTERIOR][Location.EXTERIOR]=other.matrix[Location.INTERIOR][Location.EXTERIOR];this.matrix[Location.BOUNDARY][Location.INTERIOR]=other.matrix[Location.BOUNDARY][Location.INTERIOR];this.matrix[Location.BOUNDARY][Location.BOUNDARY]=other.matrix[Location.BOUNDARY][Location.BOUNDARY];this.matrix[Location.BOUNDARY][Location.EXTERIOR]=other.matrix[Location.BOUNDARY][Location.EXTERIOR];this.matrix[Location.EXTERIOR][Location.INTERIOR]=other.matrix[Location.EXTERIOR][Location.INTERIOR];this.matrix[Location.EXTERIOR][Location.BOUNDARY]=other.matrix[Location.EXTERIOR][Location.BOUNDARY];this.matrix[Location.EXTERIOR][Location.EXTERIOR]=other.matrix[Location.EXTERIOR][Location.EXTERIOR];}};jsts.geom.IntersectionMatrix.prototype.matrix=null;jsts.geom.IntersectionMatrix.prototype.add=function(im){var i,j;for(i=0;i<3;i++){for(j=0;j<3;j++){this.setAtLeast(i,j,im.get(i,j));}}};jsts.geom.IntersectionMatrix.matches=function(actualDimensionValue,requiredDimensionSymbol){if(typeof actualDimensionValue==='string'){return jsts.geom.IntersectionMatrix.matches2.call(this,arguments);}
if(requiredDimensionSymbol==='*'){return true;}
if(requiredDimensionSymbol==='T'&&(actualDimensionValue>=0||actualDimensionValue===Dimension.TRUE)){return true;}
if(requiredDimensionSymbol==='F'&&actualDimensionValue===Dimension.FALSE){return true;}
if(requiredDimensionSymbol==='0'&&actualDimensionValue===Dimension.P){return true;}
if(requiredDimensionSymbol==='1'&&actualDimensionValue===Dimension.L){return true;}
if(requiredDimensionSymbol==='2'&&actualDimensionValue===Dimension.A){return true;}
return false;};jsts.geom.IntersectionMatrix.matches2=function(actualDimensionSymbols,requiredDimensionSymbols){var m=new jsts.geom.IntersectionMatrix(actualDimensionSymbols);return m.matches(requiredDimensionSymbols);};jsts.geom.IntersectionMatrix.prototype.set=function(row,column,dimensionValue){if(typeof row==='string'){this.set2(row);return;}
this.matrix[row][column]=dimensionValue;};jsts.geom.IntersectionMatrix.prototype.set2=function(dimensionSymbols){for(var i=0;i<dimensionSymbols.length();i++){var row=i/3;var col=i%3;this.matrix[row][col]=Dimension.toDimensionValue(dimensionSymbols.charAt(i));}};jsts.geom.IntersectionMatrix.prototype.setAtLeast=function(row,column,minimumDimensionValue){if(arguments.length===1){this.setAtLeast2(arguments[0]);return;}
if(this.matrix[row][column]<minimumDimensionValue){this.matrix[row][column]=minimumDimensionValue;}};jsts.geom.IntersectionMatrix.prototype.setAtLeastIfValid=function(row,column,minimumDimensionValue){if(row>=0&&column>=0){this.setAtLeast(row,column,minimumDimensionValue);}};jsts.geom.IntersectionMatrix.prototype.setAtLeast2=function(minimumDimensionSymbols){var i;for(i=0;i<minimumDimensionSymbols.length;i++){var row=parseInt(i/3);var col=parseInt(i%3);this.setAtLeast(row,col,jsts.geom.Dimension.toDimensionValue(minimumDimensionSymbols.charAt(i)));}};jsts.geom.IntersectionMatrix.prototype.setAll=function(dimensionValue){var ai,bi;for(ai=0;ai<3;ai++){for(bi=0;bi<3;bi++){this.matrix[ai][bi]=dimensionValue;}}};jsts.geom.IntersectionMatrix.prototype.get=function(row,column){return this.matrix[row][column];};jsts.geom.IntersectionMatrix.prototype.isDisjoint=function(){return this.matrix[Location.INTERIOR][Location.INTERIOR]===Dimension.FALSE&&this.matrix[Location.INTERIOR][Location.BOUNDARY]===Dimension.FALSE&&this.matrix[Location.BOUNDARY][Location.INTERIOR]===Dimension.FALSE&&this.matrix[Location.BOUNDARY][Location.BOUNDARY]===Dimension.FALSE;};jsts.geom.IntersectionMatrix.prototype.isIntersects=function(){return!this.isDisjoint();};jsts.geom.IntersectionMatrix.prototype.isTouches=function(dimensionOfGeometryA,dimensionOfGeometryB){if(dimensionOfGeometryA>dimensionOfGeometryB){return this.isTouches(dimensionOfGeometryB,dimensionOfGeometryA);}
if((dimensionOfGeometryA==Dimension.A&&dimensionOfGeometryB==Dimension.A)||(dimensionOfGeometryA==Dimension.L&&dimensionOfGeometryB==Dimension.L)||(dimensionOfGeometryA==Dimension.L&&dimensionOfGeometryB==Dimension.A)||(dimensionOfGeometryA==Dimension.P&&dimensionOfGeometryB==Dimension.A)||(dimensionOfGeometryA==Dimension.P&&dimensionOfGeometryB==Dimension.L)){return this.matrix[Location.INTERIOR][Location.INTERIOR]===Dimension.FALSE&&(jsts.geom.IntersectionMatrix.matches(this.matrix[Location.INTERIOR][Location.BOUNDARY],'T')||jsts.geom.IntersectionMatrix.matches(this.matrix[Location.BOUNDARY][Location.INTERIOR],'T')||jsts.geom.IntersectionMatrix.matches(this.matrix[Location.BOUNDARY][Location.BOUNDARY],'T'));}
return false;};jsts.geom.IntersectionMatrix.prototype.isCrosses=function(dimensionOfGeometryA,dimensionOfGeometryB){if((dimensionOfGeometryA==Dimension.P&&dimensionOfGeometryB==Dimension.L)||(dimensionOfGeometryA==Dimension.P&&dimensionOfGeometryB==Dimension.A)||(dimensionOfGeometryA==Dimension.L&&dimensionOfGeometryB==Dimension.A)){return jsts.geom.IntersectionMatrix.matches(this.matrix[Location.INTERIOR][Location.INTERIOR],'T')&&jsts.geom.IntersectionMatrix.matches(this.matrix[Location.INTERIOR][Location.EXTERIOR],'T');}
if((dimensionOfGeometryA==Dimension.L&&dimensionOfGeometryB==Dimension.P)||(dimensionOfGeometryA==Dimension.A&&dimensionOfGeometryB==Dimension.P)||(dimensionOfGeometryA==Dimension.A&&dimensionOfGeometryB==Dimension.L)){return jsts.geom.IntersectionMatrix.matches(matrix[Location.INTERIOR][Location.INTERIOR],'T')&&jsts.geom.IntersectionMatrix.matches(this.matrix[Location.EXTERIOR][Location.INTERIOR],'T');}
if(dimensionOfGeometryA===Dimension.L&&dimensionOfGeometryB===Dimension.L){return this.matrix[Location.INTERIOR][Location.INTERIOR]===0;}
return false;};jsts.geom.IntersectionMatrix.prototype.isWithin=function(){return jsts.geom.IntersectionMatrix.matches(this.matrix[Location.INTERIOR][Location.INTERIOR],'T')&&this.matrix[Location.INTERIOR][Location.EXTERIOR]==Dimension.FALSE&&this.matrix[Location.BOUNDARY][Location.EXTERIOR]==Dimension.FALSE;};jsts.geom.IntersectionMatrix.prototype.isContains=function(){return jsts.geom.IntersectionMatrix.matches(this.matrix[Location.INTERIOR][Location.INTERIOR],'T')&&this.matrix[Location.EXTERIOR][Location.INTERIOR]==Dimension.FALSE&&this.matrix[Location.EXTERIOR][Location.BOUNDARY]==Dimension.FALSE;};jsts.geom.IntersectionMatrix.prototype.isCovers=function(){var hasPointInCommon=jsts.geom.IntersectionMatrix.matches(this.matrix[Location.INTERIOR][Location.INTERIOR],'T')||jsts.geom.IntersectionMatrix.matches(this.matrix[Location.INTERIOR][Location.BOUNDARY],'T')||jsts.geom.IntersectionMatrix.matches(this.matrix[Location.BOUNDARY][Location.INTERIOR],'T')||jsts.geom.IntersectionMatrix.matches(this.matrix[Location.BOUNDARY][Location.BOUNDARY],'T');return hasPointInCommon&&this.matrix[Location.EXTERIOR][Location.INTERIOR]==Dimension.FALSE&&this.matrix[Location.EXTERIOR][Location.BOUNDARY]==Dimension.FALSE;};jsts.geom.IntersectionMatrix.prototype.isCoveredBy=function(){var hasPointInCommon=jsts.geom.IntersectionMatrix.matches(this.matrix[Location.INTERIOR][Location.INTERIOR],'T')||jsts.geom.IntersectionMatrix.matches(this.matrix[Location.INTERIOR][Location.BOUNDARY],'T')||jsts.geom.IntersectionMatrix.matches(this.matrix[Location.BOUNDARY][Location.INTERIOR],'T')||jsts.geom.IntersectionMatrix.matches(this.matrix[Location.BOUNDARY][Location.BOUNDARY],'T');return hasPointInCommon&&this.matrix[Location.INTERIOR][Location.EXTERIOR]===Dimension.FALSE&&this.matrix[Location.BOUNDARY][Location.EXTERIOR]===Dimension.FALSE;};jsts.geom.IntersectionMatrix.prototype.isEquals=function(dimensionOfGeometryA,dimensionOfGeometryB){if(dimensionOfGeometryA!==dimensionOfGeometryB){return false;}
return jsts.geom.IntersectionMatrix.matches(this.matrix[Location.INTERIOR][Location.INTERIOR],'T')&&this.matrix[Location.EXTERIOR][Location.INTERIOR]===Dimension.FALSE&&this.matrix[Location.INTERIOR][Location.EXTERIOR]===Dimension.FALSE&&this.matrix[Location.EXTERIOR][Location.BOUNDARY]===Dimension.FALSE&&this.matrix[Location.BOUNDARY][Location.EXTERIOR]===Dimension.FALSE;};jsts.geom.IntersectionMatrix.prototype.isOverlaps=function(dimensionOfGeometryA,dimensionOfGeometryB){if((dimensionOfGeometryA==Dimension.P&&dimensionOfGeometryB===Dimension.P)||(dimensionOfGeometryA==Dimension.A&&dimensionOfGeometryB===Dimension.A)){return jsts.geom.IntersectionMatrix.matches(this.matrix[Location.INTERIOR][Location.INTERIOR],'T')&&jsts.geom.IntersectionMatrix.matches(this.matrix[Location.INTERIOR][Location.EXTERIOR],'T')&&jsts.geom.IntersectionMatrix.matches(this.matrix[Location.EXTERIOR][Location.INTERIOR],'T');}
if(dimensionOfGeometryA===Dimension.L&&dimensionOfGeometryB===Dimension.L){return this.matrix[Location.INTERIOR][Location.INTERIOR]==1&&jsts.geom.IntersectionMatrix.matches(this.matrix[Location.INTERIOR][Location.EXTERIOR],'T')&&jsts.geom.IntersectionMatrix.matches(this.matrix[Location.EXTERIOR][Location.INTERIOR],'T');}
return false;};jsts.geom.IntersectionMatrix.prototype.matches=function(requiredDimensionSymbols){if(requiredDimensionSymbols.length!=9){throw new jsts.error.IllegalArgumentException('Should be length 9: '+
requiredDimensionSymbols);}
for(var ai=0;ai<3;ai++){for(var bi=0;bi<3;bi++){if(!jsts.geom.IntersectionMatrix.matches(this.matrix[ai][bi],requiredDimensionSymbols.charAt(3*ai+bi))){return false;}}}
return true;};jsts.geom.IntersectionMatrix.prototype.transpose=function(){var temp=matrix[1][0];this.matrix[1][0]=this.matrix[0][1];this.matrix[0][1]=temp;temp=this.matrix[2][0];this.matrix[2][0]=this.matrix[0][2];this.matrix[0][2]=temp;temp=this.matrix[2][1];this.matrix[2][1]=this.matrix[1][2];this.matrix[1][2]=temp;return this;};jsts.geom.IntersectionMatrix.prototype.toString=function(){var ai,bi,buf='';for(ai=0;ai<3;ai++){for(bi=0;bi<3;bi++){buf+=Dimension.toDimensionSymbol(this.matrix[ai][bi]);}}
return buf;};})();jsts.triangulate.quadedge.LastFoundQuadEdgeLocator=function(subdiv){this.subdiv=subdiv;this.lastEdge=null;this.init();};jsts.triangulate.quadedge.LastFoundQuadEdgeLocator.prototype.init=function(){this.lastEdge=this.findEdge();};jsts.triangulate.quadedge.LastFoundQuadEdgeLocator.prototype.findEdge=function(){var edges=this.subdiv.getEdges();return edges[0];};jsts.triangulate.quadedge.LastFoundQuadEdgeLocator.prototype.locate=function(v){if(!this.lastEdge.isLive()){this.init();}
var e=this.subdiv.locateFromEdge(v,this.lastEdge);this.lastEdge=e;return e;};jsts.io.WKTWriter=function(){this.parser=new jsts.io.WKTParser(this.geometryFactory);};jsts.io.WKTWriter.prototype.write=function(geometry){var wkt=this.parser.write(geometry);return wkt;};jsts.io.WKTWriter.toLineString=function(p0,p1){if(arguments.length!==2){throw new jsts.error.NotImplementedError();}
return'LINESTRING ( '+p0.x+' '+p0.y+', '+p1.x+' '+p1.y+' )';};jsts.io.WKTReader=function(geometryFactory){this.geometryFactory=geometryFactory||new jsts.geom.GeometryFactory();this.precisionModel=this.geometryFactory.getPrecisionModel();this.parser=new jsts.io.WKTParser(this.geometryFactory);};jsts.io.WKTReader.prototype.read=function(wkt){var geometry=this.parser.read(wkt);if(this.precisionModel.getType()===jsts.geom.PrecisionModel.FIXED){this.reducePrecision(geometry);}
return geometry;};jsts.io.WKTReader.prototype.reducePrecision=function(geometry){var i,len;if(geometry.coordinate){this.precisionModel.makePrecise(geometry.coordinate);}else if(geometry.points){for(i=0,len=geometry.points.length;i<len;i++){this.precisionModel.makePrecise(geometry.points[i]);}}else if(geometry.geometries){for(i=0,len=geometry.geometries.length;i<len;i++){this.reducePrecision(geometry.geometries[i]);}}};jsts.triangulate.quadedge.QuadEdgeSubdivision=function(env,tolerance){this.tolerance=tolerance;this.edgeCoincidenceTolerance=tolerance/jsts.triangulate.quadedge.QuadEdgeSubdivision.EDGE_COINCIDENCE_TOL_FACTOR;this.visitedKey=0;this.quadEdges=[];this.startingEdge;this.tolerance;this.edgeCoincidenceTolerance;this.frameEnv;this.locator=null;this.seg=new jsts.geom.LineSegment();this.triEdges=new Array(3);this.frameVertex=new Array(3);this.createFrame(env);this.startingEdge=this.initSubdiv();this.locator=new jsts.triangulate.quadedge.LastFoundQuadEdgeLocator(this);};jsts.triangulate.quadedge.QuadEdgeSubdivision.EDGE_COINCIDENCE_TOL_FACTOR=1000;jsts.triangulate.quadedge.QuadEdgeSubdivision.getTriangleEdges=function(startQE,triEdge){triEdge[0]=startQE;triEdge[1]=triEdge[0].lNext();triEdge[2]=triEdge[1].lNext();if(triEdge[2].lNext()!=triEdge[0]){throw new jsts.IllegalArgumentError('Edges do not form a triangle');}};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.createFrame=function(env){var deltaX,deltaY,offset;deltaX=env.getWidth();deltaY=env.getHeight();offset=0.0;if(deltaX>deltaY){offset=deltaX*10.0;}else{offset=deltaY*10.0;}
this.frameVertex[0]=new jsts.triangulate.quadedge.Vertex((env.getMaxX()+env.getMinX())/2.0,env.getMaxY()
+offset);this.frameVertex[1]=new jsts.triangulate.quadedge.Vertex(env.getMinX()-offset,env.getMinY()-offset);this.frameVertex[2]=new jsts.triangulate.quadedge.Vertex(env.getMaxX()+offset,env.getMinY()-offset);this.frameEnv=new jsts.geom.Envelope(this.frameVertex[0].getCoordinate(),this.frameVertex[1].getCoordinate());this.frameEnv.expandToInclude(this.frameVertex[2].getCoordinate());};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.initSubdiv=function(){var ea,eb,ec;ea=this.makeEdge(this.frameVertex[0],this.frameVertex[1]);eb=this.makeEdge(this.frameVertex[1],this.frameVertex[2]);jsts.triangulate.quadedge.QuadEdge.splice(ea.sym(),eb);ec=this.makeEdge(this.frameVertex[2],this.frameVertex[0]);jsts.triangulate.quadedge.QuadEdge.splice(eb.sym(),ec);jsts.triangulate.quadedge.QuadEdge.splice(ec.sym(),ea);return ea;};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.getTolerance=function(){return this.tolerance;};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.getEnvelope=function(){return new jsts.geom.Envelope(this.frameEnv);};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.getEdges=function(){if(arguments.length>0){return this.getEdgesByFactory(arguments[0]);}else{return this.quadEdges;}};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.setLocator=function(locator){this.locator=locator;};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.makeEdge=function(o,d){var q=jsts.triangulate.quadedge.QuadEdge.makeEdge(o,d);this.quadEdges.push(q);return q;};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.connect=function(a,b){var q=jsts.triangulate.quadedge.QuadEdge.connect(a,b);this.quadEdges.push(q);return q;};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.delete_jsts=function(e){jsts.triangulate.quadedge.QuadEdge.splice(e,e.oPrev());jsts.triangulate.quadedge.QuadEdge.splice(e.sym(),e.sym().oPrev());var eSym,eRot,eRotSym;e.eSym=e.sym();eRot=e.rot;eRotSym=e.rot.sym();var idx=this.quadEdges.indexOf(e);if(idx!==-1){this.quadEdges.splice(idx,1);}
idx=this.quadEdges.indexOf(eSym);if(idx!==-1){this.quadEdges.splice(idx,1);}
idx=this.quadEdges.indexOf(eRot);if(idx!==-1){this.quadEdges.splice(idx,1);}
idx=this.quadEdges.indexOf(eRotSym);if(idx!==-1){this.quadEdges.splice(idx,1);}
e.delete_jsts();eSym.delete_jsts();eRot.delete_jsts();eRotSym.delete_jsts();};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.locateFromEdge=function(v,startEdge){var iter=0,maxIter=this.quadEdges.length,e;e=startEdge;while(true){iter++;if(iter>maxIter){throw new jsts.error.LocateFailureError(e.toLineSegment());}
if((v.equals(e.orig()))||(v.equals(e.dest()))){break;}else if(v.rightOf(e)){e=e.sym();}else if(!v.rightOf(e.oNext())){e=e.oNext();}else if(!v.rightOf(e.dPrev())){e=e.dPrev();}else{break;}}
return e;};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.locate=function(){if(arguments.length===1){if(arguments[0]instanceof jsts.triangulate.quadedge.Vertex){return this.locateByVertex(arguments[0]);}else{return this.locateByCoordinate(arguments[0]);}}else{return this.locateByCoordinates(arguments[0],arguments[1]);}};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.locateByVertex=function(v){return this.locator.locate(v);};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.locateByCoordinate=function(p){return this.locator.locate(new jsts.triangulate.quadedge.Vertex(p));};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.locateByCoordinates=function(p0,p1){var e,base,locEdge;var e=this.locator.locate(new jsts.triangulate.quadedge.Vertex(p0));if(e===null){return null;}
base=e;if(e.dest().getCoordinate().equals2D(p0)){base=e.sym();}
locEdge=base;do{if(locEdge.dest().getCoordinate().equals2D(p1)){return locEdge;}
locEdge=locEdge.oNext();}while(locEdge!=base);return null;};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.insertSite=function(v){var e,base,startEdge;e=this.locate(v);if((v.equals(e.orig(),this.tolerance))||(v.equals(e.dest(),this.tolerance))){return e;}
base=this.makeEdge(e.orig(),v);jsts.triangulate.quadedge.QuadEdge.splice(base,e);startEdge=base;do{base=this.connect(e,base.sym());e=base.oPrev();}while(e.lNext()!=startEdge);return startEdge;};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.isFrameEdge=function(e){if(this.isFrameVertex(e.orig())||this.isFrameVertex(e.dest())){return true;}
return false;};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.isFrameBorderEdge=function(e){var leftTri,rightTri,vLeftTriOther,vRightTriOther;leftTri=new Array(3);this.getTriangleEdges(e,leftTri);rightTri=new Array(3);this.getTriangleEdges(e.sym(),rightTri);vLeftTriOther=e.lNext().dest();if(this.isFrameVertex(vLeftTriOther)){return true;}
vRightTriOther=e.sym().lNext().dest();if(this.isFrameVertex(vRightTriOther)){return true;}
return false;};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.isFrameVertex=function(v){if(v.equals(this.frameVertex[0])){return true;}
if(v.equals(this.frameVertex[1])){return true;}
if(v.equals(this.frameVertex[2])){return true;}
return false;};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.isOnEdge=function(e,p){this.seg.setCoordinates(e.orig().getCoordinate(),e.dest().getCoordinate());var dist=this.seg.distance(p);return dist<this.edgeCoincidenceTolerance;};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.isVertexOfEdge=function(e,v){if((v.equals(e.orig(),this.tolerance))||(v.equals(e.dest(),this.tolerance))){return true;}
return false;};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.getVertices=function(includeFrame)
{var vertices=[],i,il,qe,v,vd;i=0,il=this.quadEdges.length;for(i;i<il;i++){qe=this.quadEdges[i];v=qe.orig();if(includeFrame||!this.isFrameVertex(v)){vertices.push(v);}
vd=qe.dest();if(includeFrame||!this.isFrameVertex(vd)){vertices.push(vd);}}
return vertices;};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.getVertexUniqueEdges=function(includeFrame)
{var edges,visitedVertices,i,il,qe,v,qd,vd;edges=[];visitedVertices=[];i=0,il=this.quadEdges.length;for(i;i<il;i++){qe=this.quadEdges[i];v=qe.orig();if(visitedVertices.indexOf(v)===-1){visitedVertices.push(v);if(includeFrame||!this.isFrameVertex(v)){edges.push(qe);}}
qd=qe.sym();vd=qd.orig();if(visitedVertices.indexOf(vd)===-1){visitedVertices.push(vd);if(includeFrame||!this.isFrameVertex(vd)){edges.push(qd);}}}
return edges;};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.getPrimaryEdges=function(includeFrame){this.visitedKey++;var edges,edgeStack,visitedEdges,edge,priQE;edges=[];edgeStack=[];edgeStack.push(this.startingEdge);visitedEdges=[];while(edgeStack.length>0){edge=edgeStack.pop();if(visitedEdges.indexOf(edge)===-1){priQE=edge.getPrimary();if(includeFrame||!this.isFrameEdge(priQE)){edges.push(priQE);}
edgeStack.push(edge.oNext());edgeStack.push(edge.sym().oNext());visitedEdges.push(edge);visitedEdges.push(edge.sym());}}
return edges;};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.visitTriangles=function(triVisitor,includeFrame){this.visitedKey++;var edgeStack,visitedEdges,edge,triEdges;edgeStack=[];edgeStack.push(this.startingEdge);visitedEdges=[];while(edgeStack.length>0){edge=edgeStack.pop();if(visitedEdges.indexOf(edge)===-1){triEdges=this.fetchTriangleToVisit(edge,edgeStack,includeFrame,visitedEdges);if(triEdges!==null)
triVisitor.visit(triEdges);}}};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.fetchTriangleToVisit=function(edge,edgeStack,includeFrame,visitedEdges){var curr,edgeCount,isFrame,sym;curr=edge;edgeCount=0;isFrame=false;do{this.triEdges[edgeCount]=curr;if(this.isFrameEdge(curr)){isFrame=true;}
sym=curr.sym();if(visitedEdges.indexOf(sym)===-1){edgeStack.push(sym);}
visitedEdges.push(curr);edgeCount++;curr=curr.lNext();}while(curr!==edge);if(isFrame&&!includeFrame){return null;}
return this.triEdges;};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.getTriangleEdges=function(includeFrame){var visitor=new jsts.triangulate.quadedge.TriangleEdgesListVisitor();this.visitTriangles(visitor,includeFrame);return visitor.getTriangleEdges();};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.getTriangleVertices=function(includeFrame){var visitor=new TriangleVertexListVisitor();this.visitTriangles(visitor,includeFrame);return visitor.getTriangleVertices();};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.getTriangleCoordinates=function(includeFrame){var visitor=new jsts.triangulate.quadedge.TriangleCoordinatesVisitor();this.visitTriangles(visitor,includeFrame);return visitor.getTriangles();};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.getEdgesByFactory=function(geomFact){var quadEdges,edges,i,il,qe,coords;quadEdges=this.getPrimaryEdges(false);edges=[];i=0;il=quadEdges.length;for(i;i<il;i++){qe=quadEdges[i];coords=[];coords[0]=(qe.orig().getCoordinate());coords[1]=(qe.dest().getCoordinate());edges[i]=geomFact.createLineString(coords);}
return geomFact.createMultiLineString(edges);};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.getTriangles=function(geomFact){var triPtsList,tris,triPt,i,il;triPtsList=this.getTriangleCoordinates(false);tris=new Array(triPtsList.length);i=0,il=triPtsList.length;for(i;i<il;i++){triPt=triPtsList[i];tris[i]=geomFact.createPolygon(geomFact.createLinearRing(triPt,null));}
return geomFact.createGeometryCollection(tris);};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.getVoronoiDiagram=function(geomFact)
{var vorCells=this.getVoronoiCellPolygons(geomFact);return geomFact.createGeometryCollection(vorCells);};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.getVoronoiCellPolygons=function(geomFact)
{this.visitTriangles(new jsts.triangulate.quadedge.TriangleCircumcentreVisitor(),true);var cells,edges,i,il,qe;cells=[];edges=this.getVertexUniqueEdges(false);i=0,il=edges.length;for(i;i<il;i++){qe=edges[i];cells.push(this.getVoronoiCellPolygon(qe,geomFact));}
return cells;};jsts.triangulate.quadedge.QuadEdgeSubdivision.prototype.getVoronoiCellPolygon=function(qe,geomFact)
{var cellPts,startQe,cc,coordList,cellPoly,v;cellPts=[];startQE=qe;do{cc=qe.rot.orig().getCoordinate();cellPts.push(cc);qe=qe.oPrev();}while(qe!==startQE);coordList=new jsts.geom.CoordinateList([],false);coordList.add(cellPts,false);coordList.closeRing();if(coordList.size()<4){coordList.add(coordList.get(coordList.size()-1),true);}
cellPoly=geomFact.createPolygon(geomFact.createLinearRing(coordList.toArray()),null);v=startQE.orig();return cellPoly;};jsts.triangulate.quadedge.TriangleCircumcentreVisitor=function(){};jsts.triangulate.quadedge.TriangleCircumcentreVisitor.prototype.visit=function(triEdges){var a,b,c,cc,ccVertex,i;a=triEdges[0].orig().getCoordinate();b=triEdges[1].orig().getCoordinate();c=triEdges[2].orig().getCoordinate();cc=jsts.geom.Triangle.circumcentre(a,b,c);ccVertex=new jsts.triangulate.quadedge.Vertex(cc);i=0;for(i;i<3;i++){triEdges[i].rot.setOrig(ccVertex);}};jsts.triangulate.quadedge.TriangleEdgesListVisitor=function(){this.triList=[];};jsts.triangulate.quadedge.TriangleEdgesListVisitor.prototype.visit=function(triEdges){var clone=triEdges.concat();this.triList.push(clone);};jsts.triangulate.quadedge.TriangleEdgesListVisitor.prototype.getTriangleEdges=function(){return this.triList;};jsts.triangulate.quadedge.TriangleVertexListVisitor=function(){this.triList=[];};jsts.triangulate.quadedge.TriangleVertexListVisitor.prototype.visit=function(triEdges){var vertices=[];vertices.push(trieEdges[0].orig());vertices.push(trieEdges[1].orig());vertices.push(trieEdges[2].orig());this.triList.push(vertices);};jsts.triangulate.quadedge.TriangleVertexListVisitor.prototype.getTriangleVertices=function(){return this.triList;};jsts.triangulate.quadedge.TriangleCoordinatesVisitor=function(){this.coordList=new jsts.geom.CoordinateList([],false);this.triCoords=[];};jsts.triangulate.quadedge.TriangleCoordinatesVisitor.prototype.visit=function(triEdges){this.coordList=new jsts.geom.CoordinateList([],false);var i=0,v,pts;for(i;i<3;i++){v=triEdges[i].orig();this.coordList.add(v.getCoordinate());}
if(this.coordList.size()>0){this.coordList.closeRing();pts=this.coordList.toArray();if(pts.length!==4){return;}
this.triCoords.push(pts);}};jsts.triangulate.quadedge.TriangleCoordinatesVisitor.prototype.getTriangles=function(){return this.triCoords;};jsts.index.kdtree.KdTree=function(tolerance){var tol=0.0;if(tolerance!==undefined){tol=tolerance;}
this.root=null;this.last=null;this.numberOfNodes=0;this.tolerance=tol;};jsts.index.kdtree.KdTree.prototype.insert=function(){if(arguments.length===1){return this.insertCoordinate.apply(this,arguments[0]);}else{return this.insertWithData.apply(this,arguments[0],arguments[1]);}};jsts.index.kdtree.KdTree.prototype.insertCoordinate=function(p){return this.insertWithData(p,null);};jsts.index.kdtree.KdTree.prototype.insertWithData=function(p,data){if(this.root===null){this.root=new jsts.index.kdtree.KdNode(p,data);return this.root;}
var currentNode=this.root,leafNode=this.root,isOddLevel=true,isLessThan=true;while(currentNode!==last){if(isOddLevel){isLessThan=p.x<currentNode.getX();}else{isLessThan=p.y<currentNode.getY();}
leafNode=currentNode;if(isLessThan){currentNode=currentNode.getLeft();}else{currentNode=currentNode.getRight();}
if(currentNode!==null){var isInTolerance=p.distance(currentNode.getCoordinate())<=this.tolerance;if(isInTolerance){currentNode.increment();return currentNode;}}
isOddLevel=!isOddLevel;}
this.numberOfNodes=numberOfNodes+1;var node=new jsts.index.kdtree.KdNode(p,data);node.setLeft(this.last);node.setRight(this.last);if(isLessThan){leafNode.setLeft(node);}else{leafNode.setRight(node);}
return node;};jsts.index.kdtree.KdTree.prototype.queryNode=function(currentNode,bottomNode,queryEnv,odd,result){if(currentNode===bottomNode){return;}
var min,max,discriminant;if(odd){min=queryEnv.getMinX();max=queryEnv.getMaxX();discriminant=currentNode.getX();}else{min=queryEnv.getMinY();max=queryEnv.getMaxY();discriminant=currentNode.getY();}
var searchLeft=min<discriminant;var searchRight=discriminant<=max;if(searchLeft){this.queryNode(currentNode.getLeft(),bottomNode,queryEnv,!odd,result);}
if(queryEnv.contains(currentNode.getCoordinate())){result.add(currentNode);}
if(searchRight){this.queryNode(currentNode.getRight(),bottomNode,queryEnv,!odd,result);}};jsts.index.kdtree.KdTree.prototype.query=function(){if(arguments.length===1){return this.queryByEnvelope.apply(this,arguments[0]);}else{return this.queryWithArray.apply(this,arguments[0],arguments[1]);}};jsts.index.kdtree.KdTree.prototype.queryByEnvelope=function(queryEnv){var result=[];this.queryNode(this.root,this.last,queryEnv,true,result);return result;};jsts.index.kdtree.KdTree.prototype.queryWithArray=function(queryEnv,result){this.queryNode(this.root,this.last,queryEnv,true,result);};jsts.operation.relate.RelateOp=function(){jsts.operation.GeometryGraphOperation.apply(this,arguments);this._relate=new jsts.operation.relate.RelateComputer(this.arg);};jsts.operation.relate.RelateOp.prototype=new jsts.operation.GeometryGraphOperation();jsts.operation.relate.RelateOp.relate=function(a,b,boundaryNodeRule){var relOp=new jsts.operation.relate.RelateOp(a,b,boundaryNodeRule);var im=relOp.getIntersectionMatrix();return im;};jsts.operation.relate.RelateOp.prototype._relate=null;jsts.operation.relate.RelateOp.prototype.getIntersectionMatrix=function(){return this._relate.computeIM();};jsts.geom.Triangle=function(p0,p1,p2){this.p0=p0;this.p1=p1;this.p2=p2;};jsts.geom.Triangle.isAcute=function(a,b,c){if(!jsts.algorithm.Angle.isAcute(a,b,c)){return false;}
if(!jsts.algorithm.Angle.isAcute(b,c,a)){return false;}
if(!jsts.algorithm.Angle.isAcute(c,a,b)){return false;}
return true;};jsts.geom.Triangle.perpendicularBisector=function(a,b){var dx,dy,l1,l2;dx=b.x-a.x;dy=b.y-a.y;l1=new jsts.algorithm.HCoordinate(a.x+dx/2.0,a.y+dy/2.0,1.0);l2=new jsts.algorithm.HCoordinate(a.x-dy+dx/2.0,a.y+dx+dy/2.0,1.0);return new jsts.algorithm.HCoordinate(l1,l2);};jsts.geom.Triangle.circumcentre=function(a,b,c){var cx,cy,ax,ay,bx,by,denom,numx,numy,ccx,ccy;cx=c.x;cy=c.y;ax=a.x-cx;ay=a.y-cy;bx=b.x-cx;by=b.y-cy;denom=2*jsts.geom.Triangle.det(ax,ay,bx,by);numx=jsts.geom.Triangle.det(ay,ax*ax+ay*ay,by,bx*bx+by*by);numy=jsts.geom.Triangle.det(ax,ax*ax+ay*ay,bx,bx*bx+by*by);ccx=cx-numx/denom;ccy=cy+numy/denom;return new jsts.geom.Coordinate(ccx,ccy);};jsts.geom.Triangle.det=function(m00,m01,m10,m11){return m00*m11-m01*m10;};jsts.geom.Triangle.inCentre=function(a,b,c){var len0,len1,len2,circum,inCentreX,inCentreY;len0=b.distance(c);len1=a.distance(c);len2=a.distance(b);circum=len0+len1+len2;inCentreX=(len0*a.x+len1*b.x+len2*c.x)/circum;inCentreY=(len0*a.y+len1*b.y+len2*c.y)/circum;return new jsts.geom.Coordinate(inCentreX,inCentreY);};jsts.geom.Triangle.centroid=function(a,b,c){var x,y;x=(a.x+b.x+c.x)/3;y=(a.y+b.y+c.y)/3;return new jsts.geom.Coordinate(x,y);};jsts.geom.Triangle.longestSideLength=function(a,b,c){var lenAB,lenBC,lenCA,maxLen;lenAB=a.distance(b);lenBC=b.distance(c);lenCA=c.distance(a);maxLen=lenAB;if(lenBC>maxLen){maxLen=lenBC;}
if(lenCA>maxLen){maxLen=lenCA;}
return maxLen;};jsts.geom.Triangle.angleBisector=function(a,b,c){var len0,len2,frac,dx,dy,splitPt;len0=b.distance(a);len2=b.distance(c);frac=len0/(len0+len2);dx=c.x-a.x;dy=c.y-a.y;splitPt=new jsts.geom.Coordinate(a.x+frac*dx,a.y+frac*dy);return splitPt;};jsts.geom.Triangle.area=function(a,b,c){return Math.abs(((c.x-a.x)*(b.y-a.y)-(b.x-a.x)*(c.y-a.y))/2.0);};jsts.geom.Triangle.signedArea=function(a,b,c){return((c.x-a.x)*(b.y-a.y)-(b.x-a.x)*(c.y-a.y))/2.0;};jsts.geom.Triangle.prototype.inCentre=function(){return jsts.geom.Triangle.inCentre(this.p0,this.p1,this.p2);};jsts.algorithm.CentroidArea=function(){this.basePt=null;this.triangleCent3=new jsts.geom.Coordinate();this.centSum=new jsts.geom.Coordinate();this.cg3=new jsts.geom.Coordinate();};jsts.algorithm.CentroidArea.prototype.basePt=null;jsts.algorithm.CentroidArea.prototype.triangleCent3=null;jsts.algorithm.CentroidArea.prototype.areasum2=0;jsts.algorithm.CentroidArea.prototype.cg3=null;jsts.algorithm.CentroidArea.prototype.centSum=null;jsts.algorithm.CentroidArea.prototype.totalLength=0.0;jsts.algorithm.CentroidArea.prototype.add=function(geom){if(geom instanceof jsts.geom.Polygon){var poly=geom;this.setBasePoint(poly.getExteriorRing().getCoordinateN(0));this.add3(poly);}else if(geom instanceof jsts.geom.GeometryCollection||geom instanceof jsts.geom.MultiPolygon){var gc=geom;for(var i=0;i<gc.getNumGeometries();i++){this.add(gc.getGeometryN(i));}}else if(geom instanceof Array){this.add2(geom);}};jsts.algorithm.CentroidArea.prototype.add2=function(ring){this.setBasePoint(ring[0]);this.addShell(ring);};jsts.algorithm.CentroidArea.prototype.getCentroid=function(){var cent=new jsts.geom.Coordinate();if(Math.abs(this.areasum2)>0.0){cent.x=this.cg3.x/3/this.areasum2;cent.y=this.cg3.y/3/this.areasum2;}else{cent.x=this.centSum.x/this.totalLength;cent.y=this.centSum.y/this.totalLength;}
return cent;};jsts.algorithm.CentroidArea.prototype.setBasePoint=function(basePt){if(this.basePt==null)
this.basePt=basePt;};jsts.algorithm.CentroidArea.prototype.add3=function(poly){this.addShell(poly.getExteriorRing().getCoordinates());for(var i=0;i<poly.getNumInteriorRing();i++){this.addHole(poly.getInteriorRingN(i).getCoordinates());}};jsts.algorithm.CentroidArea.prototype.addShell=function(pts){var isPositiveArea=!jsts.algorithm.CGAlgorithms.isCCW(pts);for(var i=0;i<pts.length-1;i++){this.addTriangle(this.basePt,pts[i],pts[i+1],isPositiveArea);}
this.addLinearSegments(pts);};jsts.algorithm.CentroidArea.prototype.addHole=function(pts){var isPositiveArea=jsts.algorithm.CGAlgorithms.isCCW(pts);for(var i=0;i<pts.length-1;i++){this.addTriangle(this.basePt,pts[i],pts[i+1],isPositiveArea);}
this.addLinearSegments(pts);};jsts.algorithm.CentroidArea.prototype.addTriangle=function(p0,p1,p2,isPositiveArea){var sign=(isPositiveArea)?1.0:-1.0;jsts.algorithm.CentroidArea.centroid3(p0,p1,p2,this.triangleCent3);var area2=jsts.algorithm.CentroidArea.area2(p0,p1,p2);this.cg3.x+=sign*area2*this.triangleCent3.x;this.cg3.y+=sign*area2*this.triangleCent3.y;this.areasum2+=sign*area2;};jsts.algorithm.CentroidArea.centroid3=function(p1,p2,p3,c){c.x=p1.x+p2.x+p3.x;c.y=p1.y+p2.y+p3.y;return;};jsts.algorithm.CentroidArea.area2=function(p1,p2,p3){return(p2.x-p1.x)*(p3.y-p1.y)-(p3.x-p1.x)*(p2.y-p1.y);};jsts.algorithm.CentroidArea.prototype.addLinearSegments=function(pts){for(var i=0;i<pts.length-1;i++){var segmentLen=pts[i].distance(pts[i+1]);this.totalLength+=segmentLen;var midx=(pts[i].x+pts[i+1].x)/2;this.centSum.x+=segmentLen*midx;var midy=(pts[i].y+pts[i+1].y)/2;this.centSum.y+=segmentLen*midy;}};jsts.algorithm.CentralEndpointIntersector=function(p00,p01,p10,p11){this.pts=[p00,p01,p10,p11];this.compute();};jsts.algorithm.CentralEndpointIntersector.getIntersection=function(p00,p01,p10,p11){var intor=new jsts.algorithm.CentralEndpointIntersector(p00,p01,p10,p11);return intor.getIntersection();};jsts.algorithm.CentralEndpointIntersector.prototype.pts=null;jsts.algorithm.CentralEndpointIntersector.prototype.intPt=null;jsts.algorithm.CentralEndpointIntersector.prototype.compute=function(){var centroid=jsts.algorithm.CentralEndpointIntersector.average(this.pts);this.intPt=this.findNearestPoint(centroid,this.pts);};jsts.algorithm.CentralEndpointIntersector.prototype.getIntersection=function(){return this.intPt;};jsts.algorithm.CentralEndpointIntersector.average=function(pts){var avg=new jsts.geom.Coordinate();var i,n=pts.length;for(i=0;i<n;i++){avg.x+=pts[i].x;avg.y+=pts[i].y;}
if(n>0){avg.x/=n;avg.y/=n;}
return avg;};jsts.algorithm.CentralEndpointIntersector.prototype.findNearestPoint=function(p,pts){var minDist=Number.MAX_VALUE;var i,result=null,dist;for(i=0;i<pts.length;i++){dist=p.distance(pts[i]);if(dist<minDist){minDist=dist;result=pts[i];}}
return result;};(function(){var ArrayList=javascript.util.ArrayList;var GeometryComponentFilter=jsts.geom.GeometryComponentFilter;var LineString=jsts.geom.LineString;var EdgeRing=jsts.operation.polygonize.EdgeRing;var PolygonizeGraph=jsts.operation.polygonize.PolygonizeGraph;var Polygonizer=function(){var that=this;var LineStringAdder=function(){};LineStringAdder.prototype=new GeometryComponentFilter();LineStringAdder.prototype.filter=function(g){if(g instanceof LineString)
that.add(g);};this.lineStringAdder=new LineStringAdder();this.dangles=new ArrayList();this.cutEdges=new ArrayList();this.invalidRingLines=new ArrayList();};Polygonizer.prototype.lineStringAdder=null;Polygonizer.prototype.graph=null;Polygonizer.prototype.dangles=null;Polygonizer.prototype.cutEdges=null;Polygonizer.prototype.invalidRingLines=null;Polygonizer.prototype.holeList=null;Polygonizer.prototype.shellList=null;Polygonizer.prototype.polyList=null;Polygonizer.prototype.add=function(geomList){if(geomList instanceof jsts.geom.LineString){return this.add3(geomList);}else if(geomList instanceof jsts.geom.Geometry){return this.add2(geomList);}
for(var i=geomList.iterator();i.hasNext();){var geometry=i.next();this.add2(geometry);}};Polygonizer.prototype.add2=function(g){g.apply(this.lineStringAdder);};Polygonizer.prototype.add3=function(line){if(this.graph==null)
this.graph=new PolygonizeGraph(line.getFactory());this.graph.addEdge(line);};Polygonizer.prototype.getPolygons=function(){this.polygonize();return this.polyList;};Polygonizer.prototype.getDangles=function(){this.polygonize();return this.dangles;};Polygonizer.prototype.getCutEdges=function(){this.polygonize();return this.cutEdges;};Polygonizer.prototype.getInvalidRingLines=function(){this.polygonize();return this.invalidRingLines;};Polygonizer.prototype.polygonize=function(){if(this.polyList!=null)
return;this.polyList=new ArrayList();if(this.graph==null)
return;this.dangles=this.graph.deleteDangles();this.cutEdges=this.graph.deleteCutEdges();var edgeRingList=this.graph.getEdgeRings();var validEdgeRingList=new ArrayList();this.invalidRingLines=new ArrayList();this.findValidRings(edgeRingList,validEdgeRingList,this.invalidRingLines);this.findShellsAndHoles(validEdgeRingList);Polygonizer.assignHolesToShells(this.holeList,this.shellList);this.polyList=new ArrayList();for(var i=this.shellList.iterator();i.hasNext();){var er=i.next();this.polyList.add(er.getPolygon());}};Polygonizer.prototype.findValidRings=function(edgeRingList,validEdgeRingList,invalidRingList){for(var i=edgeRingList.iterator();i.hasNext();){var er=i.next();if(er.isValid())
validEdgeRingList.add(er);else
invalidRingList.add(er.getLineString());}};Polygonizer.prototype.findShellsAndHoles=function(edgeRingList){this.holeList=new ArrayList();this.shellList=new ArrayList();for(var i=edgeRingList.iterator();i.hasNext();){var er=i.next();if(er.isHole())
this.holeList.add(er);else
this.shellList.add(er);}};Polygonizer.assignHolesToShells=function(holeList,shellList){for(var i=holeList.iterator();i.hasNext();){var holeER=i.next();Polygonizer.assignHoleToShell(holeER,shellList);}};Polygonizer.assignHoleToShell=function(holeER,shellList){var shell=EdgeRing.findEdgeRingContaining(holeER,shellList);if(shell!=null)
shell.addHole(holeER.getRing());};jsts.operation.polygonize.Polygonizer=Polygonizer;})();jsts.operation.relate.RelateNode=function(coord,edges){jsts.geomgraph.Node.apply(this,arguments);};jsts.operation.relate.RelateNode.prototype=new jsts.geomgraph.Node();jsts.operation.relate.RelateNode.prototype.computeIM=function(im){im.setAtLeastIfValid(this.label.getLocation(0),this.label.getLocation(1),0);};jsts.operation.relate.RelateNode.prototype.updateIMFromEdges=function(im){this.edges.updateIM(im);};jsts.operation.buffer.OffsetSegmentString=function(){this.ptList=[];};jsts.operation.buffer.OffsetSegmentString.prototype.ptList=null;jsts.operation.buffer.OffsetSegmentString.prototype.precisionModel=null;jsts.operation.buffer.OffsetSegmentString.prototype.minimimVertexDistance=0.0;jsts.operation.buffer.OffsetSegmentString.prototype.setPrecisionModel=function(precisionModel){this.precisionModel=precisionModel;};jsts.operation.buffer.OffsetSegmentString.prototype.setMinimumVertexDistance=function(minimimVertexDistance){this.minimimVertexDistance=minimimVertexDistance;};jsts.operation.buffer.OffsetSegmentString.prototype.addPt=function(pt){var bufPt=new jsts.geom.Coordinate(pt);this.precisionModel.makePrecise(bufPt);if(this.isRedundant(bufPt))
return;this.ptList.push(bufPt);};jsts.operation.buffer.OffsetSegmentString.prototype.addPts=function(pt,isForward){if(isForward){for(var i=0;i<pt.length;i++){this.addPt(pt[i]);}}else{for(var i=pt.length-1;i>=0;i--){this.addPt(pt[i]);}}};jsts.operation.buffer.OffsetSegmentString.prototype.isRedundant=function(pt){if(this.ptList.length<1)
return false;var lastPt=this.ptList[this.ptList.length-1];var ptDist=pt.distance(lastPt);if(ptDist<this.minimimVertexDistance)
return true;return false;};jsts.operation.buffer.OffsetSegmentString.prototype.closeRing=function(){if(this.ptList.length<1)
return;var startPt=new jsts.geom.Coordinate(this.ptList[0]);var lastPt=this.ptList[this.ptList.length-1];var last2Pt=null;if(this.ptList.length>=2)
last2Pt=this.ptList[this.ptList.length-2];if(startPt.equals(lastPt))
return;this.ptList.push(startPt);};jsts.operation.buffer.OffsetSegmentString.prototype.reverse=function(){};jsts.operation.buffer.OffsetSegmentString.prototype.getCoordinates=function(){return this.ptList;};(function(){var ArrayList=javascript.util.ArrayList;var TreeSet=javascript.util.TreeSet;var CoordinateFilter=jsts.geom.CoordinateFilter;jsts.util.UniqueCoordinateArrayFilter=function(){this.treeSet=new TreeSet();this.list=new ArrayList();};jsts.util.UniqueCoordinateArrayFilter.prototype=new CoordinateFilter();jsts.util.UniqueCoordinateArrayFilter.prototype.treeSet=null;jsts.util.UniqueCoordinateArrayFilter.prototype.list=null;jsts.util.UniqueCoordinateArrayFilter.prototype.getCoordinates=function(){return this.list.toArray();};jsts.util.UniqueCoordinateArrayFilter.prototype.filter=function(coord){if(!this.treeSet.contains(coord)){this.list.add(coord);this.treeSet.add(coord);}};})();(function(){var CGAlgorithms=jsts.algorithm.CGAlgorithms;var UniqueCoordinateArrayFilter=jsts.util.UniqueCoordinateArrayFilter;var Assert=jsts.util.Assert;var Stack=javascript.util.Stack;var ArrayList=javascript.util.ArrayList;var Arrays=javascript.util.Arrays;var RadialComparator=function(origin){this.origin=origin;};RadialComparator.prototype.origin=null;RadialComparator.prototype.compare=function(o1,o2){var p1=o1;var p2=o2;return RadialComparator.polarCompare(this.origin,p1,p2);};RadialComparator.polarCompare=function(o,p,q){var dxp=p.x-o.x;var dyp=p.y-o.y;var dxq=q.x-o.x;var dyq=q.y-o.y;var orient=CGAlgorithms.computeOrientation(o,p,q);if(orient==CGAlgorithms.COUNTERCLOCKWISE)
return 1;if(orient==CGAlgorithms.CLOCKWISE)
return-1;var op=dxp*dxp+dyp*dyp;var oq=dxq*dxq+dyq*dyq;if(op<oq){return-1;}
if(op>oq){return 1;}
return 0;};jsts.algorithm.ConvexHull=function(){if(arguments.length===1){var geometry=arguments[0];this.inputPts=jsts.algorithm.ConvexHull.extractCoordinates(geometry);this.geomFactory=geometry.getFactory();}else{this.pts=arguments[0];this.geomFactory=arguments[1];}};jsts.algorithm.ConvexHull.prototype.geomFactory=null;jsts.algorithm.ConvexHull.prototype.inputPts=null;jsts.algorithm.ConvexHull.extractCoordinates=function(geom){var filter=new UniqueCoordinateArrayFilter();geom.apply(filter);return filter.getCoordinates();};jsts.algorithm.ConvexHull.prototype.getConvexHull=function(){if(this.inputPts.length==0){return this.geomFactory.createGeometryCollection(null);}
if(this.inputPts.length==1){return this.geomFactory.createPoint(this.inputPts[0]);}
if(this.inputPts.length==2){return this.geomFactory.createLineString(this.inputPts);}
var reducedPts=this.inputPts;if(this.inputPts.length>50){reducedPts=this.reduce(this.inputPts);}
var sortedPts=this.preSort(reducedPts);var cHS=this.grahamScan(sortedPts);var cH=cHS.toArray();return this.lineOrPolygon(cH);};jsts.algorithm.ConvexHull.prototype.reduce=function(inputPts){var polyPts=this.computeOctRing(inputPts);if(polyPts==null)
return this.inputPts;var reducedSet=new javascript.util.TreeSet();for(var i=0;i<polyPts.length;i++){reducedSet.add(polyPts[i]);}
for(var i=0;i<inputPts.length;i++){if(!CGAlgorithms.isPointInRing(inputPts[i],polyPts)){reducedSet.add(inputPts[i]);}}
var reducedPts=reducedSet.toArray();if(reducedPts.length<3)
return this.padArray3(reducedPts);return reducedPts;};jsts.algorithm.ConvexHull.prototype.padArray3=function(pts){var pad=[];for(var i=0;i<pad.length;i++){if(i<pts.length){pad[i]=pts[i];}else
pad[i]=pts[0];}
return pad;};jsts.algorithm.ConvexHull.prototype.preSort=function(pts){var t;for(var i=1;i<pts.length;i++){if((pts[i].y<pts[0].y)||((pts[i].y==pts[0].y)&&(pts[i].x<pts[0].x))){t=pts[0];pts[0]=pts[i];pts[i]=t;}}
Arrays.sort(pts,1,pts.length,new RadialComparator(pts[0]));return pts;};jsts.algorithm.ConvexHull.prototype.grahamScan=function(c){var p;var ps=new Stack();p=ps.push(c[0]);p=ps.push(c[1]);p=ps.push(c[2]);for(var i=3;i<c.length;i++){p=ps.pop();while(!ps.empty()&&CGAlgorithms.computeOrientation(ps.peek(),p,c[i])>0){p=ps.pop();}
p=ps.push(p);p=ps.push(c[i]);}
p=ps.push(c[0]);return ps;};jsts.algorithm.ConvexHull.prototype.isBetween=function(c1,c2,c3){if(CGAlgorithms.computeOrientation(c1,c2,c3)!==0){return false;}
if(c1.x!=c3.x){if(c1.x<=c2.x&&c2.x<=c3.x){return true;}
if(c3.x<=c2.x&&c2.x<=c1.x){return true;}}
if(c1.y!=c3.y){if(c1.y<=c2.y&&c2.y<=c3.y){return true;}
if(c3.y<=c2.y&&c2.y<=c1.y){return true;}}
return false;};jsts.algorithm.ConvexHull.prototype.computeOctRing=function(inputPts){var octPts=this.computeOctPts(inputPts);var coordList=new jsts.geom.CoordinateList();coordList.add(octPts,false);if(coordList.size()<3){return null;}
coordList.closeRing();return coordList.toCoordinateArray();};jsts.algorithm.ConvexHull.prototype.computeOctPts=function(inputPts){var pts=[];for(var j=0;j<8;j++){pts[j]=inputPts[0];}
for(var i=1;i<inputPts.length;i++){if(inputPts[i].x<pts[0].x){pts[0]=inputPts[i];}
if(inputPts[i].x-inputPts[i].y<pts[1].x-pts[1].y){pts[1]=inputPts[i];}
if(inputPts[i].y>pts[2].y){pts[2]=inputPts[i];}
if(inputPts[i].x+inputPts[i].y>pts[3].x+pts[3].y){pts[3]=inputPts[i];}
if(inputPts[i].x>pts[4].x){pts[4]=inputPts[i];}
if(inputPts[i].x-inputPts[i].y>pts[5].x-pts[5].y){pts[5]=inputPts[i];}
if(inputPts[i].y<pts[6].y){pts[6]=inputPts[i];}
if(inputPts[i].x+inputPts[i].y<pts[7].x+pts[7].y){pts[7]=inputPts[i];}}
return pts;};jsts.algorithm.ConvexHull.prototype.lineOrPolygon=function(coordinates){coordinates=this.cleanRing(coordinates);if(coordinates.length==3){return this.geomFactory.createLineString([coordinates[0],coordinates[1]]);}
var linearRing=this.geomFactory.createLinearRing(coordinates);return this.geomFactory.createPolygon(linearRing,null);};jsts.algorithm.ConvexHull.prototype.cleanRing=function(original){Assert.equals(original[0],original[original.length-1]);var cleanedRing=new ArrayList();var previousDistinctCoordinate=null;for(var i=0;i<=original.length-2;i++){var currentCoordinate=original[i];var nextCoordinate=original[i+1];if(currentCoordinate.equals(nextCoordinate)){continue;}
if(previousDistinctCoordinate!=null&&this.isBetween(previousDistinctCoordinate,currentCoordinate,nextCoordinate)){continue;}
cleanedRing.add(currentCoordinate);previousDistinctCoordinate=currentCoordinate;}
cleanedRing.add(original[original.length-1]);var cleanedRingCoordinates=[];return cleanedRing.toArray(cleanedRingCoordinates);};})();(function(){var ArrayList=javascript.util.ArrayList;jsts.geomgraph.index.SegmentIntersector=function(li,includeProper,recordIsolated){this.li=li;this.includeProper=includeProper;this.recordIsolated=recordIsolated;};jsts.geomgraph.index.SegmentIntersector.isAdjacentSegments=function(i1,i2){return Math.abs(i1-i2)===1;};jsts.geomgraph.index.SegmentIntersector.prototype._hasIntersection=false;jsts.geomgraph.index.SegmentIntersector.prototype.hasProper=false;jsts.geomgraph.index.SegmentIntersector.prototype.hasProperInterior=false;jsts.geomgraph.index.SegmentIntersector.prototype.properIntersectionPoint=null;jsts.geomgraph.index.SegmentIntersector.prototype.li=null;jsts.geomgraph.index.SegmentIntersector.prototype.includeProper=null;jsts.geomgraph.index.SegmentIntersector.prototype.recordIsolated=null;jsts.geomgraph.index.SegmentIntersector.prototype.isSelfIntersection=null;jsts.geomgraph.index.SegmentIntersector.prototype.numIntersections=0;jsts.geomgraph.index.SegmentIntersector.prototype.numTests=0;jsts.geomgraph.index.SegmentIntersector.prototype.bdyNodes=null;jsts.geomgraph.index.SegmentIntersector.prototype.setBoundaryNodes=function(bdyNodes0,bdyNodes1){this.bdyNodes=[];this.bdyNodes[0]=bdyNodes0;this.bdyNodes[1]=bdyNodes1;};jsts.geomgraph.index.SegmentIntersector.prototype.getProperIntersectionPoint=function(){return this.properIntersectionPoint;};jsts.geomgraph.index.SegmentIntersector.prototype.hasIntersection=function(){return this._hasIntersection;};jsts.geomgraph.index.SegmentIntersector.prototype.hasProperIntersection=function(){return this.hasProper;};jsts.geomgraph.index.SegmentIntersector.prototype.hasProperInteriorIntersection=function(){return this.hasProperInterior;};jsts.geomgraph.index.SegmentIntersector.prototype.isTrivialIntersection=function(e0,segIndex0,e1,segIndex1){if(e0===e1){if(this.li.getIntersectionNum()===1){if(jsts.geomgraph.index.SegmentIntersector.isAdjacentSegments(segIndex0,segIndex1))
return true;if(e0.isClosed()){var maxSegIndex=e0.getNumPoints()-1;if((segIndex0===0&&segIndex1===maxSegIndex)||(segIndex1===0&&segIndex0===maxSegIndex)){return true;}}}}
return false;};jsts.geomgraph.index.SegmentIntersector.prototype.addIntersections=function(e0,segIndex0,e1,segIndex1){if(e0===e1&&segIndex0===segIndex1)
return;this.numTests++;var p00=e0.getCoordinates()[segIndex0];var p01=e0.getCoordinates()[segIndex0+1];var p10=e1.getCoordinates()[segIndex1];var p11=e1.getCoordinates()[segIndex1+1];this.li.computeIntersection(p00,p01,p10,p11);if(this.li.hasIntersection()){if(this.recordIsolated){e0.setIsolated(false);e1.setIsolated(false);}
this.numIntersections++;if(!this.isTrivialIntersection(e0,segIndex0,e1,segIndex1)){this._hasIntersection=true;if(this.includeProper||!this.li.isProper()){e0.addIntersections(this.li,segIndex0,0);e1.addIntersections(this.li,segIndex1,1);}
if(this.li.isProper()){this.properIntersectionPoint=this.li.getIntersection(0).clone();this.hasProper=true;if(!this.isBoundaryPoint(this.li,this.bdyNodes))
this.hasProperInterior=true;}}}};jsts.geomgraph.index.SegmentIntersector.prototype.isBoundaryPoint=function(li,bdyNodes){if(bdyNodes===null)
return false;if(bdyNodes instanceof Array){if(this.isBoundaryPoint(li,bdyNodes[0]))
return true;if(this.isBoundaryPoint(li,bdyNodes[1]))
return true;return false;}else{for(var i=bdyNodes.iterator();i.hasNext();){var node=i.next();var pt=node.getCoordinate();if(li.isIntersection(pt))
return true;}
return false;}};})();(function(){var Location=jsts.geom.Location;var Position=jsts.geomgraph.Position;var Assert=jsts.util.Assert;jsts.geomgraph.GeometryGraph=function(argIndex,parentGeom,boundaryNodeRule){jsts.geomgraph.PlanarGraph.call(this);this.lineEdgeMap=new javascript.util.HashMap();this.ptLocator=new jsts.algorithm.PointLocator();this.argIndex=argIndex;this.parentGeom=parentGeom;this.boundaryNodeRule=boundaryNodeRule||jsts.algorithm.BoundaryNodeRule.OGC_SFS_BOUNDARY_RULE;if(parentGeom!==null){this.add(parentGeom);}};jsts.geomgraph.GeometryGraph.prototype=new jsts.geomgraph.PlanarGraph();jsts.geomgraph.GeometryGraph.constructor=jsts.geomgraph.GeometryGraph;jsts.geomgraph.GeometryGraph.prototype.createEdgeSetIntersector=function(){return new jsts.geomgraph.index.SimpleEdgeSetIntersector();};jsts.geomgraph.GeometryGraph.determineBoundary=function(boundaryNodeRule,boundaryCount){return boundaryNodeRule.isInBoundary(boundaryCount)?Location.BOUNDARY:Location.INTERIOR;};jsts.geomgraph.GeometryGraph.prototype.parentGeom=null;jsts.geomgraph.GeometryGraph.prototype.lineEdgeMap=null;jsts.geomgraph.GeometryGraph.prototype.boundaryNodeRule=null;jsts.geomgraph.GeometryGraph.prototype.useBoundaryDeterminationRule=true;jsts.geomgraph.GeometryGraph.prototype.argIndex=null;jsts.geomgraph.GeometryGraph.prototype.boundaryNodes=null;jsts.geomgraph.GeometryGraph.prototype.hasTooFewPoints=false;jsts.geomgraph.GeometryGraph.prototype.invalidPoint=null;jsts.geomgraph.GeometryGraph.prototype.areaPtLocator=null;jsts.geomgraph.GeometryGraph.prototype.ptLocator=null;jsts.geomgraph.GeometryGraph.prototype.getGeometry=function(){return this.parentGeom;};jsts.geomgraph.GeometryGraph.prototype.getBoundaryNodes=function(){if(this.boundaryNodes===null)
this.boundaryNodes=this.nodes.getBoundaryNodes(this.argIndex);return this.boundaryNodes;};jsts.geomgraph.GeometryGraph.prototype.getBoundaryNodeRule=function(){return this.boundaryNodeRule;};jsts.geomgraph.GeometryGraph.prototype.findEdge=function(line){return this.lineEdgeMap.get(line);};jsts.geomgraph.GeometryGraph.prototype.computeSplitEdges=function(edgelist){for(var i=this.edges.iterator();i.hasNext();){var e=i.next();e.eiList.addSplitEdges(edgelist);}}
jsts.geomgraph.GeometryGraph.prototype.add=function(g){if(g.isEmpty()){return;}
if(g instanceof jsts.geom.MultiPolygon)
this.useBoundaryDeterminationRule=false;if(g instanceof jsts.geom.Polygon)
this.addPolygon(g);else if(g instanceof jsts.geom.LineString)
this.addLineString(g);else if(g instanceof jsts.geom.Point)
this.addPoint(g);else if(g instanceof jsts.geom.MultiPoint)
this.addCollection(g);else if(g instanceof jsts.geom.MultiLineString)
this.addCollection(g);else if(g instanceof jsts.geom.MultiPolygon)
this.addCollection(g);else if(g instanceof jsts.geom.GeometryCollection)
this.addCollection(g);else
throw new jsts.error.IllegalArgumentError('Geometry type not supported.');};jsts.geomgraph.GeometryGraph.prototype.addCollection=function(gc){for(var i=0;i<gc.getNumGeometries();i++){var g=gc.getGeometryN(i);this.add(g);}};jsts.geomgraph.GeometryGraph.prototype.addEdge=function(e){this.insertEdge(e);var coord=e.getCoordinates();this.insertPoint(this.argIndex,coord[0],Location.BOUNDARY);this.insertPoint(this.argIndex,coord[coord.length-1],Location.BOUNDARY);};jsts.geomgraph.GeometryGraph.prototype.addPoint=function(p){var coord=p.getCoordinate();this.insertPoint(this.argIndex,coord,Location.INTERIOR);};jsts.geomgraph.GeometryGraph.prototype.addLineString=function(line){var coord=jsts.geom.CoordinateArrays.removeRepeatedPoints(line.getCoordinates());if(coord.length<2){this.hasTooFewPoints=true;this.invalidPoint=coords[0];return;}
var e=new jsts.geomgraph.Edge(coord,new jsts.geomgraph.Label(this.argIndex,Location.INTERIOR));this.lineEdgeMap.put(line,e);this.insertEdge(e);Assert.isTrue(coord.length>=2,'found LineString with single point');this.insertBoundaryPoint(this.argIndex,coord[0]);this.insertBoundaryPoint(this.argIndex,coord[coord.length-1]);};jsts.geomgraph.GeometryGraph.prototype.addPolygonRing=function(lr,cwLeft,cwRight){if(lr.isEmpty())
return;var coord=jsts.geom.CoordinateArrays.removeRepeatedPoints(lr.getCoordinates());if(coord.length<4){this.hasTooFewPoints=true;this.invalidPoint=coord[0];return;}
var left=cwLeft;var right=cwRight;if(jsts.algorithm.CGAlgorithms.isCCW(coord)){left=cwRight;right=cwLeft;}
var e=new jsts.geomgraph.Edge(coord,new jsts.geomgraph.Label(this.argIndex,Location.BOUNDARY,left,right));this.lineEdgeMap.put(lr,e);this.insertEdge(e);this.insertPoint(this.argIndex,coord[0],Location.BOUNDARY);};jsts.geomgraph.GeometryGraph.prototype.addPolygon=function(p){this.addPolygonRing(p.getExteriorRing(),Location.EXTERIOR,Location.INTERIOR);for(var i=0;i<p.getNumInteriorRing();i++){var hole=p.getInteriorRingN(i);this.addPolygonRing(hole,Location.INTERIOR,Location.EXTERIOR);}};jsts.geomgraph.GeometryGraph.prototype.computeEdgeIntersections=function(g,li,includeProper){var si=new jsts.geomgraph.index.SegmentIntersector(li,includeProper,true);si.setBoundaryNodes(this.getBoundaryNodes(),g.getBoundaryNodes());var esi=this.createEdgeSetIntersector();esi.computeIntersections(this.edges,g.edges,si);return si;};jsts.geomgraph.GeometryGraph.prototype.computeSelfNodes=function(li,computeRingSelfNodes){var si=new jsts.geomgraph.index.SegmentIntersector(li,true,false);var esi=this.createEdgeSetIntersector();if(!computeRingSelfNodes&&(this.parentGeom instanceof jsts.geom.LinearRing||this.parentGeom instanceof jsts.geom.Polygon||this.parentGeom instanceof jsts.geom.MultiPolygon)){esi.computeIntersections(this.edges,si,false);}else{esi.computeIntersections(this.edges,si,true);}
this.addSelfIntersectionNodes(this.argIndex);return si;};jsts.geomgraph.GeometryGraph.prototype.insertPoint=function(argIndex,coord,onLocation){var n=this.nodes.addNode(coord);var lbl=n.getLabel();if(lbl==null){n.label=new jsts.geomgraph.Label(argIndex,onLocation);}else
lbl.setLocation(argIndex,onLocation);};jsts.geomgraph.GeometryGraph.prototype.insertBoundaryPoint=function(argIndex,coord){var n=this.nodes.addNode(coord);var lbl=n.getLabel();var boundaryCount=1;var loc=Location.NONE;if(lbl!==null)
loc=lbl.getLocation(argIndex,Position.ON);if(loc===Location.BOUNDARY)
boundaryCount++;var newLoc=jsts.geomgraph.GeometryGraph.determineBoundary(this.boundaryNodeRule,boundaryCount);lbl.setLocation(argIndex,newLoc);};jsts.geomgraph.GeometryGraph.prototype.addSelfIntersectionNodes=function(argIndex){for(var i=this.edges.iterator();i.hasNext();){var e=i.next();var eLoc=e.getLabel().getLocation(argIndex);for(var eiIt=e.eiList.iterator();eiIt.hasNext();){var ei=eiIt.next();this.addSelfIntersectionNode(argIndex,ei.coord,eLoc);}}};jsts.geomgraph.GeometryGraph.prototype.addSelfIntersectionNode=function(argIndex,coord,loc){if(this.isBoundaryNode(argIndex,coord))
return;if(loc===Location.BOUNDARY&&this.useBoundaryDeterminationRule)
this.insertBoundaryPoint(argIndex,coord);else
this.insertPoint(argIndex,coord,loc);};jsts.geomgraph.GeometryGraph.prototype.getInvalidPoint=function(){return this.invalidPoint;};})();
},{}],18:[function(require,module,exports){
module.exports = require('./src');

},{"./src":19}],19:[function(require,module,exports){
module.exports.ArrayList = require('./ArrayList');
module.exports.Arrays = require('./Arrays');
module.exports.Collection = require('./Collection');
module.exports.HashMap = require('./HashMap');
module.exports.Iterator = require('./Iterator');
module.exports.List = require('./List');
module.exports.Map = require('./Map');
module.exports.Set = require('./Set');
module.exports.HashSet = require('./HashSet');
module.exports.SortedMap = require('./SortedMap');
module.exports.SortedSet = require('./SortedSet');
module.exports.Stack = require('./Stack');
module.exports.TreeMap = require('./TreeMap');
module.exports.TreeSet = require('./TreeSet');

},{"./ArrayList":20,"./Arrays":21,"./Collection":22,"./HashMap":23,"./Iterator":24,"./List":25,"./HashSet":26,"./Map":27,"./Set":28,"./SortedMap":29,"./SortedSet":30,"./Stack":31,"./TreeMap":32,"./TreeSet":33}],21:[function(require,module,exports){
/**
 * @see http://download.oracle.com/javase/6/docs/api/java/util/Arrays.html
 *
 * @constructor
 */
function Arrays() {};

/**
 */
Arrays.sort = function() {
  var a = arguments[0], i, t, comparator, compare;
  if (arguments.length === 1) {
    a.sort();
    return;
  } else if (arguments.length === 2) {
    comparator = arguments[1];
    compare = function(a, b) {
      return comparator['compare'](a, b);
    };
    a.sort(compare);
  } else if (arguments.length === 3) {
    t = a.slice(arguments[1], arguments[2]);
    t.sort();
    var r = a.slice(0, arguments[1]).concat(t, a.slice(arguments[2], a.length));
    a.splice(0, a.length);
    for (i = 0; i < r.length; i++) {
      a.push(r[i]);
    }
    return;
  } else if (arguments.length === 4) {
    t = a.slice(arguments[1], arguments[2]);
    comparator = arguments[3];
    compare = function(a, b) {
      return comparator['compare'](a, b);
    };
    t.sort(compare);
    r = a.slice(0, arguments[1]).concat(t, a.slice(arguments[2], a.length));
    a.splice(0, a.length);
    for (i = 0; i < r.length; i++) {
      a.push(r[i]);
    }
    return;
  }
};

/**
 */
Arrays.asList = function(array) {
  var arrayList = new javascript.util.ArrayList();
  for ( var i = 0, len = array.length; i < len; i++) {
    arrayList.add(array[i]);
  }
  return arrayList;
};

module.exports = Arrays;

},{}],24:[function(require,module,exports){
/**
 * @see http://download.oracle.com/javase/6/docs/api/java/util/Iterator.html
 * @interface
 */
function Iterator() {};

/**
 * Returns true if the iteration has more elements.
 *
 * @return {boolean}
 */
Iterator.prototype.hasNext = function() {};

/**
 * Returns the next element in the iteration.
 *
 * @return {Object}
 */
Iterator.prototype.next = function() {};

/**
 * Removes from the underlying collection the last element returned by the
 * iterator (optional operation).
 */
Iterator.prototype.remove = function() {};

module.exports = Iterator;

},{}],27:[function(require,module,exports){
/**
 * @see http://download.oracle.com/javase/6/docs/api/java/util/Map.html
 *
 * @interface
 */
function Map() {};

/**
 * Returns the value to which the specified key is mapped, or null if this map
 * contains no mapping for the key.
 *
 * @param {Object}
 *          key
 * @return {?Object}
 */
Map.prototype.get = function(key) {};

/**
 * Associates the specified value with the specified key in this map (optional
 * operation).
 *
 * @param {Object}
 *          key
 * @param {Object}
 *          value
 * @return {Object}
 */
Map.prototype.put = function(key, value) {};

/**
 * Returns the number of key-value mappings in this map.
 *
 * @return {number}
 */
Map.prototype.size = function() {};

/**
 * Returns a Collection view of the values contained in this map.
 *
 * @return {javascript.util.Collection}
 */
Map.prototype.values = function() {};

module.exports = Map;

},{}],20:[function(require,module,exports){
/**
 * @requires List.js
 */

var Collection = require('./Collection');
var List = require('./List');
var IndexOutOfBoundsException = require('./IndexOutOfBoundsException');
var NoSuchElementException = require('./NoSuchElementException');
var OperationNotSupported = require('./OperationNotSupported');

/**
 * @see http://download.oracle.com/javase/6/docs/api/java/util/ArrayList.html
 *
 * @implements {javascript.util.List}
 * @constructor
 */
function ArrayList() {
  this.array = [];

  if (arguments[0] instanceof Collection) {
    this.addAll(arguments[0]);
  }
};

ArrayList.prototype = new List;

/**
 * @type {Array}
 * @private
 */
ArrayList.prototype.array = null;

/**
 * @override
 */
ArrayList.prototype.add = function(e) {
  this.array.push(e);
  return true;
};

/**
 * @override
 */
ArrayList.prototype.addAll = function(c) {
  for ( var i = c.iterator(); i.hasNext();) {
    this.add(i.next());
  }
  return true;
};

/**
 * @override
 */
ArrayList.prototype.iterator = function() {
  return new ArrayList.Iterator(this);
};

/**
 * @override
 */
ArrayList.prototype.get = function(index) {
  if (index < 0 || index >= this.size()) {
    throw new IndexOutOfBoundsException();
  }

  return this.array[index];
};

/**
 * @override
 */
ArrayList.prototype.isEmpty = function() {
  return this.array.length === 0;
};

/**
 * @override
 */
ArrayList.prototype.size = function() {
  return this.array.length;
};

/**
 * @override
 */
ArrayList.prototype.toArray = function() {
  var array = [];

  for ( var i = 0, len = this.array.length; i < len; i++) {
    array.push(this.array[i]);
  }

  return array;
};

/**
 * @override
 */
ArrayList.prototype.remove = function(o) {
  var found = false;

  for ( var i = 0, len = this.array.length; i < len; i++) {
    if (this.array[i] === o) {
      this.array.splice(i, 1);
      found = true;
      break;
    }
  }

  return found;
};

/**
 * @implements {javascript.util.Iterator}
 * @param {javascript.util.ArrayList}
 *          arrayList
 * @constructor
 * @private
 */
ArrayList.Iterator = function(arrayList) {
  this.arrayList = arrayList;
};

/**
 * @type {javascript.util.ArrayList}
 * @private
 */
ArrayList.Iterator.prototype.arrayList = null;

/**
 * @type {number}
 * @private
 */
ArrayList.Iterator.prototype.position = 0;

/**
 * @override
 */
ArrayList.Iterator.prototype.next = function() {
  if (this.position === this.arrayList.size()) {
    throw new NoSuchElementException();
  }
  return this.arrayList.get(this.position++);
};

/**
 * @override
 */
ArrayList.Iterator.prototype.hasNext = function() {
  if (this.position < this.arrayList.size()) {
    return true;
  }
  return false;
};

/**
 * @override
 */
ArrayList.Iterator.prototype.remove = function() {
  throw new OperationNotSupported();
};

module.exports = ArrayList;

},{"./Collection":22,"./List":25,"./IndexOutOfBoundsException":34,"./NoSuchElementException":35,"./OperationNotSupported":36}],22:[function(require,module,exports){
/**
 * @requires Iterator.js
 */

var Iterator = require('./Iterator');

/**
 * @see http://download.oracle.com/javase/6/docs/api/java/util/Collection.html
 *
 * @interface
 */
function Collection() {};

/**
 * Ensures that this collection contains the specified element (optional
 * operation).
 *
 * @param {Object}
 *          o
 * @return {boolean}
 */
Collection.prototype.add = function(o) {};

/**
 * Appends all of the elements in the specified collection to the end of this
 * list, in the order that they are returned by the specified collection's
 * iterator (optional operation).
 *
 * @param {javascript.util.Collection}
 *          c
 * @return {boolean}
 */
Collection.prototype.addAll = function(c) {};

/**
 * Returns true if this collection contains no elements.
 *
 * @return {boolean}
 */
Collection.prototype.isEmpty = function() {};

/**
 * Returns an iterator over the elements in this collection.
 *
 * @return {javascript.util.Iterator}
 */
Collection.prototype.iterator = function() {};

/**
 * Returns an iterator over the elements in this collection.
 *
 * @return {number}
 */
Collection.prototype.size = function() {};

/**
 * Returns an array containing all of the elements in this collection.
 *
 * @return {Array}
 */
Collection.prototype.toArray = function() {};

/**
 * Removes a single instance of the specified element from this collection if it
 * is present. (optional)
 *
 * @param {Object}
 *          o
 * @return {boolean}
 */
Collection.prototype.remove = function(o) {};

module.exports = Collection;

},{"./Iterator":24}],23:[function(require,module,exports){
/**
 * @requires Map.js
 * @requires ArrayList.js
 */

var Map = require('./Map');
var ArrayList = require('./ArrayList');

/**
 * @see http://download.oracle.com/javase/6/docs/api/java/util/HashMap.html
 *
 * @implements {javascript.util.Map}
 * @constructor
 *
 */
function HashMap() {
  this.object = {};
};
HashMap.prototype = new Map;

/**
 * @type {Object}
 * @private
 */
HashMap.prototype.object = null;

/**
 * @override
 */
HashMap.prototype.get = function(key) {
  return this.object[key] || null;
};

/**
 * @override
 */
HashMap.prototype.put = function(key, value) {
  this.object[key] = value;
  return value;
};

/**
 * @override
 */
HashMap.prototype.values = function() {
  var arrayList = new javascript.util.ArrayList();
  for ( var key in this.object) {
    if (this.object.hasOwnProperty(key)) {
      arrayList.add(this.object[key]);
    }
  }
  return arrayList;
};

/**
 * @override
 */
HashMap.prototype.size = function() {
  return this.values().size();
};

module.exports = HashMap;

},{"./Map":27,"./ArrayList":20}],26:[function(require,module,exports){
/**
 * @requires Set.js
 */
var Collection = require('./Collection');
var Set = require('./Set');
var OperationNotSupported = require('./OperationNotSupported');
var NoSuchElementException = require('./NoSuchElementException');


/**
 * @see http://docs.oracle.com/javase/6/docs/api/java/util/HashSet.html
 *
 * @extends {javascript.util.Set}
 * @interface
 */
function HashSet() {
  this.array = [];

  if (arguments[0] instanceof Collection) {
    this.addAll(arguments[0]);
  }
};
HashSet.prototype = new Set;

/**
 * @type {Array}
 * @private
 */
HashSet.prototype.array = null;

/**
 * @override
 */
HashSet.prototype.contains = function(o) {
  for ( var i = 0, len = this.array.length; i < len; i++) {
    var e = this.array[i];
    if (e === o) {
      return true;
    }
  }
  return false;
};

/**
 * @override
 */
HashSet.prototype.add = function(o) {
  if (this.contains(o)) {
    return false;
  }

  this.array.push(o);

  return true;
};

/**
 * @override
 */
HashSet.prototype.addAll = function(c) {
  for ( var i = c.iterator(); i.hasNext();) {
    this.add(i.next());
  }
  return true;
};

/**
 * @override
 * @returns {boolean}
 */
HashSet.prototype.remove = function(o) {
  throw new OperationNotSupported();
};

/**
 * @override
 */
HashSet.prototype.size = function() {
  return this.array.length;
};

/**
 * @override
 */
HashSet.prototype.isEmpty = function() {
  return this.array.length === 0;
};

/**
 * @override
 */
HashSet.prototype.toArray = function() {
  var array = [];

  for ( var i = 0, len = this.array.length; i < len; i++) {
    array.push(this.array[i]);
  }

  return array;
};

/**
 * @override
 */
HashSet.prototype.iterator = function() {
  return new HashSet.Iterator(this);
};

/**
 * @implements {javascript.util.Iterator}
 * @param {javascript.util.HashSet}
 *          HashSet
 * @constructor
 * @private
 */
HashSet.Iterator = function(hashSet) {
  this.hashSet = hashSet;
};

/**
 * @type {javascript.util.HashSet}
 * @private
 */
HashSet.Iterator.prototype.hashSet = null;

/**
 * @type {number}
 * @private
 */
HashSet.Iterator.prototype.position = 0;

/**
 * @override
 */
HashSet.Iterator.prototype.next = function() {
  if (this.position === this.hashSet.size()) {
    throw new NoSuchElementException();
  }
  return this.hashSet.array[this.position++];
};

/**
 * @override
 */
HashSet.Iterator.prototype.hasNext = function() {
  if (this.position < this.hashSet.size()) {
    return true;
  }
  return false;
};

/**
 * @override
 */
HashSet.Iterator.prototype.remove = function() {
  throw new javascript.util.OperationNotSupported();
};

module.exports = HashSet;

},{"./Collection":22,"./Set":28,"./OperationNotSupported":36,"./NoSuchElementException":35}],29:[function(require,module,exports){
/**
 * @requires Map.js
 */
var Map = require('./Map');

/**
 * @see http://download.oracle.com/javase/6/docs/api/java/util/SortedMap.html
 *
 * @extends {javascript.util.Map}
 * @interface
 */
function SortedMap() {};
SortedMap.prototype = new Map;

module.exports = SortedMap;

},{"./Map":27}],30:[function(require,module,exports){
/**
 * @requires Set.js
 */
var Set = require('./Set');

/**
 * @see http://download.oracle.com/javase/6/docs/api/java/util/SortedSet.html
 *
 * @extends {javascript.util.Set}
 * @interface
 */
function SortedSet() {};
SortedSet.prototype = new Set;

module.exports = SortedSet;

},{"./Set":28}],31:[function(require,module,exports){
/**
 * @requires List.js
 */
var List = require('./List');
var EmptyStackException = require('./EmptyStackException');

/**
 * @see http://download.oracle.com/javase/6/docs/api/java/util/Stack.html
 *
 * @implements {javascript.util.List}
 * @constructor
 *
 */
function Stack() {
  this.array = [];
};

Stack.prototype = new List;

/**
 * @type {Array}
 * @private
 */
Stack.prototype.array = null;

/**
 * Pushes an item onto the top of this stack.
 *
 */
Stack.prototype.push = function(e) {
  this.array.push(e);
  return e;
};

/**
 * Pushes an item onto the top of this stack.
 *
 */
Stack.prototype.pop = function(e) {
  if (this.array.length === 0) {
    throw new EmptyStackException();
  }

  return this.array.pop();
};

/**
 * Looks at the object at the top of this stack without removing it from the
 * stack.
 *
 */
Stack.prototype.peek = function() {
  if (this.array.length === 0) {
    throw new EmptyStackException();
  }

  return this.array[this.array.length - 1];
};

/**
 * Tests if this stack is empty.
 *
 * @return {boolean} true if and only if this stack contains no items; false
 *         otherwise.
 */
Stack.prototype.empty = function(e) {
  if (this.array.length === 0) {
    return true;
  } else {
    return false;
  }
};

Stack.prototype.isEmpty = function() {
  return this.empty();
};

/**
 * Returns the 1-based position where an object is on this stack. If the object
 * o occurs as an item in this stack, this method returns the distance from the
 * top of the stack of the occurrence nearest the top of the stack; the topmost
 * item on the stack is considered to be at distance 1. The equals method is
 * used to compare o to the items in this stack.
 *
 * NOTE: does not currently actually use equals. (=== is used)
 *
 * @return {number} the 1-based position from the top of the stack where the
 *         object is located; the return value -1 indicates that the object is
 *         not on the stack.
 */
Stack.prototype.search = function(o) {
  return this.array.indexOf(o);
};

/**
 * @override
 *
 */
Stack.prototype.size = function() {
  return this.array.length;
};

/**
 * @override
 */
Stack.prototype.toArray = function() {
  var array = [];

  for ( var i = 0, len = this.array.length; i < len; i++) {
    array.push(this.array[i]);
  }

  return array;
};

module.exports = Stack;

},{"./List":25,"./EmptyStackException":37}],32:[function(require,module,exports){
/**
 * @requires SortedMap.js
 * @requires ArrayList.js
 */
var Map = require('./Map');
var SortedMap = require('./SortedMap');
var ArrayList = require('./ArrayList');

/**
 * @see http://download.oracle.com/javase/6/docs/api/java/util/TreeMap.html
 *
 * @implements {javascript.util.Map}
 * @constructor
 *
 */
function TreeMap() {
  this.array = [];
};
TreeMap.prototype = new Map;

/**
 * @type {Array}
 * @private
 */
TreeMap.prototype.array = null;

/**
 * @override
 */
TreeMap.prototype.get = function(key) {
  for ( var i = 0, len = this.array.length; i < len; i++) {
    var e = this.array[i];
    if (e.key['compareTo'](key) === 0) {
      return e.value;
    }
  }
  return null;
};

/**
 * @override
 */
TreeMap.prototype.put = function(key, value) {
  var e = this.get(key);

  if (e) {
    var oldValue = e.value;
    e.value = value;
    return oldValue;
  }

  var newElement = {
    key : key,
    value : value
  };

  for ( var i = 0, len = this.array.length; i < len; i++) {
    e = this.array[i];
    if (e.key['compareTo'](key) === 1) {
      this.array.splice(i, 0, newElement);
      return null;
    }
  }

  this.array.push({
    key : key,
    value : value
  });

  return null;
};

/**
 * @override
 */
TreeMap.prototype.values = function() {
  var arrayList = new javascript.util.ArrayList();
  for ( var i = 0, len = this.array.length; i < len; i++) {
    arrayList.add(this.array[i].value);
  }
  return arrayList;
};

/**
 * @override
 */
TreeMap.prototype.size = function() {
  return this.values().size();
};

module.exports = TreeMap;

},{"./Map":27,"./SortedMap":29,"./ArrayList":20}],33:[function(require,module,exports){
/**
 * @requires SortedSet.js
 */
var Collection = require('./Collection');
var SortedSet = require('./SortedSet');
var OperationNotSupported = require('./OperationNotSupported');
var NoSuchElementException = require('./NoSuchElementException');

/**
 * @see http://download.oracle.com/javase/6/docs/api/java/util/TreeSet.html
 *
 * @implements {javascript.util.SortedSet}
 * @constructor
 */
function TreeSet() {
  this.array = [];

  if (arguments[0] instanceof Collection) {
    this.addAll(arguments[0]);
  }
};
TreeSet.prototype = new SortedSet;

/**
 * @type {Array}
 * @private
 */
TreeSet.prototype.array = null;

/**
 * @override
 */
TreeSet.prototype.contains = function(o) {
  for ( var i = 0, len = this.array.length; i < len; i++) {
    var e = this.array[i];
    if (e['compareTo'](o) === 0) {
      return true;
    }
  }
  return false;
};

/**
 * @override
 */
TreeSet.prototype.add = function(o) {
  if (this.contains(o)) {
    return false;
  }

  for ( var i = 0, len = this.array.length; i < len; i++) {
    var e = this.array[i];
    if (e['compareTo'](o) === 1) {
      this.array.splice(i, 0, o);
      return true;
    }
  }

  this.array.push(o);

  return true;
};

/**
 * @override
 */
TreeSet.prototype.addAll = function(c) {
  for ( var i = c.iterator(); i.hasNext();) {
    this.add(i.next());
  }
  return true;
};

/**
 * @override
 * @returns {boolean}
 */
TreeSet.prototype.remove = function(o) {
  throw new OperationNotSupported();
};

/**
 * @override
 */
TreeSet.prototype.size = function() {
  return this.array.length;
};

/**
 * @override
 */
TreeSet.prototype.isEmpty = function() {
  return this.array.length === 0;
};

/**
 * @override
 */
TreeSet.prototype.toArray = function() {
  var array = [];

  for ( var i = 0, len = this.array.length; i < len; i++) {
    array.push(this.array[i]);
  }

  return array;
};

/**
 * @override
 */
TreeSet.prototype.iterator = function() {
  return new TreeSet.Iterator(this);
};

/**
 * @implements {javascript.util.Iterator}
 * @param {javascript.util.TreeSet}
 *          treeSet
 * @constructor
 * @private
 */
TreeSet.Iterator = function(treeSet) {
  this.treeSet = treeSet;
};

/**
 * @type {javascript.util.TreeSet}
 * @private
 */
TreeSet.Iterator.prototype.treeSet = null;

/**
 * @type {number}
 * @private
 */
TreeSet.Iterator.prototype.position = 0;

/**
 * @override
 */
TreeSet.Iterator.prototype.next = function() {
  if (this.position === this.treeSet.size()) {
    throw new NoSuchElementException();
  }
  return this.treeSet.array[this.position++];
};

/**
 * @override
 */
TreeSet.Iterator.prototype.hasNext = function() {
  if (this.position < this.treeSet.size()) {
    return true;
  }
  return false;
};

/**
 * @override
 */
TreeSet.Iterator.prototype.remove = function() {
  throw new javascript.util.OperationNotSupported();
};

module.exports = TreeSet;

},{"./Collection":22,"./SortedSet":30,"./OperationNotSupported":36,"./NoSuchElementException":35}],25:[function(require,module,exports){
/**
 * @requires Collection.js
 */

var Collection = require('./Collection');

/**
 * @see http://download.oracle.com/javase/6/docs/api/java/util/List.html
 *
 * @extends {javascript.util.Collection}
 * @interface
 */
function List() {};
List.prototype = new Collection;

/**
 * Returns the element at the specified position in this list.
 *
 * @param {number}
 *          index
 * @return {Object}
 */
List.prototype.get = function(index) {};

/**
 * Returns true if this collection contains no elements.
 *
 * @return {boolean} true if this collection contains no elements
 */
List.prototype.isEmpty = function() {};

module.exports = List;

},{"./Collection":22}],28:[function(require,module,exports){
/**
 * @requires Collection.js
 */
var Collection = require('./Collection');

/**
 * @see http://download.oracle.com/javase/6/docs/api/java/util/Set.html
 *
 * @extends {javascript.util.Collection}
 * @interface
 */
function Set() {};
Set.prototype = new Collection;

/**
 * Returns true if this set contains the specified element. More formally,
 * returns true if and only if this set contains an element e such that (o==null ?
 * e==null : o.equals(e)).
 *
 * @param {Object}
 *          o
 * @return {boolean}
 */
Set.prototype.contains = function(o) {};

module.exports = Set;

},{"./Collection":22}],34:[function(require,module,exports){
/**
 * @param {string=}
 *          message Optional message.
 * @extends {Error}
 * @constructor
 */
function IndexOutOfBoundsException(message) {
      this.message = message || '';
};
IndexOutOfBoundsException.prototype = new Error();

/**
 * @type {string}
 */
IndexOutOfBoundsException.prototype.name = 'IndexOutOfBoundsException';

module.exports = IndexOutOfBoundsException;

},{}],35:[function(require,module,exports){
/**
 * @param {string=}
 *          message Optional message.
 * @extends {Error}
 * @constructor
 */
function NoSuchElementException(message) {
  this.message = message || '';
};
NoSuchElementException.prototype = new Error();

/**
 * @type {string}
 */
NoSuchElementException.prototype.name = 'NoSuchElementException';

module.exports = NoSuchElementException;

},{}],36:[function(require,module,exports){
/**
 * @param {string=}
 *          message Optional message.
 * @extends {Error}
 * @constructor
 */
function OperationNotSupported(message) {
  this.message = message || '';
};
OperationNotSupported.prototype = new Error();

/**
 * @type {string}
 */
OperationNotSupported.prototype.name = 'OperationNotSupported';

module.exports = OperationNotSupported;

},{}],37:[function(require,module,exports){
/**
 * @param {string=}
 *          message Optional message.
 * @extends {Error}
 * @constructor
 */
function EmptyStackException(message) {
  this.message = message || '';
};
EmptyStackException.prototype = new Error();

/**
 * @type {string}
 */
EmptyStackException.prototype.name = 'EmptyStackException';

module.exports = EmptyStackException;

},{}]},{},[7])
;