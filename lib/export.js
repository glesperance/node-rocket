var dnode               = require('dnode')
  , async               = require('async')
  , lingo               = require('lingo')
  ;

var asyncFs             = require('./util/asyncFs')
  
  , config              = require('./config')
  
  , EXPORTS_NAME_REGEXP = config.EXPORTS_NAME_REGEXP
  ;

/******************************************************************************
 * BaseExporter constructor. 
 * 
 * @param exports_data {Object} The data structure containing the items to be
 * exported.
 * 
 * @param remote {Object} Will be filled with the other side's methods once the 
 * initial protocol phase finishes. (As passed by dnode to its wrapper)
 * 
 * @param conn {Object} The connection object as passed by dnode to its wrapper.
 */
function BaseExporter(exports_data, remote, conn) {
  
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
  
}

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
    exports_file.unwatch();
    
  });
  
  if (require.cache[module_path]) {
    
    delete require.cache[module_path];
    
  }
  
  exports_file[module_name] = require(module.path);
  
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
exports.setup = function(app, exports_folder_file, callback) {
  
  var express_listen  = app.listen
    , exports_data    = {}
    , Exporter        = async.apply(BaseExporter, exports_data)
    , dnode           = dnode(Exporter)
    ;
  
  app.listen = function listen_export() {
  
    var ret = express_listen.apply(app, arguments)
    
    dnode.listen(app);
    
    return ret;
  }
  
  asyncFs.mapDir(
      
      exports_folder_file.path
    
    , [ EXPORTS_NAME_REGEXP, async.apply(watchAndExport, exports_data) ]
      
    , callback
  
  );
  
}