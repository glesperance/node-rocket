/******************************************************************************
 * Module dependencies
 */
var async               = require('async')
  , path                = require('path')
  , _                   = require('underscore')
  ;

//project related dependencies
var 
    asyncFs             = require('./util/async_fs')
  , config              = require('./config')

  , CONTROLLER_REGEXP   = config.CONTROLLER_NAME_REGEXP
  ;

/******************************************************************************
 * Builds a wrapper function sending raw json as a response if no view is found
 * or a rendered view
 * 
 * @param controller_info {dadtNode} The dadtNode containing the controller 
 *                                   info.
 *                                   
 * @param method_func {Function} The method function.
 */
function buildWrapper(controller_info, method_func) {
  
  return function(req, res, next) {
    
    var view_file = controller_info.get('view')
      , oSend     = res.send
      , oRender   = res.render
      ;
    
    //check if we have a view & if that we do not have an XHR-Request.
    //If the view is missing or if we have an XHR-Request, skip view rendering.
    if (!req.xhr && view_file) {
       
      //restore the original `res.send` function when `res.render` is called.
      res.render = function() {
      
        res.send = oSend;
        oRender.apply(this, arguments);
      
      };
      
      //replace the original send function to be able to automatically render
      //the wanted view.
      res.send = function(obj) {
        
        obj = obj || {};
        
        obj.controller = obj.controller || controller_info.get('parent').get('name');
        
        res.send = oSend;
        
        res.render(view_file), obj);
        
      };
      
    } 
    
    method_func(req, res, next);
  
  };

}

/**
 * Builds and set up the routes of the given controller. Removing the previous
 * routes if necessary.
 * 
 * @param app {Object} The app object as returned by express, connect, or
 *                     rocket.
 *  
 * @param controller_info {Object} The dadt node containing the controller info.
 * 
 * @param controller {Object} The controller object to route.
 */
function buildRoutes(app, controller_info, controller) {
  
  var wrapped_funcs = {}
    , split         = []
    
    , resource
    , load
    , innerNode = controller_info.get(key)
    ;
  
  for (var key in controller) {
      
    if (key.substr(0,1) === '_') {
    
      if (key === '_load' && typeof controller[key] === 'function') {
        
        //if the method name is `_load`  and it is a function ... save it.
        
        loader = controller[key];
      
      }
        
      //ignore keys beginning with a `_` unless it is `_load`
      continue;
      
    }
    
    controller_info.setIfNone(key, dadt.createNode());
    innerNode = controller_info.get(key);
    
    if (typeof controller[key] === 'object' && controller[key] !== null) {
      
      var verbs     = _.functions(controller[key])
        , route     = (name === 'root' ? path.join('/', key) : path.join('/', name,  key))
        , param     = ':id'
        ;
      
      for (var current_verb in methods) {
        
        var method = controller[key][current_verb]
          ;
          
        if (current_verb in ['get', 'post', 'put', 'del']) {
          
          innerNode.setIfNone(current_verb, dadt.createNode());
          
          var wrapped           = undefined
            , current_verb_node = innerNode.get(current_verb)
            ;
          
          wrapped = buildWrapper(current_verb_node, method);

          current_verb_node.set('controller', wrapped);
          
          app.remove(route, current_verb);
          app.remove(route_param, current_verb);
          
          app[current_verb](route, wrapped);
          app[current_verb](path.join(route, param), wrapped);
        
        }
      
      }
      
    } else if(typeof controller[key] === 'function') {
      
      var wrapped   = undefined
        , key_node  = controller_info.get(key)
        , route       = (name === 'root' ? path.join('/', key) : path.join('/', name,  key))
        , route_param = path.join(route, param)
        , param       = ':id'
        ;
      
      wrapped = buildWrapper(innerNode, controller_key);
      
      innerNode.set('controller', wrapped);
      
      //if the function is a custom controller method ...
      if (! key in ['index', 'show', 'new', 'create', 'edit', 'update', 'destroy']) {
               
        app.remove(route);
        app.remove(route_param);
        
        app.all(route, wrapped);
        app.all(, wrapped);
      
      } else {
        
        app.remove(route);
        app.remove(route_param);
        
        wrapped_funcs[key] = wrapped;
      
      }
      
    }
    
  }
  

  if(name === 'root') {
    
    resource = app.resource(wrapped_funcs);
  
  } else {
    
    name = lingo.camelcase(name.replace(/_/g, ' '));
    
    resource = app.resource(name, wrapped_funcs);
  
  }

  if(typeof load !== 'undefined') {
    
    for (var verb in app.resources[name].routes) {
      
      for(var url in app.resources[name].routes[verb]) {
        
        app.remove(url, verb);
        
      }
      
    }
    
    resource.load(load);
  
  }
  
}

