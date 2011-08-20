var dnode               = require('dnode')
  , async               = require('async')
  , lingo               = require('lingo')
  ;

var asyncFs             = require('./util/async_fs')
  
  , config              = require('./config')
  
  , EXPORTS_NAME_REGEXP = config.EXPORTS_NAME_REGEXP
  ;

/******************************************************************************
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
function watchAndExport(exports_data, export_file, matches, callback) {
  
  var module_name = matches[1]
    , module_path = export_file.path
    , export_name = lingo.camelcase(module_name.replace(/_/g, ' '))
    ; 
  
  export_file.on('change', function() {
    
    if (require.cache[module_path]) {
      
      delete require.cache[module_path];
      
    }
    
    exports_data[module_name] = require(module_path);
    
  });
  
  export_file.on('destroy', function() {
   
    delete exports_data[module_name];
    export_file.unwatch();
    
  });
  
  if (require.cache[module_path]) {
    
    delete require.cache[module_path];
    
  }
  
  exports_data[module_name] = require(module_path);
  
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
    
    , app                 = args.shift()
    , exports_folder_file = args.shift()
    
    , callback            = args.pop()
    
    , express_listen      = app.listen
    , exports_data        = {}
    ;
  
  app.listen = function listen_export() {
  
    var ret = express_listen.apply(this, arguments)
      ;
    
    dnode(function Exporter(remote, conn) {
      
      var value
        ;
      
      for (var key in exports_data) {
        
        value = exports_data[key];
        
        switch (typeof value) {
          
          case 'function':
            
            this[key] = new value(remote, conn);
            break;
            
          default:
            
            this[key] = value;
          
        }
        
      }
      
    }).listen(app);
    
    return ret;
  }
  
  asyncFs.mapDir(
      
      exports_folder_file.path
    
    , [ EXPORTS_NAME_REGEXP, async.apply(watchAndExport, exports_data) ]
      
    , callback
  
  );
  
}