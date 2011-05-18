function __extends(child, parent) {
  for(var prop in parent) {
    if(typeof parent[prop] !== 'undefined') {
      child[prop] = (typeof child[prop] !== 'undefined' ? child[prop]: parent[prop]);
    }
  }
  return child;
};
exports.__extends = __extends;

function __deepExtends(child, parent) {
  
  for (var prop in parent) {
  
    //ignore all `undefined` prop
    if(typeof parent[prop] !== 'undefined') {
    
      //if the current prop is an object, and is not `null` we recurse
      if(typeof parent[prop] === 'object' && parent[prop] !== null) {        
        child[prop] = child[prop] || {};
        arguments.callee(child[prop], parent[prop]);
      }else{
        /**
         * if the prop is *not* an object (or is null)
         * copy it in the child if it doesn't already exists
         */
        child[prop] = (typeof child[prop] !== 'undefined' ? child[prop]: parent[prop]);
      }
    }
  }
  return child;
};
exports.__deepExtends = __deepExtends;

function inherits(child, parent) {
  
  ///copy all memebrs of parents to this (the child)
  __deepExtends(child, parent);
  
  //constructor helper
  function ctor() { 
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