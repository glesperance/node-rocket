var rocket = require("rocket");
var express = require("express");
var Resource = require("express-resource");
var dnode = require("dnode");
var fs = require("fs");
var _ = require("underscore");

/******************************************************************************
 * OPTIONS
 */

var USE_UGLIFY_JS = true;

/******************************************************************************
 * CONSTANTS
 */
var LISTEN_PORT = 3000;

var APP_DIR = __dirname;
var VIEWS_DIR = APP_DIR + "/views/";
var PLUGIN_DIR = APP_DIR + "/plugins/";
var EXPORT_DIRS = [APP_DIR + "/exports/"];

var CLIENT_DIR = APP_DIR + "/client/";
var CLIENT_LIBS_DIR = CLIENT_DIR + "/libs/";
var CLIENT_STATIC_DIR = CLIENT_DIR + "/static/";

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
}

function setupMiddlewares(app) {
  app.use(express.bodyParser());
  app.use('/static', express.static(CLIENT_STATIC_DIR));

  app.use(require('browserify')({
      base : CLIENT_LIBS_DIR,
      mount : '/browserify.js',
      filter:  (USE_UGLIFY_JS ? uglifyFilter : undefined),
      require: ['dnode']
  }));
}

/******************************************************************************
 * MAIN
 */

//Create the express server app.
var app = express.createServer();

//Setup Jade view engine
app.set("view engine", 'jade');
app.set("views", VIEWS_DIR);
app.register(".jade",require('jade'));

app._rocket_routes = [];

//Call rocket's controller setup routine
rocket.setupControllers(
  app,
  APP_DIR,
  function finishSetupAndStart(app) {
    var dirs
      , plugins
      , myExports = {};

    setupMiddlewares(app);

    app.listen(LISTEN_PORT);

    // Add plugin exports to EXPORT_DIRS
    plugins = fs.readdirSync(PLUGIN_DIR);
    for(var i = 0; len = plugins.length, i < len; i++) {
      EXPORT_DIRS.push(PLUGIN_DIR + plugins[i] + '/');
    }

    for(var i = 0; len = EXPORT_DIRS.length, i < len; i++) {
      dirs = fs.readdirSync(EXPORT_DIRS[i]);

      for (var j = 0; len = dirs.length, i < len; i++) {
        var objName = dirs[j].split(".")[0]
          , obj = require(EXPORT_DIRS[i] + dirs[j]);

          myExports[objName] = obj;
      }
    }
    
    dnode(myExports).listen(app);
  }
);
