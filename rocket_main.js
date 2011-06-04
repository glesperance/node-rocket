var fs = require("fs")
  , _ = require("underscore")
  , express = require("express")
  , Resource = require("express-resource")
  , dnode = require("dnode");
  
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
var MODELS_DIR      = "/models/"
  , VIEWS_DIR       = "/views/"
  , CONTROLLERS_DIR = "/controllers/"
  , PLUGINS_DIR     = "/plugins/"
  , EXPORT_DIR      = "/exports/"
  , CLIENT_DIR      = "/client/"
  , DATASOURCES_DIR  = "datasources"
  
  /* client specific dirs */
  , CLIENT_LIBS_DIR = CLIENT_DIR + "/libs/"
  , CLIENT_STATIC_DIR = CLIENT_DIR + "/static/"
  
  /* namespace constants */
  , CONTROLLER_SUFFIX = "_controller"
  ;

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
      var methods = require(dir + CONTROLLERS_DIR + name + CONTROLLER_SUFFIX);
        
      if(!req.xhr && has_view) {
        var oSend = res.send;
        res.send = function(obj) {
          obj = obj || {};
          
          res.send = oSend;
          
          res.render(dir + VIEWS_DIR + name + '/' + name + '.' +  method + '.jade', _.extend(obj, {controller: name}));
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
      , view_methods = []
      , split = []
      , controller_methods = _.functions(require(dir + CONTROLLERS_DIR + name + CONTROLLER_SUFFIX));

    if (app._rocket.routes.indexOf(name) !== -1) {
      throw("Route already in use");
    }

    if (has_view) {
      // Get the methods for which views exist
      view_methods = fs.readdirSync(dir + VIEWS_DIR + name);

      for(var i = 0; i < view_methods.length; i++) {
        split = view_methods[i].split('.');
        view_methods[i] = split[split.length - 2];
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
    var controllers = fs.readdirSync(dir + CONTROLLERS_DIR)
      , views = fs.readdirSync(dir + VIEWS_DIR)
      , has_view = false
      , split = [];

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
    var plugins = fs.readdirSync(top_dir + PLUGINS_DIR);

    searchFolders(top_dir);

    for(var i = 0; i < plugins.length; i++) {
      searchFolders(top_dir + PLUGINS_DIR + plugins[i]);
    }

    //callback(app);
  }

  init();
}
    
/******************************************************************************
 * Models Setup
 */  
function setupModels(app) {
  var models_files = fs.readdirSync(app._rocket.app_dir + MODELS_DIR);
  
  for(var i = 0; i < models_files.length; i++) {
    if(models_files[i] === DATASOURCES_DIR) {
      continue;
    }
    var myModel = require(app._rocket.app_dir + MODELS_DIR + models_files[i]);
    myModel.initialize();
  }
}

/******************************************************************************
 * Compile exports
 */ 
function compileExports(app) {
  var dirs
    , plugins
    , exported_dirs = {'': app._rocket.app_dir + EXPORT_DIR}
    , myExports = {};
  
  // Add plugin exports to EXPORT_DIRS
  plugins = fs.readdirSync(app._rocket.app_dir + PLUGINS_DIR);
  for(var i = 0; i < plugins.length; i++) {
    exported_dirs[plugins[i]] = app._rocket.app_dir + PLUGINS_DIR + plugins[i] + '/' + EXPORT_DIR;
  }
  
  for(var export_name in exported_dirs) {
    var container;
    
    if(export_name === '') {
      container = myExports;
    }else{
      myExports[export_name] = {};
      container = myExports[export_name];
    }
    
    dirs = fs.readdirSync(exported_dirs[export_name]); 
    
    for (var j = 0; j < dirs.length; j++) {
      var objName = dirs[j].split(".")[0]
        , obj = require(exported_dirs[export_name] + dirs[j]);
  
        container[objName] = obj;
    }
  }
  
  app._rocket.dnode = dnode(myExports);
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
var package_JSON = fs.readFileSync(__dirname + '/package.json', 'utf8'); 
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
        app._rocket.dnode.listen(app);
        return ret;
      }
      
      //default configuration
      app.configure(function() {
        app.set("view engine", 'jade');
        app.set("views", app._rocket.app_dir + VIEWS_DIR);
        app.register(".jade",require('jade'));
        
        
        app.use('/static', express.static(app._rocket.app_dir + CLIENT_STATIC_DIR));

        app.use(express.bodyParser());
        app.use(require('browserify')({
          base : app._rocket.app_dir + CLIENT_LIBS_DIR,
          mount : '/browserify.js',
          filter:  (USE_UGLIFY_JS ? uglifyFilter : undefined),
          require: ['dnode']
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