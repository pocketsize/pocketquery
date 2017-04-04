/*! pocketquery.js | pocketQuery v1.0  | pocketsize.se
 *
 *  Developed by Pocketsize
 *  http://www.pocketsize.se/
 */

(function() {

	/**
	* Main object
	*/

	// Define main object
	window.pocketQuery = function() { return pocketQuery.select.apply( pocketQuery, arguments ); };

	// Define core utility functions needed to extend main
	pocketQuery.each = function( o, callback ) {
		var obj = {};
		if (
			   HTMLCollection.prototype.isPrototypeOf( o )
			|| NodeList.prototype.isPrototypeOf( o )
		) {
			var arr = Array.prototype.slice.call(o, 0);
			for ( var i = 0; i < o.length; i++ ) obj[i] = arr[i];
		} else { obj = o; }

		for ( var k in obj ) {
			if ( obj.hasOwnProperty( k ) ) {
				if ( !!callback ) {
					if ( callback.call( obj[k], k ) === false ) break;
				}
			}
		}
		return this;
	};
	pocketQuery.extend = function( obj, overwrite ) {
		if ( overwrite !== false ) overwrite = true;
		return this.each(obj, function(prop) {
			if ( !overwrite && typeof pocketQuery[prop] != 'undefined' ) return true;
			pocketQuery[prop] = this;
		});
	};

	// Extend main object
	pocketQuery.extend({

		// General variables
		version: 1.0,
		domReady: false,

		// Utility functions
		indexOf: function( haystack, needle ) {
			var index = -1, i =  0;
			this.each(haystack, function() {
				if ( this == needle ) {
					index = i; return false;
				}
				i++;
			});
			return index;
		},
		length: function( obj ) {
			var length = 0;
			this.each(obj, function() { length++; });
			return length;
		},
		timer: function( type, callback, timer, scope ) {
			return new function() {
				if ( !type || !callback ) return false;
				if ( !timer ) timer = 0;
				if ( !scope ) scope = window;

				if ( type == 'interval' ) {
					this.clear = function() { clearInterval(this.timer); };
					this.set = function( callback, timer, scope ) {
						this.timer = setInterval(function () {
							callback.apply(scope);
						}, timer);
					};
				} else {
					this.clear = function() { clearTimeout(this.timer); };
					this.set = function( callback, timer, scope ) {
						this.timer = setTimeout(function () {
							callback.apply(scope);
						}, timer);
					};
				}
				
				this.set( callback, timer, scope );
				return this;
			};
		},
		timeout: function( callback, timer, scope ) {
			return this.timer( 'timeout', callback, timer, scope );
		},
		interval: function( callback, timer, scope ) {
			return this.timer( 'interval', callback, timer, scope );
		},
		isString: function( s ) {
			return ( typeof s == 'string' || s instanceof String );
		},
		isObject: function( o ) {
			return ( typeof o == 'object' || o instanceof Object );
		},
		isArray: function( a ) {
			return ( typeof a == 'object' && a instanceof Array );
		},
		isFunction: function( f ) {
			return ( typeof f == 'function' || f instanceof Function );
		},
		isNumber: function( n ) {
			return ( typeof n == 'number' || n instanceof Number );
		},
		isInt: function( i ) {
			return ( pocketQuery.toInt( i ) === i );
		},
		toInt: function( i ) {
			return isNaN( parseInt(i) ) ? 0 : parseInt(i);
		},
		toFloat: function( i ) {
			return isNaN( parseFloat(i) ) ? 0 : parseFloat(i);
		},
		camelCase: function( s ) {
			return s.replace(/-+(.)?/g, function( m, c ) { return c ? c.toUpperCase() : '' })
		},
		select: function( target ) {

			// If a function is passed, call it when the DOM is loaded (or instantly if already loaded)
			if ( this.isFunction(target) ) {
				if ( this.domReady ) {
					target.call( this(document), this );
				} else {
					this(document).on('DOMContentLoaded', function() {
						target.call( pocketQuery(document), pocketQuery );
						pocketQuery.domReady = true;
					});
				}

				return this;
			}

			// Create element collection
			var collection = [];

			// Set blank selector string
			collection.selector = '';

			if ( !!target && target !== '' ) {

				if ( this.isArray(target) ) {

					// If array, create collection with all objects
					this.each(target, function(i) {
						collection[i] = this;
					});

					// If target had a selector string, attach it to this collection
					if ( !!target.selector ) collection.selector = target.selector;

				} else if ( this.isObject( target ) ) {

					// If object, wrap in a single element collection
					collection = [ target ];

				} else if ( this.isString(target) ) {

					// If selector string, run the query and add the matches
					this.each(document.querySelectorAll( target ), function( k ) {
						collection[k] = this;
					});

					// Set the selector string for future reference
					collection.selector = target;

				}

			}

			// Extend collection with pocketQuery.fn
			for ( var fn in this.fn ) {
				if ( fn == 'extend' ) continue;
				collection[fn] = this.fn[fn];
			}

			return collection;

		},
		fn: {
			
			// Element functions
			extend: function( obj, overwrite ) {
				if ( overwrite !== false ) overwrite = true;
				return pocketQuery.each(obj, function( k ) {
					if ( !overwrite && typeof pocketQuery.fn[ k ] != 'undefined' ) return true;
					pocketQuery.fn[ k ] = obj[ k ];
				});
			},
			each: function( callback ) {
				var selector = !!this.selector ? this.selector : '';
				pocketQuery.each(this, function( k ) {
					if ( pocketQuery.fn.hasOwnProperty( k ) || pocketQuery.isString(this) ) return true;
					var that = pocketQuery(this);
					if ( !!selector ) that.selector = selector;
					return callback.call( that, k );
				});
				return this;
			},
			parents: function( selector, recursive ) {
				var parents = [];
				if ( !recursive && recursive !== false ) recursive = true;

				this.each(function() {
					var parent = this[0].parentNode;
					if ( !parent ) return false;

					while ( parent && parent != document ) {

						if ( pocketQuery.indexOf( parents, parent ) == -1 && pocketQuery(parent).is( selector ) ) {
							parents.push( parent );
						}

						parent = parent.parentNode || false;
						if ( !recursive ) break;
					}
				});

				return pocketQuery(parents);
			},
			parent: function( selector ) {
				var parents = [];
				this.each(function() {
					var thisParents = this.parents( selector, false );
					thisParents.each(function() {
						parents.push( this[0] );
					});
				});
				return pocketQuery( parents );
			},
			find: function( target ) {
				var collection = [];
				this.each(function() {
					pocketQuery.each(this[0].querySelectorAll( target ), function( k ) {
						collection[k] = this;
					});
				});
				return pocketQuery( collection );
			},
			is: function( selector ) {
				var filter = this[0].matches ? 'matches' : ( this[0].matchesSelector ? 'matchesSelector' : false );
				return ( !!filter && this[0][ filter ]( selector ) );
			},
			filter: function( selector ) {
				var collection = [];
				this.each(function() {
					if ( this.is( selector ) ) collection.push( this[0] );
				});
				return pocketQuery( collection );
			},
			eq: function( index ) {
				if ( !this[ index ] ) return pocketQuery([]);
				return pocketQuery( this[ index ] );
			},
			on: function( event, callback ) {
				var p = ['webkit', 'moz', 'MS', 'o', ''];
				return this.each(function() {
					// Create a scoped callback with a pocketQuery object
					var scopedCallback = function( e ) {
						callback.call( pocketQuery(this), e );
					};
					// In needed, prefix event name according to browser requirements
					for (var i = 0; i < p.length; i++ ) {
						this[0].addEventListener( p[i] + event, scopedCallback );
					}
				});
			},
			trigger: function( event ) {
				return this.each(function() {
					var e = new Event( event );
					this[0].dispatchEvent( e );
				});
			},
			classes: function() {
				var classes = [];
				this.each(function() {
					var className = this[0].className.replace(/^\s+|\s+$/g, '');
					if ( className === '' ) return false;
					classes = className.split(/\s+/);
					return false;
				});
				return classes;
			},
			hasClass: function( className ) {
				var found = false;
				this.each(function() {
					if ( pocketQuery.indexOf( this.classes(), className ) != -1 ) {
						found = true; return false;
					}
				});
				return found;
			},
			addClass: function( className ) {
				return this.each(function() {
					var classes = this.classes();
					pocketQuery.each(className.split(' '), function() {
						if ( pocketQuery.indexOf( classes, this.toString() ) == -1 ) {
							classes.push( this );
						}
					});
					this[0].setAttribute( 'class', classes.join(' ') );
				});
			},
			removeClass: function( className ) {
				return this.each(function() {
					var classes = this.classes();
					pocketQuery.each(className.split(' '), function() {
						var index = pocketQuery.indexOf( classes, this.toString() );
						if ( index != -1 ) {
							classes.splice( index, 1 );
						}
					});
					this[0].setAttribute( 'class', classes.join(' ') );
				});
			},
			attr: function() {
				if ( arguments.length == 1 ) {
					return this[0].getAttribute( arguments[0] );
				} else if ( arguments.length > 1 ) {
					var args = arguments;
					return this.each(function() {
						this[0].setAttribute( args[0], args[1] );
					});
				}
				return this;
			},
			removeAttr: function( attr ) {
				return this.each(function() {
					this[0].removeAttribute( attr );
				});
			}

		}

	});

})();