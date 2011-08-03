/******************************************************************************
 * Controllers Setup
 */
function setupControllers(app) {
  
  var top_dir = app.rocket.app_dir;
  
  /**
   * Builds a wrapper function sending raw json as a response if no view is found
   * or a rendered view
   * 
   * @param name String = name of the Controller
   * @param method String = name of the Method
   * @param has_view Bool = true if this Controller's Method has that view
   */
  function buildWrapper(name, method_name, method, has_view, dir) {
    return function(req, res, next) {
            
      if(!req.xhr && has_view) {
        var oSend = res.send;
        var oRender = res.render;
        
        res.render = function() {
          res.send = oSend;
          oRender.apply(this, arguments);
        };
        
        res.send = function(obj) {
          obj = obj || {};
          
          res.send = oSend;
          
          res.render
           ( path.join
               ( dir
               , VIEWS_DIR_NAME
               , name
               ,  [name, method_name, 'jade'].join('.') 
               )
           , _.extend(obj, {controller: name}) 
           )
           ;
        };
      }    
      method(req, res, next);
    };
  }

  /**
   * Uses information from searchFolders to add the controller URL
   * to the app, introduces a wrapping function around these controller
   * calls.
   * 
   * @param name String = name of the Controller
   * @param has_view Bool = true if the controller has a matching view
   */
  function setController(name, has_view, dir) {
    var wrapped_funcs = {}
      , view_methods_files = []
      , view_methods = []
      , split = []
      , controller = require(path.join(dir, CONTROLLERS_DIR_NAME, name + CONTROLLER_SUFFIX))
      , controller_keys = _.keys(controller)
      , resource = undefined
      , load = undefined
      ;
    
    if (typeof app.rocket.controllers[name] !== 'undefined') {
      throw("Route already in use".red);
    }

    if (has_view) {
      // Get the methods for which views exist
      view_methods_files = fs.readdirSync(path.join(dir, VIEWS_DIR_NAME, name));
      

      for(var i = 0; i < view_methods_files.length; i++) {
        split = view_methods_files[i].split('.');
        if(split[0] === name) {
          view_methods.push(split.slice(1,split.length - 1).join('.'));
        }
      }
    }

    for(var i = 0, len = controller_keys.length; i < len; i++) {
      var key = controller_keys[i]
        , has_view = false
        ;
        
      //ignore keys beginning with a `_` unless it is `_load`
      if(key.substr(0,1) === '_') {
        
        //check if the method name is `_load`  and it is a fct ... save it.
        if(key === '_load' && typeof controller[key] === 'function') {
          loader = controller[key];
        }
        
        //skip to next key
        continue;
      }
      
      if(typeof controller[key] === 'object' && controller[key] !== null) {
        var methods = _.functions(controller[key])
          , route = (name === 'root' ? path.join('/', key) : path.join('/', name,  key))
          , param = ':id'
          , inner_wrap = {}
          ;
        
        for(var j = 0, len2 = methods.length; j < len2; j++) {
          var method_name  = methods[j]
            , method = controller[key][method_name]
            , has_view = false
            ;
            
          if(['get', 'post', 'put', 'del'].indexOf(method_name) !== -1) {
            
            var wrapped = undefined
                full_name = [key, method_name].join('.')
              ;
            
            if(view_methods.indexOf(full_name) !== -1) {
              has_view = true;
            }
                        
            wrapped = buildWrapper(name, full_name, method , has_view, dir);
           
            app[method_name](route, wrapped);
            app[method_name](path.join(route, param), wrapped);
          }
        }
        
      }else if(typeof controller[key] === 'function') {
        
        var wrapped = undefined;
        
        if(view_methods.indexOf(key) !== -1) {
          has_view = true;
        }
        
        wrapped = buildWrapper(name, key, controller[key], has_view, dir);
        
        //if the function is not a custom controller method ...
        if(['index', 'show', 'new', 'create', 'edit', 'update', 'destroy'].indexOf(key) === -1) {
          var route = (name === 'root' ? path.join('/', key) : path.join('/', name,  key))
            , param = ':id'
            ;
          
          app.all(route, wrapped);
          app.all(path.join(route, param), wrapped);
        }
        
        wrapped_funcs[key] = wrapped; 
      }
      
    }
    
  
    if(name === 'root') {
      resource = app.resource(wrapped_funcs);
    } else {
      name = lingo.camelcase(name.replace(/_/g, ' '));
      
      resource = app.resource(name, wrapped_funcs);
    }
  
    if(typeof loader !== 'undefined') {
      resource.load(loader);
    }
    
    app.rocket.controllers[name] = resource;
    app.rocket.controllers[name].actions = wrapped_funcs;
  }

  /**
   * Gets the name of each controller and searches through the view folder
   * to see whether it finds a corresponding view
   */
  function searchFolders(dir) {    
    var controllers = []
      , views = []
      , has_view = false
      , split = []
      ;
    
    if(dir.split('/').pop() === 'empty'){
      return;
    }
    
    try{
      controllers = fs.readdirSync(path.join(dir, CONTROLLERS_DIR_NAME));
    }catch(err){
      if(err.code === 'ENOENT') {
        console.log(('!!! WARNING No `' + CONTROLLERS_DIR_NAME + '` dir found in [' + dir + ']. Skipping exports...').yellow);
      }else{
        throw(err);
      }
    }
    
    try{
      views = fs.readdirSync(path.join(dir, VIEWS_DIR_NAME));
    }catch(err){
      if(err.code === 'ENOENT') {
        console.log(('!!! WARNING No `' + VIEWS_DIR_NAME + '` dir found in [' + dir + ']. Skipping exports...').yellow);
      }else{
        throw(err);
      }
    }

    for(var i = 0; i < views.length; i++) {
      views[i] = extractName(views[i]);
    }

    for(var i = 0; i < controllers.length; i++) {
      if(checkName(controllers[i])) {
        //Gets dir/name.controller.js and returns name
        var controller = extractName( controllers[i]
                                    , {extension: true , suffix: CONTROLLER_SUFFIX}
                                    );

        if(views.indexOf(controller) !== -1) { has_view = true; } else { has_view = false; }
  
        setController(controller, has_view, dir);
      }
    }
  }

  /**
   * This function starts the controller set up, setting the main controllers and
   * views then running through the plugin dirs
   */
  function init() {
  
    var plugins = {};
  
    try{
      plugins = fs.readdirSync(path.join(top_dir, PLUGINS_DIR_NAME));
    }catch(err){
        if(err.code === 'ENOENT') {
          console.log('!!! WARNING No `plugins` dir found in project. Skipping plugins...'.yellow);
          missing.push(PLUGINS_DIR_NAME);
        }else{
          throw(err);
        }
    }
    
    searchFolders(top_dir);

    for(var i = 0; i < plugins.length; i++) {
      searchFolders(path.join(top_dir, PLUGINS_DIR_NAME, plugins[i]));
    }

  }

  init();
  
}