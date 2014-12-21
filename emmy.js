(function(){function v(a,b){if(a){var c=arguments;if("string"===typeof b||b instanceof String)c=w(arguments,2),b.split(/\s+/).forEach(function(b){x.apply(this,[a,b].concat(c))});else return x.apply(this,c)}}function f(a){if(a){for(var b in f.prototype)a[b]=f.prototype[b];return a}}function n(a,b,c,e){if(!a)return a;var d=a.on||a.addEventListener||a.addListener,g;g=e?n.wrap(c,e):c;b.split(/\s+/).forEach(function(b){if(d)if(y.freeze(a,"on"+b))d.call(a,b,g),y.b(a,"on"+b);else return a;D.on.call(a,b,
g)});return a}function p(a,b,c){if(!a)return a;var e;if(void 0===c){var d=E(arguments,1),g=a.removeAll||a.removeAllListeners;g&&g.apply(a,d);e=a.a;if(b)b.split(/\s+/).forEach(function(b){if(e[b])for(var c=e[b].length;c--;)p(a,b,e[b][c])});else for(b in e)p(a,b);z.off.apply(a,d);return a}var f=a.off||a.removeEventListener||a.removeListener;b.split(/\s+/).forEach(function(b){if(f)if(A.freeze(a,"off"+b))f.call(a,b,c),A.b(a,"off"+b);else return a;z.off.call(a,b,c)});return a}function x(a,b,c,e){var d,
g=b;a.nodeType||a===F||a===G?(b instanceof Event?g=b:(g=document.createEvent("CustomEvent"),g.initCustomEvent(b,e,!0,c)),d=a.dispatchEvent):u&&a instanceof u?(g=u.Event(b,c),g.detail=c,d=e?targte.trigger:a.triggerHandler):d=a.emit||a.trigger||a.fire||a.dispatchEvent;g=[g].concat(w(arguments,2));if(d&&B.freeze(a,"emit"+b))return d.apply(a,g),B.b(a,"emit"+b),a;H.emit.apply(a,g);return a}function r(a,b,c){if(a){var e=a.once||a.one||a.addOnceEventListener||a.addOnceListener,d;d=r.wrap(a,b,c,I);b.split(/\s+/).forEach(function(b){if(e&&
C.freeze(a,"one"+b)){var f=e.call(a,b,c);C.b(a,"one"+b);return f}J(a,b,d)});return d}}function k(a){if(a){for(var b in l)a[b]=l[b];return a}}function s(a){return function(){a.apply(this,[this].concat(K(arguments)));return this}}function m(a){return function(){a.apply(this,arguments);return this}}window.Emitter=k;var h,q;f.prototype.on=f.prototype.addEventListener=function(a,b){this.a=this.a||{};(this.a[a]=this.a[a]||[]).push(b);return this};f.prototype.once=function(a,b){function c(){e.off(a,c);b.apply(this,
arguments)}var e=this;this.a=this.a||{};c.fn=b;this.on(a,c);return this};f.prototype.off=f.prototype.removeListener=f.prototype.removeEventListener=function(a,b){this.a=this.a||{};if(0==arguments.length)return this.a={},this;var c=this.a[a];if(!c)return this;if(1==arguments.length)return delete this.a[a],this;for(var e,d=0;d<c.length;d++)if(e=c[d],e===b||e.fn===b){c.splice(d,1);break}return this};f.prototype.emit=function(a){this.a=this.a||{};var b=[].slice.call(arguments,1),c=this.a[a];if(c)for(var c=
c.slice(0),e=0,d=c.length;e<d;++e)c[e].apply(this,b);return this};f.prototype.listeners=function(a){this.a=this.a||{};return this.a[a]||[]};f.prototype.hasListeners=function(a){return!!this.listeners(a).length};h={freeze:function(a,b){var c=t.get(a);if(c&&c[b])return!1;c||(c={},t.set(a,c));return c[b]=!0},b:function(a,b){var c=t.get(a);if(!c||!c[b])return!1;c[b]=null;return!0},isFrozen:function(a,b){var c=t.get(a);return c&&c[b]}};var t=new WeakMap;q=q=function(a,b,c){var e=[],d=a.length;if(0===d)return e;
b=0>b?Math.max(0,b+d):b||0;for(void 0!==c&&(d=0>c?c+d:c);d-- >b;)e[d-b]=a[d];return e};var y=h,D=f.prototype;n.wrap=function(a,b,c,e){function d(){if(e.apply(a,arguments))return c.apply(a,arguments)}d.fn=c;return d};var A=h,E=q,z=f.prototype,B=h,w=q,H=f.prototype,u="undefined"===typeof jQuery?void 0:jQuery,F="undefined"===typeof document?void 0:document,G="undefined"===typeof window?void 0:window,C=h,J=n,I=p;r.wrap=function(a,b,c,e){function d(){e(a,b,d);c.apply(a,arguments)}d.fn=c;return d};var K=
q;h=f.prototype;var l=k.prototype=Object.create(h);l.on=s(n);l.once=s(r);l.off=s(p);l.emit=s(v);k.on=m(n);k.once=m(r);k.off=m(p);k.emit=m(v);k.listeners=m(h.listeners);k.hasListeners=m(h.hasListeners)})();