/******************************************************************************
 * Function called either when a new controller file is found or when a change
 * is detected. It takes care of clearing the `require` cache and creating the
 * controllers dadt node.
 * 
 * 
 * @param app app {Object} The app object as returned by express, connect, or
 *                         rocket.
 * 
 * @param routes_dadt {Object} The root dadtNode of this app's routes.
 * 
 * @param controller_name {String} The name of the current controller.
 * 
 * @param controller_file {Object} The FileEventEmitter of the current
 *                                 controller file.
 *                                 
 * @param callback {Function} A callback of the form `function(err)`.
 * 
 */
function loadController(app, routes_dadt, controller_name, controller_file) {
  
  var args            = Array.prototype.slice.call(arguments) 
    
    , callback        = args.pop()
    
    , controller_info = routes_dadt.get(controller_name)
    , controller_path = controller_file.path
    
    , controller
    ;
  
  if (require.cache[controller_path]) {
    
    delete require.cache[controller_path];
  
  }
  
  controller = require(controller_path);
  
  if (!controller_info) {
    
    routes_dadt.setifNone(controller_name, dadt.createNode());
    controller_info = routes_dadt.get(controller_name);
    
    controller_info.set('name', controller_name);
  
  }
  
  buildRoutes(app, controller_info, controller);
  
  callback(null);

}

/******************************************************************************
 * Sets up the listeners on the `controllers` directory and calls
 * `loadController`. 
 * 
 * This function is also called each time a new controller file is found.
 * 
 * 
 * @param app {Object} The app object as returned by express, connect, or
 * rocket.
 * 
 * @param routes_dadt {Object} The root of routes' dadt data structure.
 * 
 * @param controller_file {Object} The FileEventEmitter object of the current
 * controller file.
 *                                 
 * @param matches {Array} Array of the matched patterns of the RegExp selecting
 * this controller file. 
 *                        
 * 
 * @param callback {Function} A callback of the form `function(err)`
 * 
 */
function setupController(app, routes_dadt, controller_file, matches, callback) {
  
  var controller_name = matches[1]
    
    , controller_path = controller_file.path
    
    , reload          = async.apply(
                            loadController
                          , app
                          , routes_dadt
                          , controller_name
                          , controller_file
                        )
    ;
  
  controller_file.on('change', function() {
  
    reload(); 
  
  });
  
  reload(callback);
  
});

/******************************************************************************
 * Setups the controllers, also watches the `controllers` directory for new
 * files and calls `setupController` accordingly.
 * 
 * 
 * @param app {Object} The app object as returned by express, connect, or
 *                     rocket.
 * 
 * @param routes_dadt {Object} The root of routes' dadt data structure.
 * 
 * @param controllers {Object} The FileEventEmitter object of the `controllers`
 *                             folder.
 *                        
 * @param callback {Function} A callback of the form `function(err)`
 */
exports.setup = function() {
  
  var args        = Array.prototype.slice.call(arguments)
    
    , app         = args.shift()
    , routes_dadt = args.shift()
    
    , controllers = args.shift()
    
    , callback    = args.pop()
    ;
 
 asyncFs.mapDir(
 
     controllers.path
   
   , [ CONTROLLER_NAME_REGEXP , async.apply(setupController, app, routes_dadt) ]
     
   , callback
     
 );
  
}