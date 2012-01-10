var nowjs               = require('now')
  , async               = require('async')
  , lingo               = require('lingo')
  ;

var asyncFs             = require('./util/async_fs')
  
  , config              = require('./config')
  
  , EXPORTS_NAME_REGEXP = config.EXPORTS_NAME_REGEXP
  ;

/******************************************************************************
 * Returns a object identical to the passed module, with the exception that 
 * each exported function of the module are scoped so that their `this` element
 * is the one passed by the caller.
 * 
 * @param module {Object} The module to wrap.
 * @returns The wrapped module object.
 */
function wrapModule(everyone, module) {
  
  var xport  = {}
    , member
    ;
  
  for (var key in module) {
    
    member = module[key];
    
    //do not export any members which names begin with an underscore
    if ( key.substr(0,1) === '_' ) {
      continue;
    }
    
    if (typeof member === 'function') {
      
      xport[key] = (function(fun) {
        
        return function() {
          
          this.user.disconnected = function(callback) {
           
            var user = this
              ;
            
            everyone.on('disconnect', function() {
              
              if (this.user.clientId == user.clientId) {
                
                everyone.removeListener('disconnect', arguments.callee);
                
                callback.apply(this);
                
              }
              
            });
            
          }
          
          fun.apply(this, arguments);
          
        }
        
      })(member);
       
    } else {
      
      xport[key] = member;
      
    }
    
  }
  
  return xport;
  
}

/******************************************************************************
 * Watches the files in the exports directory for changes and, make them
 * accessible through now.js
 * 
 * @param exports_data {Object} The data structure containing the items to be
 * exported.
 * 
 * @param export_file {Object} The FileEventEmitter object of the current
 * export file.
 *                                 
 * @param matches {Array} Array of the matched patterns of the RegExp selecting
 * this export file. 
 * 
 * @param callback {Function} A callback of the form `function(err)`
 */
function watchAndExport(everyone, export_file, matches, callback) {
  
  var module_name   = matches[1]
    , module_path   = export_file.path
    , export_name   = lingo.camelcase(module_name.replace(/_/g, ' '))
    , exports_data  = everyone.now
    ; 
  
  export_file.on('change', function() {
    
    if (require.cache[module_path]) {
      
      delete require.cache[module_path];
      
    }
    
    exports_data[module_name] = wrapModule(everyone, require(module_path));
    
  });
  
  export_file.on('destroy', function() {
   
    delete exports_data[module_name];
    export_file.unwatch();
    
  });
  
  if (require.cache[module_path]) {
    
    delete require.cache[module_path];
    
  }

  exports_data[export_name] = wrapModule(everyone, require(module_path));

  if (callback) {
    
    callback(null);
    
  }
  
}

/******************************************************************************
 * Setups the dnode exports, also watches the `exports` directory for new
 * files or changes and calls `setupExport` accordingly.
 * 
 * @param app {Object} The app object as returned by express, connect, or
 * rocket.
 * 
 * @param exports_folder_file {Object} The FileEventEmitter object of the 
 * `exports` folder.
 *                        
 * @param callback {Function} A callback of the form `function(err)`
 */
exports.setup = function() {
  
  var args                = Array.prototype.slice.call(arguments)
  
    
    , callback            = args.pop()
  
    , app                 = args.shift()
    
    , options             = args.shift() || {}
  
    , exports_folder_file = args.shift()
  
  
    , express_listen      = app.listen
    , everyone            = nowjs.initialize(app,  options);
    ;  
  
  asyncFs.mapDir(
      
      exports_folder_file.path
    
    , [ EXPORTS_NAME_REGEXP, async.apply(watchAndExport, everyone) ]
      
    , callback
  
  );
  
}