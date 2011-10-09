/******************************************************************************
 * Module dependencies
 */
var express             = require('express')
  , __                  = require('express-resource')
  , async               = require('async')
  , path                = require('path')
  , _                   = require('underscore')
  , lingo               = require('lingo')
  ;

//project related dependencies
var asyncFs             = require('./util/async_fs')
  , dadt                = require('./util/dadt')
  , config              = require('./config')
  
  , CONTROLLER_NAME_REGEXP   = config.CONTROLLER_NAME_REGEXP
  ;

/******************************************************************************
 * Rocket template name space
 */
var rocket_tmpl         = {};

    rocket_tmpl.header  = function() {
      
      var args            = Array.prototype.slice.call(arguments)
        , controller_name = args.shift().replace(/[.,-;\s]+/g, '_')
        ;
      
      return [
               "<script src='//cdnjs.cloudflare.com/ajax/libs/modernizr/2.0.6/modernizr.min.js'><\/script>"
             , "<script> window.Modernizr || document.write('<script src=\"/js/rocket/vendors/modernizr-2.0.6.min.js\"><\\/script>')</script>"
             , (global.require_configuration ? "<script> var require = " + global.require_configuration + "</script>": "")
             //, (controller_name ? "<script> require.ready = function() { require(['" + controller_name + "' + '_client' ], function(m) { m.init.apply(m" + (args.length > 0 ? ", " + JSON.stringify(args) : '') + ");} ); }</script>": "")
             ].join('\n');
    };

    rocket_tmpl.footer  = function() {
      
      var args            = Array.prototype.slice.call(arguments)
        , controller_name = args.shift().replace(/[.,-;\s]+/g, '_')
        ;
      
      return [
                "<script>"
              , "  Modernizr.load(["
              , "      {"
              , "          load      : '/js/rocket/vendors/require-0.27.1.min.js'"
              , "        , callback  : function() {"
              , "             window.require || document.write('<script src=\"/js/rocket/vendors/require-0.27.1.min.js\"><\\/script>')"
              , ( typeof controller_name !== 'undefined' ? "             require(['" + controller_name + "' + '_client' ], function(m) { m.init.apply(m" + (args.length > 0 ? ", " + JSON.stringify(args) : '') + ");} ); ": "")
              , "          }"
              , "      }"
              , "  ]);"
              , "</script>"
              
              ].join('\n')
     };

/******************************************************************************
 * Destroy all the routes associated with a given controller
 * 
 * @param app {Object} The `app` object as returned by express, connect, or
 * rocket.
 * 
 * @param routes_dadt {Object} The root of routes' dadt data structure.
 * 
 * @param controller_name {String} The name of the controller
 */
function destroyControllerRoutes(app, routes_dadt, controller_name) {
  
  var routes = routes_dadt.get(controller_name).get('routes')
    ;
  
  if (routes) {
  
    for (var route in routes.values) {
        
      app.remove(route);
      
    }
  
  }
  
  delete app.resources[controller_info.name];
  controller_info.set('routes', dadt.createNode());
  
}

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
    
    var view_file   = controller_info.get('view')
    
      , layout_node = controller_info.parent.get('layout')
      , layout      = (typeof layout_node !== 'undefined' ? layout_node.get('view') : true)
      
      , oSend       = res.send
      , oRender     = res.render
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
        
        obj.layout = layout
        
        obj.controller = obj.controller || controller_info.parent.get('name');
        
        obj.rocket = obj.rocket || rocket_tmpl;
        
        res.send = oSend;
        
        res.render(view_file, obj);
        
      };
      
    } 
    
    method_func(req, res, next);
  
  };

}

