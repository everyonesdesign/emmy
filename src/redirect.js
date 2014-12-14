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
var isFn = require('mutype/is-fn');
var slice = require('sliced');


module.exports = redirect;


function redirect(method, args, ignoreFn){
	var target = args[0], evt = args[1], fn = args[2], param = args[3];

	//batch events
	if (isObject(evt)){
		for (var evtName in evt){
			if (!redirect(method, [target, evtName, evt[evtName]])) {
				method.apply(this, [target, evtName, evt[evtName]]);
			}
		}
		return true;
	}

	//Swap params, if callback & param are changed places
	if (isFn(param) && !isFn(fn)) {
		method.apply(this, [target, evt, param, fn].concat(slice(args, 4)));
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