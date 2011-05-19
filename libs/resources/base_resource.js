 /**
  * This is the base resource object that must be inherited by all other
  * resources.
  * It is used mostly as an interface upon which we build other resources as 
  * as a reference document for those who want to build other `Resource`
  * objects.
  */

function unimplemented(name){
  return function(){
    throw "xxx function " + name + "() hasn't been implemented";
  };
}
  
BaseResource.prototype = {
    /**
     * This function is called when `Rocket` is started. It allows the resources
     * to bootstrap/initialize their environment.
     *
     *  e.g.: Sync couchDB _design documents, create/update tables in the DB,
              create the on disk db file, etc. 
     * 
     */
    initialize: function() { /* Silence is Golden */ }
    
    /**
     * This function 
     */
  , create: unimplemented('create')
  , get: unimplemented('get')
  , update: unimplemented('update')
  , all: unimplemented('all')
};

function BaseResource(){}

//Finally export the `BaseResource` class
module.exports = BaseResource;