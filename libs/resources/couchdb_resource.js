/**
 * CouchDB base class/resource definition.
 * This file should be inherited by all CouchDB models that want to leverage 
 * CouchDB's power in rocket.
 */

var crypto = require('crypto')
  , _ = require('underscore')
  , lingo = require('lingo')
  , cradle = require('cradle')
  , async = require('async')
  ;
 
var oo = require('../utils/oo')
  , namespace = require('../utils/namespace')
  , BaseResource = require('./base_resource')
  ;

/******************************************************************************
 * CONSTANTS
 */

var ROCKET_NAMESPACE = 'rocket';

/******************************************************************************
 * Default connection parameters
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

/******************************************************************************
 * Default _design documents                                     *** SYNCD ***
 */
CouchDBResource.ddocs = [
    { 
      _id: '_design/rocket'
    , lists: {}
    , shows: {}
    , updates: {
        in_place: function(doc, req) {
          var oo  = require('rocket/oo')
            , obj = req.form || req.query 
            ;
          oo.__extends(doc, obj, { overwrite: true });
          return [doc, '']
        }
      }
    , validate_doc_update: function(newDoc, oldDoc, userCtx) {
        var schema = require('rocket/schema');
        
        if(newDoc._deleted) {
          return;
        }
                
        for(var member in schema) {
        
          if(typeof schema[member] !== 'undefined' 
          && schema[member] !== null) {
          
            var validator;
            var optional;
            
            if(typeof schema[member] === 'string') {
            
              validator = require('rocket/validators/' + schema[member]) || null;
              
            }else if(typeof schema[member] === 'object') {
            
              optional = schema[member].optional;
              validator = (schema[member].validate ? require('rocket/validators/' + schema[member].validate) : null);
              
            }
            
            if(typeof newDoc[member] !== 'undefined'
            && newDoc[member] !== null) {
              if(validator) {
                validator(newDoc[member]);
              }else{
                continue;
              }
            }else if(optional){
              continue;
            }else{
              throw({ invalid: member + ' can\'t be missing or null' });
            }
          }
        }
      }
    , views: {
       all: {
          map: function(doc) { emit(doc._id, doc); }
        }
      }
    }
  ];

/******************************************************************************
 * Default _security document                                    *** SYNCD ***
 */
CouchDBResource._security = {
    admins: {
        names: ["admin"]
      , roles: []
      }
  , readers: {
        names: ["admin"]
      , roles: []
      }  
  };

/******************************************************************************
 * Resource Prototype Functions (used to create models)
 */

function setProperties(dst, src, synced){
  
  var synced = typeof synced !== 'undefined' ? synced : true;
  
  if(! dst.synced)  { Object.defineProperty(dst, 'synced', {value: {}}); }
  if(! dst.values)    { Object.defineProperty(dst, 'values', {value: {}}); }
  
  function createSetter(prop) {
    return function(v) {
      dst.synced[prop] = dst.synced[prop] && dst.values[prop] === v;
      dst.values[prop] = v;
    }
  }
  
  function createGetter(prop) {
    return function() { return dst.values[prop] };
  }
  
  for(var prop in src) {
    var val = src[prop];
    delete src[prop];
    Object.defineProperty(dst, prop, { enumerable: true,  configurable: true, get: createGetter(prop), set: createSetter(prop) });
    dst.synced[prop] = synced;
    dst.values[prop] = val;
  }
}
 
CouchDBResource.prototype = {
    save: function save_CouchDBResourceInstance(callback) {
      var that = this
      ;
      this.__db.save(this._id, this._rev, this, function(err,res) {
        if(err){
          callback(err);
        }else{
          setProperties(that, that);
          callback(null, res);
        }
      });
    }
  , update: function update_CouchDBResourceInstance(callback) {
      var modz = {}
        , that = this
        ;
      for(var k in this) {
        if(! this.synced[k]) {
          modz[k] = this[k];
        }
      }
      
      if(modz !== {}) {
        this.__db.update('rocket/in_place', this._id, modz, function(err){
          if(err){
            callback(err);
          }else{
            setProperties(that, that);
            callback.apply(that, Array.prototype.slice.apply(arguments));
          }
        });
      }else{
        callback(null, '');
      }      
    }
  , destroy: function destroy_CouchDBResourceInstance(callback) {
      this.__db.remove(this._id, function(err) { callback(err); });
    }
  , reload: function reload_CouchDBResourceInstance(callback) {
      var that = this;
      
      this.__db.get(this._id, function(err, doc) {
        if(err) {
          callback(err);
        }else{
        
          setProperties(that, doc);
          callback(null, that);
        }        
      });
      
    }
  , exists: function exists_CouchDBResourceInstance() {}
  };
 
/******************************************************************************
 * Resource Factory/Constructor Functions
 */
var factoryFunctions = {
    initialize: function initialize_CouchDBResource(model_name, callback) {
      var that = this;
      //Initialize connection object
      that.__connection = new cradle.Connection(
          that.connection.host
        , that.connection.port
        , that.connection.options
        );
        
      //Infer DB name from file name unless specified
      if(typeof that.db_name !== 'undefined' && that.db_name !== null){ 
        that.__db_name = that.db_name;
      }else{
        that.__db_name = lingo.en.pluralize(model_name).toLowerCase();
      }
      
      //setup db object
      that.__db = that.__connection.database(that.__db_name);
      that.prototype.__db  = that.__db;
      
      //Create db if it doesn't exists. Harmless otherwise.
      that.__db.create();
      
      async.parallel(
          [function(callback) {
              async.forEach(that.ddocs, syncDoc, callback);
            }
          , function(callback) {
              that.__db._save('_security', false, that._security, callback);
            }
          ]
        , callback);
        
      
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
      
        //create the `rocket` namespace in the design doc
        docObj[ROCKET_NAMESPACE] = {};
      
        //add the validators to the design doc
        docObj[ROCKET_NAMESPACE].validators = oo.__extends({}, that.validators);
        
        //add the schema to the deisng doc
        docObj[ROCKET_NAMESPACE].schema  = 'module.exports = ' + JSON.stringify(that.schema);
        
        //remove previous digest
        delete docObj.digest;
        
        //convert all functions to strings
        fctToString(docObj);
        
        //make all validators available through commonJS' `require`
        for(var f in docObj[ROCKET_NAMESPACE].validators) {
          docObj[ROCKET_NAMESPACE].validators[f] = 'module.exports = ' + docObj[ROCKET_NAMESPACE].validators[f];
        }
        
        //make all the oo functions available through commonJS' `require`
        docObj[ROCKET_NAMESPACE].oo = fs.readFileSync(path.join(__dirname, '../utils/oo.js'), 'utf8');
        
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
              console.log(('xxx [CouchDBResource] ERROR id: ' + docObj._id + ' ' + require('util').inspect(err)).red);
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
  , all: function all_CouchDBResource(callback) {
      this.__db.view('rocket/all', callback);
    }
  , view: function view_CouchDBResource() {
      this.__db.view.apply(this.__db, arguments);
    }
  };

oo.__extends(CouchDBResource, factoryFunctions, {overwrite: true});

/******************************************************************************
 * CouchDBResource's Constructor
 */
function CouchDBResource(obj) {
  setProperties(this, obj);
};

oo.inherits(CouchDBResource, BaseResource);

//Finally export the CouchDBResource Object
module.exports = CouchDBResource;
