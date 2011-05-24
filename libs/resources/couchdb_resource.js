/**
 * CouchDB base class/resource definition.
 * This file should be inherited by all CouchDB models that want to leverage 
 * CouchDB's power in rocket.
 */


var lingo = require('lingo');
var cradle = require('cradle');
var watch  = require('watch');
var async = require('async');
 
var oo = require('../utils/oo');
var BaseResource = require('./base_resource');

/*****************************************************************************/
/* Default connection parameters
 */
CouchDBResource.connection = {
    host: 'localhost'
  , port: 5984
  , options: { 
      raw: true
    , cache: false
    , auth: null
    }
  };

/*****************************************************************************/
/* Default _design documents                                     *** SYNCD ***
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
/* Default _security document                                    *** SYNCD ***
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
/* Resource Prototype Functions (used to create models)
 */
CouchDBResource.prototype = {
    save: function save_CouchDBResourceInstance {}
  , update: function update_CouchDBResourceInstance {}
  , destroy: function destroy_CouchDBResourceInstance {}
  , reload: function reload_CouchDBResourceInstance {}
  , exists: function exists_CouchDBResourceInstance {}
  };
 
/******************************************************************************/
/* Resource Factory/Constructor Functions
 */
var factoryFunctions = {
    initialize: function initialize_CouchDBResource(callback) {
      var that = this;
    
      //Initialize connection object
      that.__connection = new cradle.Connection(
          that.connection.host
        , that.connection.port
        , that.connection.options
        );
      
      //Infer DB name from file name
      if(typeof that.type == 'undefined') {
        throw 'xxx ERROR Model.type is undefined';
      }
      
      that.__db_name = lingo.en.pluralize(that.type);
      
      //setup db object
      that.__db = this.__connection.database(that.__db_name);
      
      //Create db if it doesn't exists. Harmless otherwise.
      that.__db.create();      
      
      async.parallel(
          [function(callback) { 
              async.forEach(_.keys(that.ddocs), syncDoc, callback);
            }
        , function(callback) {
              that.get('_security', syncSecurity);
            }
          ]
        , callback);
        
      function syncSecurity(err, doc)Ê{
          if(err) {
            if(err.error === 'not_found') {
              that._security.save(callback);
            }else{
              callback(err);
            }
          }else{
            oo.__extends(doc, that._security, {overwrite: true});
            doc.save(callback);
          }
        };
              
        
      function syncDoc(docObj, callback) {
          //remove previous digest
          delete docObj.digest;
          
          //docObj to a JSON string
          var docJSON = JSON.stringify(docObj);
          
          //compute the MD5sum of the string
          var md5sum = crypto.createHash('md5');
          md5sum.update(docJSON);
          
          //store the result
          docObj.digest = md5sum.digest('md5');
          
          that.get(doc._id, checkAndUpdate);
          
          function checkAndUpdate(err, doc)Ê{
              if(err) {
                if(err.error === 'not_found'){
                  that.create(docObj);
                }else{
                  callback(err);
                }
              }else{
                if(doc.digest !== docObj.digest) {
                  oo.__extends(doc, docObj, {overwrite: true});
                  doc.save(callback);
                }else{
                  callback(null);
                }
            };
        };
        
    }
  , create: function create_CouchDBResource() {}
  , get: function get_CouchDBResource()Ê{}
  , update: function update_CouchDBResource() {}
  , destroy: function destroy_CouchDBResource() {}
  , all: function all_CouchDBResource() {}
  };

oo.__extends(CouchDBResource, factoryFunctions, {overwrite: true});

/*****************************************************************************/
/* CouchDBResource's Constructor
 */
function CouchDBResource() {};

oo.inherits(CouchDBResource, BaseResource);

//Finally export the CouchDBResource Object
module.exports = CouchDBResource;
