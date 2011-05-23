 /**
  * This is the base resource object that must be inherited by all other
  * resources.
  * It is used mostly as an interface upon which we build other resources as 
  * as a reference document for those who want to build other `Resource`
  * objects.
  */
var oo = require('../libs/utils/oo');
var unimplemented = oo.unimplemented;

var suffix = '_resource';

/*****************************************************************************/
/* Resource Prototype Functions (used to create models)
 */ 
CouchDBResource.prototype = {
    save: unimplemented('save_UnknownResourceInstance')
  , update: unimplemented('update_UnknownResourceInstance')
  , destroy: unimplemented('destroy_UnknownResourceInstance')
  , reload: unimplemented('reload_UnknownResourceInstance')
  , exists: unimplemented('exists_UnknownResourceInstance')
  };

/******************************************************************************/
/* Resource Factory/Constructor Functions
 */

var factoryFunctions = {
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
     * These are your usual DB utility functions.
     */
  , create: unimplemented('create_UnknownResource')
  , get: unimplemented('get_UnknownResource')
  , update: unimplemented('update_UnknownResource')
  , destroy: unimplemented('destroy_UnknownResource')
  , all: unimplemented('all_UnknownResource')
  };

oo.__extends(BaseResource, factoryFunctions);

/*****************************************************************************/
/* BaseResource utility functions
 */
 
var utilityFunctions = {
    getTypeFromFilename: function getTypeFromFilename_BaseResource(filename){
        var tmp = filename.split('/');
        
        //extract filename
        tmp = tmp[tmp.length - 1];
        
        //remove filetype
        tmp = tmp.split('.');
        delete tmp[tmp.length - 1];
        tmp = tmp.join('');
        
        //remove suffix
        tmp = tmp.slice(0, tmp.length - suffix.length);
        
        return tmp;
      }
  };

/*****************************************************************************/
/* Base Resource Constructor
 */
function BaseResource(){ /* silence is golden */ }

//Finally export the `BaseResource` class
module.exports = BaseResource;