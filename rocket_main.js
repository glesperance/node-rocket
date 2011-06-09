var fs        = require("fs")
  , _         = require("underscore")
  , express   = require("express")
  , Resource  = require("express-resource")
  , dnode     = require("dnode")
  , colors    = require('colors')
  , path      = require('path')
  ;
  
var extractName = require('./libs/utils/namespace').extractName
  , oo = require('./libs/utils/oo');
  
/******************************************************************************
 * OPTIONS
 */
var USE_UGLIFY_JS = false;

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
  , CLIENT_LIBS_DIR = path.join(CLIENT_DIR_NAME, 'libs')
  , CLIENT_STATIC_DIR = path.join(CLIENT_DIR_NAME, 'static')
  
  /* namespace constants */
  , CONTROLLER_SUFFIX = '_controller'
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
  
  var top_dir = app._rocket.app_dir;
   
  function buildWrapper(name, method, has_view, dir) {
    return function(req, res) {
      var methods = require(path.join(dir, CONTROLLERS_DIR_NAME, name + CONTROLLER_SUFFIX));
        
      if(!req.xhr && has_view) {
        var oSend = res.send;
        res.send = function(obj) {
          obj = obj || {};
          
          res.send = oSend;
          
          res.render(path.join(dir, VIEWS_DIR_NAME, name,  [name, method, 'jade'].join('.') ), _.extend(obj, {controller: name}) );
        };
      }    
      methods[method](req, res);
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
      , controller_methods = _.functions(require(path.join(dir, CONTROLLERS_DIR_NAME, name + CONTROLLER_SUFFIX)))
      ;

    if (app._rocket.routes.indexOf(name) !== -1) {
      throw("Route already in use");
    }

    if (has_view) {
      // Get the methods for which views exist
      view_methods_files = fs.readdirSync(path.join(dir, VIEWS_DIR_NAME, name));
      

      for(var i = 0; i < view_methods_files.length; i++) {
        split = view_methods_files[i].split('.');
        if(split[0] === name) {
          view_methods.push(split[split.length - 2]);
        }
      }
    }

    for(var i = 0; i < controller_methods.length; i++) {
      var method_view = false;

      if(view_methods.indexOf(controller_methods[i]) !== -1) {
        method_view = true;
      }
      
      wrapped_funcs[controller_methods[i]] = buildWrapper(name, controller_methods[i], method_view, dir);
    }

    if (name === 'root') {
      app.resource(wrapped_funcs);
    } else {
      app.resource(name, wrapped_funcs);
    }
  }

  /**
   * Gets the name of each controller and searches through the view folder
   * to see wether it finds a corresponding view
   */
  function searchFolders(dir) {    
    var controllers = []
      , views = []
      , has_view = false
      , split = []
      ;
  
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
    
      //Gets dir/name.controller.js and returns name
      var controller = extractName( controllers[i]
                                  , {extension: true , suffix: CONTROLLER_SUFFIX}
                                  );

      if(views.indexOf(controller) !== -1) { has_view = true; }

      setController(controller, has_view, dir);
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
  var models_files = fs.readdirSync(path.join(app._rocket.app_dir, MODELS_DIR_NAME));
  
  for(var i = 0; i < models_files.length; i++) {
    if(models_files[i] === DATASOURCES_DIR_NAME) {
      continue;
    }
    var myModel = require(path.join(app._rocket.app_dir, MODELS_DIR_NAME, models_files[i]));
    myModel.initialize();
  }
}

/******************************************************************************
 * Compile exports
 */ 
function compileExports(app) {
  var dirs
    , plugins
    , exported_dirs = {'': path.join(app._rocket.app_dir, EXPORT_DIR_NAME)}
    , myExports = {};
  
  // Add plugin exports to EXPORT_DIRS
  if(missing.indexOf(PLUGINS_DIR_NAME) === -1){
    try{
      plugins = fs.readdirSync(path.join(app._rocket.app_dir, PLUGINS_DIR_NAME));
      for(var i = 0; i < plugins.length; i++) {
        exported_dirs[plugins[i]] = path.join(app._rocket.app_dir, PLUGINS_DIR_NAME, plugins[i], EXPORT_DIR_NAME);
      }
    }catch(err){
      if(err.code == 'ENOENT') {
            console.log('!!! WARNING No `plugins` dir found in project. Skipping plugin exports...'.yellow);
            missing.push(PLUGINS_DIR_NAME);
      }else{
        throw(err);
      }
    }
  }
  
  for(var export_name in exported_dirs) {
    var container;
    
    if(export_name === '') {
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
        throw(err);
      }
    }
  }
  
  if(myExports !== {}) {
    app._rocket.dnode = dnode(myExports);
  }
  
}

/******************************************************************************
 * UTILITY FUNCTIONS
 */
function uglifyFilter(orig_code) {
  var jsp = require("uglify-js").parser
    , pro = require("uglify-js").uglify
    , ast = jsp.parse(orig_code); // parse code and get the initial AST
    
  ast = pro.ast_mangle(ast);      // get a new AST with mangled names
  ast = pro.ast_squeeze(ast);     // get an AST with compression optimizations
  return pro.gen_code(ast);       // compressed code here
};

/******************************************************************************
 * EXPORTS
 */
var package_JSON = fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'); 
var package_info = JSON.parse(package_JSON);

var rocket = {
    version: package_info.version
  , resources: require('./libs/resources')
  , utils: require('./libs/utils')
  , createServer: function createServer_rocket(app_dir) {
      var app = express.createServer();
      
      app._rocket = {};
      app._rocket.routes = [];
      
      app._rocket.app_dir = app_dir;
      
      //replace listen on app
      var express_listen = app.listen;
      app.listen = function () {
        var ret = express_listen.apply(this, arguments);
        if(missing.indexOf(EXPORT_DIR_NAME) === -1 ) {
          app._rocket.dnode.listen(app);
        }
        return ret;
      }
      
      //default configuration
      app.configure(function() {
        app.set("view engine", 'jade');
        app.set("views", path.join(app._rocket.app_dir, VIEWS_DIR_NAME));
        app.register(".jade",require('jade'));
        
        app.use(express.methodOverride());
        
        app.use('/static', express.static(path.join(app._rocket.app_dir, CLIENT_STATIC_DIR)));
        app.use(express.bodyParser());
        app.use(require('browserify')({
            base : [path.join(app._rocket.app_dir, CLIENT_LIBS_DIR)]
          , mount : '/browserify.js'
          , filter:  (USE_UGLIFY_JS ? uglifyFilter : undefined)
          , require: ['dnode', 'traverse']
          }));
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
