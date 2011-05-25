/**
 * CouchDB base class/resource definition.
 * This file should be inherited by all CouchDB models that want to leverage 
 * CouchDB's power in rocket.
 */

var crypto = require('crypto');
var _ = require('underscore');
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
    , views: {
       all: {
          map: function(doc) { emit(doc._id, doc); }
        }
      }
    }
  ];

/*****************************************************************************/
/* Default _security document                                    *** SYNCD ***
 */
CouchDBResource._security = {
    admins: {
        names: ["admin"]
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
    save: function save_CouchDBResourceInstance() {}
  , update: function update_CouchDBResourceInstance() {}
  , destroy: function destroy_CouchDBResourceInstance() {}
  , reload: function reload_CouchDBResourceInstance() {}
  , exists: function exists_CouchDBResourceInstance() {}
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
      
      that.__db_name = lingo.en.pluralize(that.type).toLowerCase();
      
      //setup db object
      that.__db = this.__connection.database(that.__db_name);
      
      //Create db if it doesn't exists. Harmless otherwise.
      that.__db.create();      
      
      async.parallel(
          [function(callback) {
              async.forEach(that.ddocs, syncDoc, callback);
            }
       /* , function(callback) {
              that.get('_security', syncSecurity);
            }*/
          ]
        , callback);
        
      /*function syncSecurity(err, doc) {
          if(err) {
            if(err.error === 'not_found') {
              that.__db.save('_security'
                            , that._security
                            , callback);
            }else{
              callback(err);
            }
          }else{
            //oo.__extends(doc, that._security, {overwrite: true});
             console.log('sec: ' + that._security.toString());
            that.__db.save('_security', that._security, callback);
          }
        };*/
        
      
      function fctToString(obj) {
        for(var key in obj) {
          if(typeof obj[key] === 'function') {
            obj[key] = obj[key].toString();
          }else if(typeof obj[key] === 'object' && obj[key] !== null) {
            arguments.callee(obj[key]);
          }
        }
      }             
        
      function syncDoc(docObj, callback) {
              
        //remove previous digest
        delete docObj.digest;
        
        fctToString(docObj);
        
        //docObj to a JSON string
        var docJSON = JSON.stringify(docObj);
        
        //compute the MD5sum of the string
        var md5sum = crypto.createHash('md5');
        md5sum.update(docJSON);
        
        //store the result
        docObj.digest = md5sum.digest('hex');
        
        that.get(docObj._id, checkAndUpdate);
        
        function checkAndUpdate(err, doc) {
          if(err) {
            if(err.error === 'not_found'){
              that.__db.save(docObj._id, docObj, callback);
            }else{
              callback(err);
            }
          }else{
            if(doc.digest !== docObj.digest) {
              oo.__extends(doc, docObj, {overwrite: true});
              that.__db.save(docObj._id, doc._rev, doc, callback);
            }else{
              callback(null);
            }
          }
        };
      };
    }
  , create: function create_CouchDBResource(properties, callback) {
      var _id = properties._id;
      delete properties._id;
      this.__db.save(_id, properties, callback);
    }
  , save: function save_CouchDBResource(obj, callback) {
      this.__db.save(obj._id, obj._rev, obj, callback);
    }
  , get: function get_CouchDBResource(_id, callback) {
      this.__db.get(_id, callback);
    }
  , update: function update_CouchDBResource(_id, properties, callback) {
      this.__db.merge(_id, properties, callback);
    }
  , destroy: function destroy_CouchDBResource(_id, callback) {
      this.__db.remove(_id, callback);
    }
  , all: function all_CouchDBResource(callback) {}
  };

oo.__extends(CouchDBResource, factoryFunctions, {overwrite: true});

/*****************************************************************************/
/* CouchDBResource's Constructor
 */
function CouchDBResource() {};

oo.inherits(CouchDBResource, BaseResource);

//Finally export the CouchDBResource Object
module.exports = CouchDBResource;
