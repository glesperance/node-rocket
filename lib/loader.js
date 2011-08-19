var express     = require('express')
  , async       = require('async')
  ;

var asyncFs     = require('./util/async_fs')
  , dadt        = require('./util/dadt')
  
  , config      = require('./config')
  
  , CLIENT_DIR_NAME       = config.CLIENT_DIR_NAME
  , CONTROLLERS_DIR_NAME  = config.CONTROLLERS_DIR_NAME
  , EXPORTS_DIR_NAME      = config.EXPORTS_DIR_NAME
  , VIEWS_DIR_NAME        = config.VIEWS_DIR_NAME
  ;

var client      = require('./client')
  , controller  = require('./controller')
  , export      = require('./export')
  , view        = require('./view')
  ;

/******************************************************************************
 * createServer
 */
exports.createServer = function createServer_rocket() {
  
  var args            = Array.prototype.slice.call(arguments)
    , app_dir         =  args.shift()
    
    , app             = express.createServer()
    , express_listen  = app.listen
    
    , routes          = dadt.createNode()
    ;
  
  asyncFs.mapDir(
      
      app_dir
      
    , [ 
        
        [ CLIENT_DIR_NAME       , async.apply(client.setup, app)              ]
      
      , [ CONTROLLERS_DIR_NAME  , async.apply(controller.setup, app, routes)  ]
      
      , [ EXPORTS_DIR_NAME      , async.apply(export.setup, app)              ]
      
      , [ VIEWS_DIR_NAME        , async.apply(view.setup, app, routes)        ]
      
      ]
    
    , function(err) { callback(err, app); }
  
  );
  
}
/*

exports.createServer = function createServer_rocket() {

  app.rocket = {};
  app.rocket.routes = [];
  app.rocket.controllers = {};
  
*/
