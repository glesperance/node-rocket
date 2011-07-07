var fs        = require("fs")
  , _         = require("underscore")
  , express   = require("express")
  , Resource  = require("express-resource")
  , dnode     = require("dnode")
  , colors    = require('colors')
  , path      = require('path')
  , lingo     = require('lingo')
  , async     = require('async')
  ;
  
var extractName = require('./libs/utils/namespace').extractName
  , checkName = require('./libs/utils/namespace').checkName
  , oo = require('./libs/utils/oo')
  , views_filters = require('./libs/views/filters')
  ;

/******************************************************************************
 * CONSTANTS
 */

  /* general dirs */
var MODELS_DIR_NAME        = 'models'
  , VIEWS_DIR_NAME         = 'views'
  , CONTROLLERS_DIR_NAME   = 'controllers'
  , PLUGINS_DIR_NAME       = 'plugins'
  , EXPORT_DIR_NAME        = 'exports'
  , CLIENT_DIR_NAME        = 'client'
  , DATASOURCES_DIR_NAME   = 'datasources'
  
  /* client specific dirs */
  , CLIENT_LIBS_DIR             = path.join(CLIENT_DIR_NAME, 'js')
  , CLIENT_STATIC_DIR           = path.join(CLIENT_DIR_NAME, 'static')
  , CLIENT_LIBS_INDEX_FILENAME  = '_rocket_libs_index.js'
  
  /* namespace constants */
  , CONTROLLER_SUFFIX = '_controller'
  
  /* RESTful methods names */
  , RESTFUL_METHODS = [
        'index'
      , 'show'
      , 'new'
      , 'create'
      , 'edit'
      , 'update'
      , 'destroy'
      ]
      ;
  ;
  
/******************************************************************************
 * GLOBALS
 */
 
var missing = [];

/******************************************************************************
 * Controllers Setup
 */
