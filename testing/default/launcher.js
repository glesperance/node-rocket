var rocket = require("node-rocket");
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
var APP_DIR = __dirname;
var VIEWS_DIR = APP_DIR + "/views/";
var EXPORTS_DIR = APP_DIR + "/exports";

var CLIENT_DIR = APP_DIR + "/client/";
var CLIENT_LIBS_DIR = CLIENT_DIR + "/libs/";
var CLIENT_STATIC_DIR = CLIENT_DIR + "/static/";

/******************************************************************************
 * UTILITY FUNCTIONS
 */
 
function uglifyFilter(orig_code) {
  var jsp = require("uglify-js").parser;
  var pro = require("uglify-js").uglify;
  var ast = jsp.parse(orig_code); // parse code and get the initial AST
  ast = pro.ast_mangle(ast);      // get a new AST with mangled names
  ast = pro.ast_squeeze(ast);     // get an AST with compression optimizations
  return pro.gen_code(ast);       // compressed code here
}

function setupMiddlewares(err, app) {
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
app.express.set("views", VIEWS_DIR);
app.express.register(".jade",require('jade'));

//Call rocket's controller setup routine
rocket.setupControllers(
  app, 
  APP_DIR, 
  
  function finishSetupAndStart(err, app) {
    
    var dirs;
    var myExports = {};
    
    if(err){
      throw(err);
    }
    
    setupMiddlewares(app);
    
    app.listen(LISTEN_PORT);
    
    dirs = fs.readdirSync(EXPORTS_DIR);
    
    
    
    _.each(dirs,function dnodeExporter(file) {
      var objName = file.split(".")[0];
      var obj = require(file);
      myExports[objName] = obj;
    });
    
    dnode(myExports).listen(app);
  }
);
