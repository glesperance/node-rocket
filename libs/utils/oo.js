
exports.__extends = function __extends(child, parent, options) {
  
  var options = options || {}
    , child_copy = undefined;

  for(var prop in parent) {
    if(typeof parent[prop] !== 'undefined' && parent[prop] !== child[prop]) {
      var dst = undefined;
      
      if(options.copyOnWrite) {
        child_copy = child_copy || __extends({}, child);
        dst = child_copy
      }else{
        dst = child;
      }
      
      dst[prop] = (!options.overwrite && typeof dst[prop] !== 'undefined' ? dst[prop] : parent[prop]);
    }
  }
  return child_copy || child;
};

/*****************************************************************************/


function __deepExtends(child, parent, options) { 
  
  var options = options || {}
    , child_copy = undefined
    ;

  for (var prop in parent) {
  
    //ignore all `undefined` and equal props
    if(typeof parent[prop] !== 'undefined' && parent[prop] !== child[prop] ) {
      var dst;
      
      if(options.copyOnWrite) {
        child_copy = child_copy || __extends({}, child);
        dst = child_copy;
      }else{
        dst = child;
      }
    
      //if the current prop is an object, and is not `null` we recurse
      if(typeof parent[prop] === 'object' 
      && parent[prop] !== null 
      && !Array.isArray(parent[prop])
      && typeof parent[prop] === dst[prop]
      )
      {        
        dst[prop] = dst[prop] || new parent[prop].constructor();
        dst[prop] = arguments.callee(dst[prop], parent[prop], options);
      }else{
        /**
         * if the prop is *not* an object (or is null)
         * copy it in the child if it doesn't already exists
         */  
        if(typeof parent[prop] === 'object' 
        && parent[prop] !== null 
        && Array.isArray(parent[prop])
        && Array.isArray(dst[prop])
        )
        {
          dst[prop] = dst[prop].concat(parent[prop]);
        }else{
          dst[prop] = (!options.overwrite && typeof dst[prop] !== 'undefined' ? dst[prop] : parent[prop]);
        }
      }
    }
  }
  return child_copy || child;
};

exports.__deepExtends = __deepExtends;

/*****************************************************************************/

function inherits(child, parent) {
  
  ///copy all memebrs of parents to this (the child)
  __deepExtends(child, parent);
  
  //constructor helper
  function ctor() { 
    //set the constructor of the current context back to the child's
    this.constructor = child.constructor;
  }
  //set ctor prototype to the parent's
  ctor.prototype = parent.prototype;
  
  //set the child's prototype to new object such that
  //
  // (1) child.prototype.constructor = obj.contructor = child
  // (2) child.prototype.__proto__   = obj.__proto__ 
  //                                 = ctor.prototype 
  //                                 = parent.prototype
  child.prototype = new ctor;
  
  //save the parent's prototype for direct future reference
  child.__super__ = parent.prototype.constructor;
  child.prototype.__super__ = parent.prototype;
  
};

exports.inherits = inherits;

/*****************************************************************************/

exports.unimplemented = function unimplemented(name) {
  return function(){
    throw "xxx function " + name + "() hasn't been implemented";
  };
};