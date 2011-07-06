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
            ;
          oo.__extends(doc, req.query, { overwrite: true });
          
          return [doc, JSON.stringify(doc)];
        }
      }
    , validate_doc_update: function(newDoc, oldDoc, userCtx) {
        
        if(newDoc._deleted
        || typeof newDoc.doc_type === 'undefined'
        || newDoc.doc_type === null
        || newDoc.doc_type === ''
        ){
          return;
        }
        
        var schema = require('rocket/schema/' + newDoc.doc_type);
                
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
                validator(member, newDoc[member]);
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
 * Utils functions
 */
function setProperties(dst, src, synced) {
  
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

function updateCache(obj, newValues) {
  obj.__db.cache.store[obj._id].document = newValues;
  obj.__db.cache.store[obj._id].attime = Date.now();
}

function timestamp(obj) {

  var current_time = new Date.now();

  if(typeof obj.creation_date === 'undefined'
  || obj.creation_date === null
  ){
    obj.creation_date = current_time;
  }
  
  obj.modification_date = current_time;
}

function set_doc_type(obj, doc_type) {
  if(typeof obj.doc_type === 'undefined'
  || obj.doc_type === null
  || obj.doc_type === ''
  || !obj.propertyIsEnumerable('doc_type')
  || obj.doc_type !== doc_type
  ){
    obj.doc_type = doc_type;
  }
}

function oo_cb_wrapper(cons, cb)Ê{
  return function(err, res) {
    
    var objects = [];
        
    if(err)Ê{ cb(err); return; }
    
    if(res) {
      if(Array.isArray(res)){
        cons = (Array.isArray(cons) ? cons : [cons]);
        
        for(var i = 0, ii = res.length; i < ii; i++) {
          objects.push(new cons[i % cons.length](res[i]));
        }
        cb(err, objects);
      }else{
        //single object...
        cb(err, new cons(res));
      }      
    }else{
      cb(err, res); return;
    }
    
  };
}

/******************************************************************************
 * Resource Prototype Functions (used to create models)
 */
CouchDBResource.prototype = {
    save: function save_CouchDBResourceInstance(callback) {
      var that = this
      ;
      
      timestamp(this);
      set_doc_type(this, this.doc_type);
      
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
        
      timestamp(this);
      set_doc_type(this, this.doc_type);
        
      for(var k in this) {
        if(this.propertyIsEnumerable(k) === false) {
          continue;
        }
        
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
            updateCache(that, that.values);
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
      var that = this
        , doc_type = namespace.extractName(model_name.toLowerCase(), { suffix: '_document' })
        ;
        
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
        that.__db_name = lingo.en.pluralize(doc_type);
      }
      
      //setup db object
      that.__db = that.__connection.database(that.__db_name);
      that.prototype.__db  = that.__db;
      
      that.prototype.doc_type  = doc_type;
      
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
        
        //add the schema to the design doc
        docObj[ROCKET_NAMESPACE].schema = {};
        docObj[ROCKET_NAMESPACE].schema[doc_type] = 'module.exports = ' + JSON.stringify(that.schema);
        
        //convert all functions to strings
        fctToString(docObj);
        
        //make all validators available through commonJS' `require`
        for(var f in docObj[ROCKET_NAMESPACE].validators) {
          docObj[ROCKET_NAMESPACE].validators[f] = 'module.exports = ' + docObj[ROCKET_NAMESPACE].validators[f];
        }
        
        //make all the oo functions available through commonJS' `require`
        docObj[ROCKET_NAMESPACE].oo = fs.readFileSync(path.join(__dirname, '../utils/oo.js'), 'utf8');
        
        that.get(docObj._id, checkAndUpdate);
        
        function checkAndUpdate(err, doc) {
        
          doc = doc || {};
          
          var oldDocJSON = JSON.stringify(doc);
          
          //extend the DB doc with the current doc
          oo.__deepExtends(doc, docObj, {overwrite: true});
        
          //docObj to a JSON string
          var docJSON = JSON.stringify(doc);
          
          if(err) {
            if(err.error === 'not_found'){
              that.__db.save(doc._id, doc, callback);
            }else{
              console.log(('xxx [CouchDBResource] ERROR id: ' + doc._id + ' ' + require('util').inspect(err)).red);
              callback(err);
            }
          }else{
          
            if(oldDocJSON !== docJSON) {
              that.__db.save(doc._id, doc._rev, doc, callback);
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
      
      timestamp(properties);
      set_doc_type(properties, this.prototype.doc_type);
      
      this.__db.save(_id, properties, callback);
    }
  , save: function save_CouchDBResource(obj, callback) {
      timestamp(obj);
      set_doc_type(obj, this.prototype.doc_type);
      this.__db.save(obj._id, obj._rev, obj, callback);
    }
  , get: function get_CouchDBResource(_id, callback) {
      this.__db.get(_id, oo_cb_wrapper(this.prototype.constructor, callback));
    }
  , update: function update_CouchDBResource(_id, properties, callback) {
      timestamp(properties);
      set_doc_type(properties, this.prototype.doc_type);
      this.__db.merge(_id, properties, callback);
    }
  , destroy: function destroy_CouchDBResource(_id, callback) {
      this.__db.remove(_id, callback);
    }
  , all: function all_CouchDBResource(args) {
      var args_array = Array.prototype.slice.call(args)
        ;
        
      args_array.unshift('rocket/all');
      
      this.view(args_array);
    }
  , view: function view_CouchDBResource() {
      var args_array    = Array.prototype.slice.call(arguments)
        , view          = args_array.shift()
        , params        = (  
                             typeof args_array[0] === 'object' 
                          && args_array[0] 
                          && ! Array.isArray(args_array[0])
                          ? args_array.shift() 
                          : {}
                          )
        , constructors  = (  
                             typeof args_array[0] === 'object' 
                          && args_array[0] 
                          && Array.isArray(args_array[0])
                          ? args_array.shift() 
                          : this.prototype.constructor
                          )
        , callback      = args_array.shift()
        ;
        
      //add doc_type argument to filter out other docs
      params.doc_type = this.prototype.doc_type;
      
      //call with our callback to objectify the result
      this.__db.view.apply(this.__db, params, oo_cb_wrapper(this.prototype.constructor, callback));
    }
  };

oo.__extends(CouchDBResource, factoryFunctions, {overwrite: true});

/******************************************************************************
 * CouchDBResource's Constructor
 */
function CouchDBResource(obj) {
  arguments.callee.__super__.call(this, obj);
  setProperties(this, this);
};

oo.inherits(CouchDBResource, BaseResource);

//Finally export the CouchDBResource Object
module.exports = CouchDBResource;
