/**
 * CouchDB base class/resource definition.
 * This file should be inherited by all CouchDB models that want to leverage 
 * CouchDB's power in rocket.
 */

var cradle = require('cradle');
 
var oo = require('../utils/oo');
var BaseResource = require('./base_resource');

/*****************************************************************************/
/* Default connection parameters
 */

CouchDBResource.connection = {
    host: 'localhost'
  , port: 5984
  , raw: true
  , cache: false
  , auth: null
};

/*****************************************************************************/
/* Default _design documents
 */

CouchDBResource.ddocs = [
  {
      _id: '_design/app'
    , lists: {}
    , shows: {}
    , updates: {}
    , views: {}
  }
];

/*****************************************************************************/
/* Default _security document
 */
CouchDBResource._security = {
    admins: {
        names: []
      , roles: []
    }
  , readers: {
        names: []
      , roles: []
    }  
};

/*****************************************************************************/
/* Prototype functions
 */
 
CouchDBResource.prototype = {
    initialize: function initialize_CouchDBResource() {}    
  , create: function create_CouchDBResource() {}
  , get: function get_CouchDBResource()Ê{}
  , update: function update_CouchDBResource() {}
  , destroy: function destroy_CouchDBResource() {}
  , all: function all_CouchDBResource() {}
 };

/*****************************************************************************/
/* CouchDBResource's Constructor
 */
function CouchDBResource() {};

oo.inherits(CouchDBResource, BaseResource);