function setupControllers(app) {
  /**
   * @param name String = name of the Controller
   * @param method String = name of the Method
   * @param has_view Bool = true if this Controller's Method has that view
   *
   * Builds a wrapper function sending raw json as a response if no view is found
   * or a rendered view
   */
  
  var top_dir = app.rocket.app_dir;
   
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
   * @param name String = name of the Controller
   * @param has_view Bool = true if the controller has a matching view
   *
   * Uses information from searchFolders to add the controller URL
   * to the app, introduces a wrapping function around these controller
   * calls.
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
    
/******************************************************************************
 * Models Setup
 */  
function setupModels(app) {
  var models_files = fs.readdirSync(path.join(app.rocket.app_dir, MODELS_DIR_NAME))
    ;
  
  async.forEachSeries(
    models_files
  , function(current_file, callback){
      if(current_file === DATASOURCES_DIR_NAME || current_file === 'empty') {
        callback(null); return;
      }
      var model_name = extractName(current_file, {extension: true})
        , myModel = require(path.join(app.rocket.app_dir, MODELS_DIR_NAME, current_file))
        ;
      if(!lingo.en.isSingular(model_name)) {
        callback('xxx ERROR model filename must be singular [' + model_name + ']').red
      }
    
      myModel.initialize.call(myModel, model_name, callback);
    }
  , function(err) { if(err){ console.log(err); throw err; } }
  );

}

/******************************************************************************
 * Compile exports
 */ 
function compileExports(app) {
  var dirs
    , plugins
    , exported_dirs = {'': path.join(app.rocket.app_dir, EXPORT_DIR_NAME)}
    , myExports = {};
  
  // Add plugin exports to EXPORT_DIRS
  if(missing.indexOf(PLUGINS_DIR_NAME) === -1){
    try{
      plugins = fs.readdirSync(path.join(app.rocket.app_dir, PLUGINS_DIR_NAME));
      for(var i = 0; i < plugins.length; i++) {
        exported_dirs[plugins[i]] = path.join(app.rocket.app_dir, PLUGINS_DIR_NAME, plugins[i], EXPORT_DIR_NAME);
      }
    }catch(err){
      if(err.code == 'ENOENT') {
            console.log('!!! WARNING No `plugins` dir found in project. Skipping plugin exports...'.yellow);
            missing.push(PLUGINS_DIR_NAME);
      }else{
        throw err;
      }
    }
  }
  
  for(var export_name in exported_dirs) {
    var container;
    if(export_name === 'empty') {
      continue;
    }else if(export_name === '') {
      container = myExports;
    }else{
      myExports[export_name] = {};
      container = myExports[export_name];
    }
    
    try{
      dirs = fs.readdirSync(exported_dirs[export_name]); 
    
      for (var j = 0; j < dirs.length; j++) {
        var objName = dirs[j].split(".")[0]
          , obj = require(path.join(exported_dirs[export_name], dirs[j]));
    
          container[objName] = obj;
      }      
    }catch(err){
      if(err.code === 'ENOENT') {
        console.log('!!! WARNING No `exports` dir found in project. Skipping exports...'.yellow);
        missing.push(EXPORT_DIR_NAME);
      }else{
        throw err;
      }
    }
  }
  
  if(myExports !== {}) {
    app.rocket.dnode = dnode(myExports);
  }
  
}

/******************************************************************************
 * LIBS INDEX BUILDER
 */

function build_libs_index(app_dir) {
  var libs_dir_path   = path.join(app_dir, CLIENT_LIBS_DIR)
    , libs_index_file = path.join(libs_dir_path, CLIENT_LIBS_INDEX_FILENAME)
    , libs_index
    , modified = false
    , buf = []
    ;
  
  try {
    libs_index = require(libs_index_file);
  } catch(err) {
      libs_index = [];
  }
  
  function walkAST(dir, root) {
    var client_files = fs.readdirSync(dir);
    
    for(var i = 0, ii = client_files.length; i < ii; i++) {
      var filename = client_files[i]
        , stat = fs.statSync(path.join(dir, filename))
        ;
        if(filename.slice(0,1) === '.' || filename.slice(0,1) === '_') {
          continue;
        }else if(stat.isDirectory()){
          arguments.callee.call(this, path.join(libs_dir_path, root, filename), filename);
        }else{
          var include_path = ['./', path.join(root,filename)].join('');
          
          if(libs_index.indexOf(include_path) === -1) {
            modified = true;
            libs_index.push(include_path);
          }
        }        
    }
  }
  
  walkAST(libs_dir_path);
  
  if(modified) {
  
    buf.push(
      [ 'module.exports'
      , '='
      , '(function() {'
      ].join(' ')
    );
    
    var nest = '  ';
    
    buf.push([nest, 'if(false) {'].join(''));
    nest = '    ';
    
    for(var i = 0, ii = libs_index.length; i < ii; i++) {
      buf.push(
        [ nest
        , 'require(\''
        , libs_index[i]
        , '\');'
        ].join('')
      );
    }
    
    nest = '  ';
    
    buf.push([nest, '}'].join(''));
    
    buf.push(
      [ nest
      , [ 'return'
        , JSON.stringify(libs_index) + ';'
        ].join(' ')
      ].join('')
    );
    
    buf.push('})();');
    
    fs.writeFileSync(libs_index_file, buf.join('\n'));
  }
}

/******************************************************************************
 * MAIN
 */
var package_JSON = fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'); 
var package_info = JSON.parse(package_JSON);

var rocket = {
    version: package_info.version
  , resources: require('./libs/resources')
  , utils: require('./libs/utils')
  , createServer: function createServer_rocket() {
      var args = Array.prototype.slice.call(arguments)
        , app_dir =  args.shift()
        , app = express.createServer()
        , middlewares = Array.prototype.slice.call(arguments,1)
        ;
      
      app.rocket = {};
      app.rocket.routes = [];
      app.rocket.controllers = {};
      
      app.rocket.app_dir = app_dir;
      
      //replace listen on app
      var express_listen = app.listen;      
      app.listen = function () {
      
        var ret = express_listen.apply(this, arguments);
        
        if(missing.indexOf(EXPORT_DIR_NAME) === -1 ) {
          app.rocket.dnode.listen(app);
        }
                
        return ret;
      }
      
      //extend the jade engine with our filters
      var jade = require('jade');
      
      app.browserify = require('browserify')({
        mount : '/browserify.js'
      , require: path.join(app.rocket.app_dir, CLIENT_LIBS_DIR, CLIENT_LIBS_INDEX_FILENAME)
      , watch: true
      });

      //build _rocket_index for browserify
      build_libs_index(app.rocket.app_dir);
      
      //default configuration
      app.configure(function() {
        app.set("view engine", 'jade');
        app.set("views", path.join(app.rocket.app_dir, VIEWS_DIR_NAME));
        app.register(".jade", jade);
        
        app.use('/static', express.static(path.join(app.rocket.app_dir, CLIENT_STATIC_DIR)));
        
        app.use(express.methodOverride());
        app.use(express.bodyParser());
        app.use(express.cookieParser());

        app.use(app.browserify);

       for(var i = 0, len = middlewares.length; i < len; i++) {
          app.use(middlewares[i]);
        }
        
      });
      
      //setup controllers
      setupControllers(app);
      
      //setup models
      setupModels(app);
      
      //compile exports
      compileExports(app);
      
      return app;
      
    }
};

oo.__extends(rocket, express);
module.exports = rocket;