/******************************************************************************
 * Builds and set up the routes of the given controller. Removing the previous
 * routes if necessary.
 * 
 * @param app {Object} The app object as returned by express, connect, or
 * rocket.
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
    , name = controller_info.get('name')
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
      
      var verbs       = _.functions(controller[key])
        , route       = (name === 'root' ? path.join('/', key) : path.join('/', name,  key))
        , param       = ':' + lingo.en.singularize(name)
        , route_param = path.join(route, param)
        ;
      
      innerNode.set('name', [name, key].join('.'));
      
      for (var i = 0, ii = verbs.length; i < ii; i++) {
        
        
        var current_verb  = verbs[i]
          , method        = controller[key][current_verb]
          ;
        
        if (['get', 'post', 'put', 'del'].indexOf(current_verb) !== -1) {
          
          innerNode.setIfNone(current_verb, dadt.createNode());
          
          var wrapped           = undefined
            , current_verb_node = innerNode.get(current_verb)
            ;
          
          wrapped = buildWrapper(current_verb_node, method);

          current_verb_node.set('handler', wrapped);
          
          app[current_verb](route, wrapped);
          app[current_verb](route_param, wrapped);

          controller_info.get('routes').setIfNone(route, true);
          controller_info.get('routes').setIfNone(route_param, true);
          
        }
      
      }
      
    } else if(typeof controller[key] === 'function') {
      
      var wrapped     = undefined
        , key_node    = controller_info.get(key)
        , route       = (name === 'root' ? path.join('/', key) : path.join('/', name,  key))
        , param       = ':' + lingo.en.singularize(name)
        , route_param = path.join(route, param)
        ;
      
      wrapped = buildWrapper(innerNode, controller[key]);
      
      innerNode.set('handler', wrapped);
      
      //if the function is a custom controller method ...
      if (['index', 'show', 'new', 'create', 'edit', 'update', 'destroy'].indexOf(key) === -1) {
        
        app.all(route, wrapped);
        app.all(route_param, wrapped);
        
        controller_info.get('routes').setIfNone(route, true);
        controller_info.get('routes').setIfNone(route_param, true);
        
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
    
    resource = app.resource(name, wrapped_funcs);
  
  }

  if(typeof load !== 'undefined') {
    
    resource.load(load);
  
  }
  

  for (var verb in resource.routes) {
    
    for (var url in resource.routes[verb]) {
      
      controller_info.get('routes').setIfNone(url, true);
      
    }
    
  }
  
}

/******************************************************************************
 * Function called either when a new controller file is found or when a change
 * is detected. It takes care of clearing the `require` cache and creating the
 * controllers dadt node.
 * 
 * 
 * @param app {Object} The app object as returned by express, connect, or
 *                         rocket.
 * 
 * @param controller_info {Object} The dadt node containing the controller info.
 * 
 * @param controller_path {Object} The path of the current
 *                                 controller file.
 *                                 
 * @param callback {Function} A callback of the form `function(err)`.
 * 
 */
function loadController() {
  
  var args            = Array.prototype.slice.call(arguments) 
    
    , app             = args.shift()
    
    , controller_info = args.shift()
    
    , controller_path = args.shift()
    
    , callback        = args.pop()
    
    , controller
    ;
 
    
  controller = require(controller_path);
  
  buildRoutes(app, controller_info, controller);
  
  if (callback) {
      callback(null);
  }
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
    
    , reload
    ;
  

  routes_dadt.setIfNone(controller_name, dadt.createNode());
  
  controller_info = routes_dadt.get(controller_name);
  
  controller_info.set('routes', dadt.createNode());
  
  controller_name = lingo.camelcase(controller_name.replace(/_/g, ' '));
  
  controller_info.set('name', controller_name);
  
  reload = async.apply(
    loadController
    , app
    , controller_info
    , controller_path
  )
  
  controller_file.on('change', function(curr, prev) {
  
    if (curr.nlink > 0) {
      
      if (require.cache[controller_path]) {

        delete require.cache[controller_path];
      
      }
      
      destroyControllerRoutes(app, routes_dadt, controller_name);

      reload();
      
    }
    
  });
  
  controller_file.on('destroy', function() {
    
    controller_file.unwatch();
    destroyControllerRoutes(app, routes_dadt, controller_name)
  
  });
  
  reload(callback);
  
}

/******************************************************************************
 * Setups the controllers, also watches the `controllers` directory for new
 * files and calls `setupController` accordingly.
 * 
 * @param app {Object} The app object as returned by express, connect, or
 * rocket.
 * 
 * @param routes_dadt {Object} The root of routes' dadt data structure.
 * 
 * @param controllers {Object} The FileEventEmitter object of the `controllers`
 * folder.
 *                        
 * @param callback {Function} A callback of the form `function(err)`
 */
exports.setup = function setup_controller() {
  
  var args        = Array.prototype.slice.call(arguments)
    
    , app         = args.shift()
    , routes_dadt = args.shift()
    
    , controllers = args.shift()
    
    , callback    = args.pop()
    ;

  app.rocket_routes = routes_dadt;
  
  app.use(express.methodOverride());
  
  asyncFs.mapDir(
   
      controllers.path
   
    , [ CONTROLLER_NAME_REGEXP , async.apply(setupController, app, routes_dadt) ]
     
    , callback
     
  );
  
}