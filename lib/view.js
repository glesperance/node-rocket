
var async                   = require('async')
  , lingo                   = require('lingo')
  , jade                    = require('jade')
  , path                    = require('path')
  ;

var dadt                    = require('./util/dadt')
  , asyncFs                 = require('./util/async_fs')
  , config                  = require('./config')
  , VIEW_FOLDER_NAME_REGEXP = config.MODULE_NAME_REGEXP
  , VIEW_FILE_REGEXP        = config.VIEW_FILE_REGEXP
  ;

/******************************************************************************
 * Listens on discovered / new view directory and iteratively maps them to
 * the dadt datastore
 * 
 * @param app {Object} The app object as returned by express, connect, or
 * rocket.
 * 
 * @param routes_dadt {Object} The root of routes' dadt data structure.
 * 
 * @param view_folder {Object} The FileEventEmitter object of the current
 * view folder.
 *                                 
 * @param matches {Array} Array of the matched patterns of the RegExp selecting
 * this controller folder. 
 * 
 * @param callback {Function} A callback of the form `function(err)`
 * 
 */
function setupView() {

  var args            = Array.prototype.slice.call(arguments)
    , app             = args.shift()
    , routes_dadt     = args.shift()
    , view_folder     = args.shift()
    , matches         = args.shift()
    , callback        = args.pop()
    
    , controller_name = matches
    
    , controller_node
    ;
  
  lingo.camelcase(controller_name.replace(/_/g, ' '));
  
  routes_dadt.setIfNone(controller_name, dadt.createNode());
  
  controller_node = routes_dadt.get(controller_name);
  
  asyncFs.mapDir(
  
      view_folder.path
    
    , [ VIEW_FILE_REGEXP , function(view_file, matches, callback) {
      
        var split           = matches['input'].split('.')
          , current_node
          ;
      
        current_node = controller_node;
        
        for (var i = 1, ii = split.length; i < ii - 1; i++) {
          
          current_node.setIfNone(split[i], dadt.createNode());
          current_node = current_node.get(split[i]);
          
        }
        
        current_node.set('view', view_file.path)
      
        view_file.on('destroy', function() {
          
          view_file.unwatch();
          current_node.set('view', undefined);
          
        });
        
        if (callback) {
         
          callback(null);
      
        }
        
      }]
    
    , callback
    
  )
  
  
}

/******************************************************************************
 * Setups the views, also watches the `views` directory for new
 * files and calls `setupView` accordingly.
 * 
 * @param app {Object} The app object as returned by express, connect, or
 * rocket.
 * 
 * @param routes_dadt {Object} The root of routes' dadt data structure.
 * 
 * @param views {Object} The FileEventEmitter object of the `views`
 * folder.
 *                        
 * @param callback {Function} A callback of the form `function(err)`
 */
exports.setup = function setup_view() {
  
  var args        = Array.prototype.slice.call(arguments)
    
    , app         = args.shift()
    , routes_dadt = args.shift()
    
    , views = args.shift()
    
    , callback    = args.pop()
    ;
 
 app.configure(function() {
   
   app.set("view engine", 'jade');
   app.set("views", views.path);
   app.register(".jade", jade);
   
 });
  
 asyncFs.mapDir(
 
     views.path
   
   , [ asyncFs.isDirTest , async.apply(setupView, app, routes_dadt) ]
     
   , callback
     
 );
  
}