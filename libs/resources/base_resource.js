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
  };

/******************************************************************************
 * Validation functions
 *
 */
BaseResource.validator = {
    AlphaNumeric: function(obj) {
      var regexp = /^[A-Z0-9]$/;
      
      if(! regexp.test(obj)) {
        throw({ invalid: 'Alpha-Numeric string expected'});
      }
    }
  , Integer: function(obj) {
      var regexp = /^[0-9]+$/;
      if(! regexp.test(obj.toString())) {
        throw({ invalid: 'Integer expected'});
      }
    }
  , Email: function(obj) {
      var regexp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}/i;
      
      if(! regexp.test(obj)) {
        throw({ invalid: 'The email address you entered is invalid' });
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
              create the on disk db file, etc. 
     * 
     */
    initialize: function initialize() { /* Silence is Golden */ }
    
    /**
     * These are your usual DB utility functions.
     */
  , create: unimplemented('create_UnknownResource')
  , get: unimplemented('get_UnknownResource')
  , update: unimplemented('update_UnknownResource')
  , destroy: unimplemented('destroy_UnknownResource')
  , all: unimplemented('all_UnknownResource')
  };

oo.__extends(BaseResource, factoryFunctions);

/******************************************************************************
 * Base Resource Constructor
 */
function BaseResource(){ /* silence is golden */ }

//Finally export the `BaseResource` class
module.exports = BaseResource;