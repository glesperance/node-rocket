var events = require('events');

/**
 * Create a Dynamic ADT node, initializes it with according to `obj` and returns 
 * it.
 * 
 * @param obj An object containing initial variables to be set.
 * 
 * @returns The instantiated Node.
 */
exports.createNode = function(obj) {
  
  
  /**
   * Node constructor.
   * 
   * @param obj An object containing initial variables to be set.
   */
  function Node(obj) {
    
    this.values = new Object(obj);
  
  }
  
  //Inherits prototype from `events.EventEmitter`
  Node.prototype = new Object(events.EventEmitter.prototype);
  
  /**
   * Get the value of the variable named `key`.
   * 
   * @param key The `key` of the wanted variable. 
   */
  Node.prototype.get = function get_Node(key) {
  
    return this.values[key];
  
  }
  
  /**
   * Set the variable named `key` to `value`.
   * 
   * @param key The name of the wanted variable.
   * @param value The value to set the variable to.
   * 
   * @returns `this`
   */
  Node.prototype.set = function set_Node(key, value) {
    
    var old_value = this.values[key]
      ;
    
    this.values[key] = value;
    
    if (value instanceof Node) {
      
      value['parent'] = this;
    
    }
    
    this.emit('change', this, key, value, old_value);
    this.emit('change:' + key, this, value, old_value);
  
    return this;
    
  }
  
  /**
   * Set the variable named `key` to `value` if and only if it doesn't already
   * exists.
   * 
   * @param key The name of the wanted variable.
   * @param value The value to set the variable to.
   * 
   * @returns `this`
   */
  Node.prototype.setIfNone = function setIfNone_Node(key, value) {
    
    if (!this.values[key]) {
      
      return this.set(key, value);
      
    } else {
      
      return this;
      
    }
  
  }
  
  //inherit from EventEmitter
  events.EventEmitter.call(this);

  return new Node(obj);
  
}
