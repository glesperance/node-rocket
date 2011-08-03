 /**
  * This is the base resource object that must be inherited by all other
  * resources.
  * It is used mostly as an interface upon which we build other resources as 
  * as a reference document for those who want to build other `Resource`
  * objects.
  */
var oo = require('../utils/oo');
var unimplemented = oo.unimplemented;

var suffix = '_resource';

/******************************************************************************
 * Resource Prototype Functions (used to create models)
 */ 
BaseResource.prototype = {
    save: unimplemented('save_UnknownResourceInstance')
  , update: unimplemented('update_UnknownResourceInstance')
  , destroy: unimplemented('destroy_UnknownResourceInstance')
  , reload: unimplemented('reload_UnknownResourceInstance')
  , exists: unimplemented('exists_UnknownResourceInstance')
  , setAlias: function setAlias_BaseResource(alias_name, options) {
      var prefix = ''
        , real_name = options
        , getter = function() {
            return this[real_name];
          }
        , setter = function(new_val) {
            this[real_name] = new_val;
          }
        ;
      
      if(typeof options === 'object') {
        real_name = options.name;
        if(options.noPrefix) {
        
          prefix = this.constructor.schema[real_name].prefix;
          
          getter = function() {
            var value = this[real_name];
            return (typeof value === 'string' ? value.substr(prefix.length) : value);
          };
          setter = function(new_val) {
            this[real_name] = prefix + new_val;
          };
        }
      }
  
      Object.defineProperty(
        this
      , alias_name
      , { get: getter, set: setter, enumerable: true }
      );
    }
  };

/******************************************************************************
 * Validation functions
 */
BaseResource.validators = {
    AlphaNumeric: function(obj) {
      var regexp = new RegExp('^[A-Z0-9]+$', 'i')
        ;
      
      if(! regexp.test(obj)) {
        return 'Alphanumeric string expected [' + obj + ']';
      }
      
    }
  , Integer: function(obj) {
      var regexp = new RegExp('^(-)?[0-9]+$')
        ;
      
      if(! regexp.test(obj.toString())) {
        return 'Integer expected [' + obj + ']';
      }
      
    }
  , Email: function(obj) {
      var r = new RegExp('^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}', 'i')
        ;
      
      if(! r.test(obj)) {
        return 'Invalid email address [' + obj + ']';
      }
    }
  , Boolean: function(obj) {
      if(obj !== 'true' || obj !== 'false') {
        return 'Boolean value expected [' + obj + ']';
      }
    }
  , Date: function(obj) {
    }
  , URL: function(obj) {
      var r = new RegExp('^(http|https)://', 'i');
      if(! r.test(obj)) {
        return 'Invalid URL [' + obj + ']';
      }
    }
  };

/******************************************************************************
 * Resource Factory/Constructor Functions
 */
var factoryFunctions = {
    /**
     * This function is called when `rocket` is started. It allows the resources
     * to bootstrap/initialize their environment.
     *
     *  e.g.: Sync couchDB _design documents, create/update tables in the DB,
     *        create the on disk db file, etc. 
     * 
     */
    initialize: function initialize() { /* Silence is Golden */ }
    
    /**
     * These are your usual DB utility functions.
     */
  , create: unimplemented('UnknownResource.create')
  , get: unimplemented('UnknownResource.get')
  , update: unimplemented('UnknownResource.update')
  , destroy: unimplemented('UnknownResource.destroy')
  , all: unimplemented('UnknownResource.all')
  };

oo.__extends(BaseResource, factoryFunctions);

/******************************************************************************
 * Base Resource Constructor
 */
function BaseResource(obj){
  
  for(var k in this.constructor.schema){
    var v = this.constructor.schema[k];
    
    if(typeof v === 'object' && v) {
      //set aliases
      if(
      ( 
        typeof v.alias === 'object'
      ||typeof v.alias === 'string'
      )
      && v.alias) {
        this.setAlias(k, v.alias);
      }
    }
  }
  oo.__extends(this, obj);
}

//Finally export the `BaseResource` class
module.exports = BaseResource;