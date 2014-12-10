require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"./delegate":[function(require,module,exports){
/**
 * @module  emmy/delegate
 */

module.exports = delegate;

var pass = require('./pass');
var redirect = require('./src/redirect');
var closest = typeof document !== 'undefined' ? require('query-relative/closest') : null;


/**
 * Bind listener to a target
 * listening for all events from it’s children matching selector
 *
 * @param {string} selector A selector to match against
 *
 * @return {function} A callback
 */
function delegate(target, evt, fn, selector){
	if (redirect(delegate, arguments)) return;
	if (!closest) return;

	return pass(target, evt, fn, function(e){
		var el = e.target;

		var holderEl = closest(el, selector);

		if (holderEl) {
			//save source of event
			e.delegateTarget = el;

			//NOTE: PhantomJS && IE8 fails on that:
			// evt.currentTarget = el;
			// Object.defineProperty(evt, 'currentTarget', {
			// 	get: function(){
			// 		return el;
			// 	}
			// });

			return true;
		}
	});
}
},{"./pass":13,"./src/redirect":14,"query-relative/closest":9}],"./emit":[function(require,module,exports){
/**
 * @module emmy/emit
 */
var icicle = require('icicle');
var listeners = require('./listeners');
var slice = require('sliced');
var redirect = require('./src/redirect');


module.exports = emit;

//TODO: think to pass list of args to `emit`


/** detect env */
var $ = typeof jQuery === 'undefined' ? undefined : jQuery;
var doc = typeof document === 'undefined' ? undefined : document;
var win = typeof window === 'undefined' ? undefined : window;


/**
 * Emit an event, optionally with data or bubbling
 *
 * @param {string} eventName An event name, e. g. 'click'
 * @param {*} data Any data to pass to event.details (DOM) or event.data (elsewhere)
 * @param {bool} bubbles Whether to trigger bubbling event (DOM)
 *
 *
 * @return {target} a target
 */
function emit(target, eventName, data, bubbles){
	//parse args
	if (redirect(emit, arguments, true)) return;

	var emitMethod, evt = eventName;


	//Create proper event for DOM objects
	if (target.nodeType || target === doc || target === win) {
		//NOTE: this doesnot bubble on off-DOM elements

		if (eventName instanceof Event) {
			evt = eventName;
		} else {
			//IE9-compliant constructor
			evt = document.createEvent('CustomEvent');
			evt.initCustomEvent(eventName, bubbles, true, data);

			//a modern constructor would be:
			// var evt = new CustomEvent(eventName, { detail: data, bubbles: bubbles })
		}

		emitMethod = target.dispatchEvent;
	}

	//create event for jQuery object
	else if ($ && target instanceof $) {
		//TODO: decide how to pass data
		evt = $.Event( eventName, data );
		evt.detail = data;

		//FIXME: reference case where triggerHandler needed (something with multiple calls)
		emitMethod = bubbles ? targte.trigger : target.triggerHandler;
	}

	//detect target events
	else {
		emitMethod = target['emit'] || target['trigger'] || target['fire'] || target['dispatchEvent'];
	}


	//use locks to avoid self-recursion on objects wrapping this method
	if (emitMethod) {
		if (icicle.freeze(target, 'emit' + eventName)) {
			//use target event system, if possible
			emitMethod.call(target, evt, data, bubbles);
			icicle.unfreeze(target, 'emit' + eventName);

			return;
		}

		//if event was frozen - probably it is Emitter instance
		//so perform normal callback
	}


	//fall back to default event system
	//ignore if no event specified
	var evtCallbacks = listeners(target, evt);

	//copy callbacks to fire because list can be changed by some callback (like `off`)
	var fireList = slice(evtCallbacks);
	var args = slice(arguments, 2);
	for (var i = 0; i < fireList.length; i++ ) {
		fireList[i] && fireList[i].apply(target, args);
	}

	return;
}
},{"./listeners":1,"./src/redirect":14,"icicle":2,"sliced":11}],"./keypass":[function(require,module,exports){
/**
 * @module  emmy/keypass
 */

module.exports = keypass;

var pass = require('./pass');
var keyDict = require('key-name');
var lower = require('mustring/lower');
var isArray = require('mutype/is-array');
var isString = require('mutype/is-string');
var redirect = require('./src/redirect');


/**
 * Fire event passing key condition
 *
 * @param {Array|String|Number} keys A keys to filter
 *
 * @return {Function} Wrapped handler
 */
function keypass(target, evt, fn, keys){
	if (redirect(keypass, arguments)) return;

	//ignore empty keys
	if (!keys) return;

	//prepare keys list to match against
	keys = isArray(keys) ? keys : isString(keys) ? keys.split(/\s*,\s*/) : [keys];
	keys = keys.map(lower);

	return pass(target, evt, fn, function(e){
		var key, which = e.which !== undefined ? e.which : e.keyCode;
		for (var i = keys.length; i--;){
			key = keys[i];
			if (which == key || keyDict[key] == which) return true;
		}
	});
}
},{"./pass":13,"./src/redirect":14,"key-name":3,"mustring/lower":4,"mutype/is-array":5,"mutype/is-string":8}],"./later":[function(require,module,exports){
/**
 * @module  emmy/delay
 */

module.exports = delay;


var on = require('./on');
var redirect = require('./src/redirect');


/**
 * Postpone callback call for N ms
 *
 * @return {Function} Wrapped handler
 */
function delay(target, evt, fn, interval) {
	if (redirect(delay, arguments)) return;

	var cb = function(){
		var args = arguments;
		var self = this;

		setTimeout(function(){
			fn.apply(self, args);
		}, interval);
	};

	cb.fn = fn;

	on(target, evt, cb);

	return cb;
}
},{"./on":undefined,"./src/redirect":14}],"./off":[function(require,module,exports){
/**
 * @module emmy/off
 */
module.exports = off;

var icicle = require('icicle');
var listeners = require('./listeners');
var redirect = require('./src/redirect');


/**
 * Remove listener[s] from the target
 *
 * @param {[type]} evt [description]
 * @param {Function} fn [description]
 *
 * @return {[type]} [description]
 */
function off(target, evt, fn){
	//parse args
	if (redirect(off, arguments)) return;

	var callbacks, i;

	//unbind all listeners if no fn specified
	if (fn === undefined) {
		//try to use target removeAll method, if any
		var allOff = target['removeAll'] || target['removeAllListeners'];

		//call target removeAll
		if (allOff) {
			allOff.call(target, evt, fn);
		}

		//then forget own callbacks, if any
		callbacks = listeners(target);

		//unbind all if no evtRef defined
		if (evt === undefined) {
			for (var evtName in callbacks) {
				off(target, evtName, callbacks[evtName]);
			}
		}
		else if (callbacks[evt]) {
			off(target, evt, callbacks[evt]);
		}

		return;
	}


	//target events (string notation to advanced_optimizations)
	var offMethod = target['off'] || target['removeEventListener'] || target['removeListener'];


	//use target `off`, if possible
	if (offMethod) {
		//avoid self-recursion from the outside
		if (icicle.freeze(target, 'off' + evt)){
			offMethod.call(target, evt, fn);
			icicle.unfreeze(target, 'off' + evt);
		}

		//if it’s frozen - ignore call
		else {
			return;
		}
	}


	//forget callback
	var evtCallbacks = listeners(target, evt);

	//remove specific handler
	for (i = 0; i < evtCallbacks.length; i++) {
		//once method has original callback in .fn
		if (evtCallbacks[i] === fn || evtCallbacks[i].fn === fn) {
			evtCallbacks.splice(i, 1);
			break;
		}
	}

	return;
}



},{"./listeners":1,"./src/redirect":14,"icicle":2}],"./once":[function(require,module,exports){
/**
 * @module emmy/once
 */
module.exports = once;

var icicle = require('icicle');
var off = require('./off');
var on = require('./on');
var redirect = require('./src/redirect');


/**
 * Add an event listener that will be invoked once and then removed.
 *
 * @return {target}
 */
function once(target, evt, fn){
	//parse args
	if (redirect(once, arguments)) return;

	//get target once method, if any
	var onceMethod = target['once'] || target['one'] || target['addOnceEventListener'] || target['addOnceListener'];

	//use target event system, if possible
	if (onceMethod) {
		//avoid self-recursions
		if (icicle.freeze(target, 'one' + evt)){
			var res = onceMethod.call(target, evt, fn);

			//FIXME: save callback, just in case of removeListener
			// listeners.add(target, evt, fn);
			icicle.unfreeze(target, 'one' + evt);

			return res;
		}

		//if still called itself second time - do default routine
	}

	//use own events
	//wrap callback to once-call
	var cb = function() {
		off(target, evt, cb);
		fn.apply(target, arguments);
	};

	cb.fn = fn;

	//bind wrapper default way - in case of own emit method
	on(target, evt, cb);

	return cb;
}
},{"./off":undefined,"./on":undefined,"./src/redirect":14,"icicle":2}],"./on":[function(require,module,exports){
/**
 * @module emmy/on
 */
module.exports = on;


var icicle = require('icicle');
var listeners = require('./listeners');
var redirect = require('./src/redirect');


/**
 * Bind fn to the target
 *
 * @param {string} evt An event name
 * @param {Function} fn A callback
 *
 * @return {object} A target
 */
function on(target, evt, fn){
	//parse args
	if (redirect(on, arguments)) return;

	//get target on method, if any
	var onMethod = target['on'] || target['addEventListener'] || target['addListener'];

	//use target event system, if possible
	if (onMethod) {
		//avoid self-recursions
		//if it’s frozen - ignore call
		if (icicle.freeze(target, 'on' + evt)){
			onMethod.call(target, evt, fn);
			icicle.unfreeze(target, 'on' + evt);
		}
		else {
			return;
		}
	}

	//save the callback anyway
	listeners.add(target, evt, fn);


	return;
}
},{"./listeners":1,"./src/redirect":14,"icicle":2}],"./throttle":[function(require,module,exports){
/**
 * Throttle function call.
 *
 * @module emmy/throttle
 */

module.exports = throttle;

var on = require('./on');
var off = require('./off');
var redirect = require('./src/redirect');



/**
 * Throttles call by rebinding event each N seconds
 *
 * @param {Object} target Any object to throttle
 * @param {string} evt An event name
 * @param {Function} fn A callback
 * @param {int} interval A minimum interval between calls
 *
 * @return {Function} A wrapped callback
 */
function throttle(target, evt, fn, interval){
	if (redirect(throttle, arguments)) return;

	//FIXME: find cases where objects has own throttle method, then use target’s throttle

	//wrap callback
	var cb = function() {
		//do call
		fn.apply(target, arguments);

		//ignore calls
		off(target, evt, cb);

		//till the interval is passed
		setTimeout(function(){
			on(target, evt, cb);
		}, interval);
	};

	cb.fn = fn;

	//bind wrapper
	on(target, evt, cb);

	return cb;
}
},{"./off":undefined,"./on":undefined,"./src/redirect":14}],1:[function(require,module,exports){
/**
 * A storage of per-target callbacks.
 * For now weakmap is used as the most safe solution.
 *
 * @module emmy/listeners
 */

var cache = new WeakMap;


module.exports = listeners;


/**
 * Get listeners for the target/evt (optionally)
 *
 * @param {object} target a target object
 * @param {string}? evt an evt name, if undefined - return object with events
 *
 * @return {(object|array)} List/set of listeners
 */
function listeners(target, evt){
	var listeners = cache.get(target);
	if (!evt) return listeners || {};
	return listeners && listeners[evt] || [];
}


/**
 * Save new listener
 */
listeners.add = function(target, evt, cb){
	//ensure set of callbacks for the target exists
	if (!cache.has(target)) cache.set(target, {});
	var targetCallbacks = cache.get(target);

	//save a new callback
	(targetCallbacks[evt] = targetCallbacks[evt] || []).push(cb);
};
},{}],2:[function(require,module,exports){
/**
 * @module Icicle
 */
module.exports = {
	freeze: lock,
	unfreeze: unlock,
	isFrozen: isLocked
};


/** Set of targets  */
var lockCache = new WeakMap;


/**
 * Set flag on target with the name passed
 *
 * @return {bool} Whether lock succeeded
 */
function lock(target, name){
	var locks = lockCache.get(target);
	if (locks && locks[name]) return false;

	//create lock set for a target, if none
	if (!locks) {
		locks = {};
		lockCache.set(target, locks);
	}

	//set a new lock
	locks[name] = true;

	//return success
	return true;
}


/**
 * Unset flag on the target with the name passed.
 *
 * Note that if to return new value from the lock/unlock,
 * then unlock will always return false and lock will always return true,
 * which is useless for the user, though maybe intuitive.
 *
 * @param {*} target Any object
 * @param {string} name A flag name
 *
 * @return {bool} Whether unlock failed.
 */
function unlock(target, name){
	var locks = lockCache.get(target);
	if (!locks || !locks[name]) return false;

	locks[name] = null;

	return true;
}


/**
 * Return whether flag is set
 *
 * @param {*} target Any object to associate lock with
 * @param {string} name A flag name
 *
 * @return {Boolean} Whether locked or not
 */
function isLocked(target, name){
	var locks = lockCache.get(target);
	return (locks && locks[name]);
}
},{}],3:[function(require,module,exports){
module.exports={
	"⌥": 18, "alt": 18, "option": 18,
	"backspace": 8,
	"capslock": 20, "caps": 20,
	"clear": 12,
	"context": 93,
	"⌘": 91, "cmd": 91, "command": 91,
	"⌃": 17, "ctrl": 17, "control": 17,
	"del": 46, "delete": 46,
	"down": 40,
	"end": 35,
	"⎆": 13, "enter": 13, "return": 13,
	"esc": 27, "escape": 27,
	"home": 36,
	"insert": 45,
	"left": 37,
	"pagedown": 34, "pg-down": 34,
	"pageup": 33, "pg-up": 33,
	"pause": 19,
	"right": 39,
	"⇧": 16, "shift": 16,
	"space": 32,
	"tab": 9,
	"up": 38,

	"F1": 112,
	"F2": 113,
	"F3": 114,
	"F4": 115,
	"F5": 116,
	"F6": 117,
	"F7": 118,
	"F8": 119,
	"F9": 120,
	"F10": 121,
	"F11": 122,
	"F12": 123,

	"leftmouse": 1,
	"rightmouse": 3,
	"middlemouse": 2,

	"*": 106,
	"+": 107, "plus": 107,
	"-": 109, "minus": 109,
	";": 186, "semicolon": 186,
	"=": 187, "equals": 187,
	",": 188,
	"dash": 189,
	".": 190,
	"/": 191,
	"`": 192, "~": 192,
	"[": 219,
	"\\": 220,
	"]": 221,
	"'": 222
}
},{}],4:[function(require,module,exports){
//lowercasify
module.exports = function(str){
	return (str + '').toLowerCase();
}
},{}],5:[function(require,module,exports){
module.exports = function(a){
	return a instanceof Array;
}
},{}],6:[function(require,module,exports){
module.exports = function(a){
	return !!(a && a.apply);
}
},{}],7:[function(require,module,exports){
/**
 * @module mutype/is-object
 */

//TODO: add st8 tests

//isPlainObject indeed
module.exports = function(a){
	// return obj === Object(obj);
	return a && a.constructor && a.constructor.name === "Object";
};

},{}],8:[function(require,module,exports){
module.exports = function(a){
	return typeof a === 'string' || a instanceof String;
}
},{}],9:[function(require,module,exports){
/** @module query-relative/closest */
var doc = document, root = doc.documentElement;
var matches = require('matches-selector');

/**
* Get closest parent matching selector (or self)
*/
module.exports = function(e, q){
	//root el is considered the topmost
	if (e === doc) return root;
	if (!q || (q instanceof Node ? e == q : matches(e, q))) return e;
	while ((e = e.parentNode) !== doc) {
		if (!q || (q instanceof Node ? e == q : matches(e, q))) return e;
	}
};
},{"matches-selector":10}],10:[function(require,module,exports){
'use strict';

var proto = Element.prototype;
var vendor = proto.matches
  || proto.matchesSelector
  || proto.webkitMatchesSelector
  || proto.mozMatchesSelector
  || proto.msMatchesSelector
  || proto.oMatchesSelector;

module.exports = match;

/**
 * Match `el` to `selector`.
 *
 * @param {Element} el
 * @param {String} selector
 * @return {Boolean}
 * @api public
 */

function match(el, selector) {
  if (vendor) return vendor.call(el, selector);
  var nodes = el.parentNode.querySelectorAll(selector);
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i] == el) return true;
  }
  return false;
}
},{}],11:[function(require,module,exports){
module.exports = exports = require('./lib/sliced');

},{"./lib/sliced":12}],12:[function(require,module,exports){

/**
 * An Array.prototype.slice.call(arguments) alternative
 *
 * @param {Object} args something with a length
 * @param {Number} slice
 * @param {Number} sliceEnd
 * @api public
 */

module.exports = function (args, slice, sliceEnd) {
  var ret = [];
  var len = args.length;

  if (0 === len) return ret;

  var start = slice < 0
    ? Math.max(0, slice + len)
    : slice || 0;

  if (sliceEnd !== undefined) {
    len = sliceEnd < 0
      ? sliceEnd + len
      : sliceEnd
  }

  while (len-- > start) {
    ret[len - start] = args[len];
  }

  return ret;
}


},{}],13:[function(require,module,exports){
/**
 * Invoke callback if condition passes.
 *
 * @param {Function} condition A condition checker
 * @alias filter
 *
 * @module  emmy/pass
 */


module.exports = pass;


var redirect = require('./src/redirect');
var on = require('./on');


function pass(target, evt, fn, condition){
	if (redirect(pass, arguments)) return;

	var cb = function(e){
		if (condition.apply(this, arguments)) {
			return fn.apply(this, arguments);
		}
	};

	cb.fn = fn;

	on(target, evt, cb);

	return cb;
};
},{"./on":undefined,"./src/redirect":14}],14:[function(require,module,exports){
/**
 * Iterate method for args.
 * Ensure that final method is called with single arguments,
 * so that any list/object argument is iterated.
 *
 * Supposed to be used internally by emmy.
 *
 * @module emmy/redirect
 */


var isArrayLike = require('mutype/is-array-like');
var isObject = require('mutype/is-object');
var slice = require('sliced');

module.exports = function(method, args, ignoreFn){
	var target = args[0], evt = args[1], fn = args[2];

	//batch events
	if (isObject(evt)){
		for (var evtName in evt){
			method(target, evtName, evt[evtName]);
		}
		return true;
	}

	//bind all callbacks, if passed a list (and no ignoreFn flag)
	if (isArrayLike(fn) && !ignoreFn){
		args = slice(args, 3);
		for (var i = fn.length; i--;){
			// method(target, evt, fn[i]);
			method.apply(this, [target, evt, fn[i]].concat(args));
		}
		return true;
	}

	//bind all events, if passed a list
	if (isArrayLike(evt)) {
		args = slice(args, 2);
		for (var i = evt.length; i--;){
			// method(target, evt[i], fn);
			method.apply(this, [target, evt[i]].concat(args));
		}
		return true;
	}

	//bind all targets, if passed a list
	if (isArrayLike(target)) {
		args = slice(args, 1);
		for (var i = target.length; i--;){
			// method(target[i], evt, fn);
			method.apply(this, [target[i]].concat(args));
		}
		return true;
	}
};
},{"mutype/is-array-like":undefined,"mutype/is-object":7,"sliced":11}],"mutype/is-array-like":[function(require,module,exports){
var isString = require('./is-string');
var isArray = require('./is-array');
var isFn = require('./is-fn');

//FIXME: add tests from http://jsfiddle.net/ku9LS/1/
module.exports = function (a){
	return isArray(a) || (a && !isString(a) && !a.nodeType && (typeof window != 'undefined' ? a != window : true) && !isFn(a) && typeof a.length === 'number');
}
},{"./is-array":5,"./is-fn":6,"./is-string":8}]},{},[]);