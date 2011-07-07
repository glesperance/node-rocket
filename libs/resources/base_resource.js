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
      , { get: getter, set: setter }
      );
    }
  };

/******************************************************************************
 * Validation functions
 */
BaseResource.validators = {
    AlphaNumeric: function(name, obj) {
      var regexp = new RegExp('^[A-Z0-9]+$', 'i');
      if(! regexp.test(obj)) {
        throw({ invalid: name + ': Alpha-Numeric string expected got ' + obj});
      }
    }
  , Integer: function(name, obj) {
      var regexp = new RegExp('^(-)?[0-9]+$');
      if(! regexp.test(obj.toString())) {
        throw({ invalid: name + ': Integer expected got ' + obj});
      }
    }
  , Email: function(name, obj) {
      var r = new RegExp('^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}', 'i');
      
      if(! r.test(obj)) {
        throw({ invalid: name + ': The email address you entered is invalid got ' + obj });
      }
    }
  , Boolean: function(name, obj) {
      if(obj !== 'true' || obj !== 'false') {
        throw({ invalid: name + ': Value required to be either \'true\' or \'false\' got ' + obj});
      }
    }
  , Date: function(obj) {
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