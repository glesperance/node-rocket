var nowjs               = require('now')
  , async               = require('async')
  , lingo               = require('lingo')
  ;

var asyncFs             = require('./util/async_fs')
  
  , config              = require('./config')
  
  , EXPORTS_NAME_REGEXP = config.EXPORTS_NAME_REGEXP
  ;

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
  
  exports_data[export_name] = require(module_path);
  
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
    , everyone            = nowjs.initialize(app);
    ;  
  
  asyncFs.mapDir(
      
      exports_folder_file.path
    
    , [ EXPORTS_NAME_REGEXP, async.apply(watchAndExport, everyone.now) ]
      
    , callback
  
  );
  
}