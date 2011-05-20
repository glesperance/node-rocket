 /**
  * This is the base resource object that must be inherited by all other
  * resources.
  * It is used mostly as an interface upon which we build other resources as 
  * as a reference document for those who want to build other `Resource`
  * objects.
  */

var unimplemented = require('../libs/utils/oo').unimplemented;
  
BaseResource.prototype = {
    /**
     * This function is called when `Rocket` is started. It allows the resources
     * to bootstrap/initialize their environment.
     *
     *  e.g.: Sync couchDB _design documents, create/update tables in the DB,
              create the on disk db file, etc. 
     * 
     */
    initialize: function initialize() { /* Silence is Golden */ }
    
    /**
     * These are you usual DB utility functions.
     */
  , create: unimplemented('create')
  , get: unimplemented('get')
  , update: unimplemented('update')
  , destroy: unimplemented('destroy')
  , all: unimplemented('all')
};

function BaseResource(){ /* silence is godlden */ }

//Finally export the `BaseResource` class
module.exports = BaseResource;